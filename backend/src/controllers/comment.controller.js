import db from "../db/mysql.js"
import redis from "../db/redis.js"
import mongoose from "mongoose"
import Comment from "../models/mongo/Comment.js"

/* ================= DEPTH HELPER ================= */
const getDepth = async (parentId) => {
  let depth = 1
  let current = parentId

  while (current) {
    const parent = await Comment.findById(current, "parentId").lean()
    if (!parent) break
    current = parent.parentId
    depth++
    if (depth > 3) break
  }

  return depth
}

/* ================= GET COMMENTS ================= */
export const getComments = async (req, res) => {
  try {
    const { discussionId } = req.params

    const comments = await Comment.find({ discussionId })
      .sort({ created_at: 1 })
      .lean()

    // ✅ ดึง like count จาก Redis สำหรับทุก comment (รวม nested)
    const pipeline = redis.multi();
    const commentIdToIdx = {};

    comments.forEach((c, idx) => {
      commentIdToIdx[c._id.toString()] = idx;
      pipeline.get(`comment:likes:${c._id.toString()}`);
    });
    const likeCounts = await pipeline.exec();

    const map = {}
    const roots = []

    comments.forEach((c, idx) => {
      map[c._id] = {
        ...c,
        id: c._id.toString(),
        likesCount: Number(likeCounts[idx] || 0), // ✅ เพิ่ม like count
        replies: []
      }
    })

    comments.forEach(c => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c._id])
      } else {
        roots.push(map[c._id])
      }
    })

    const MAX_DEPTH = 3
    const trimDepth = (nodes, depth = 1) =>
      nodes.map(node => ({
        ...node,
        replies: depth >= MAX_DEPTH ? [] : trimDepth(node.replies, depth + 1)
      }))

    res.json(trimDepth(roots))

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "load comments failed" })
  }
}

/* ================= CREATE COMMENT ================= */
export const createComment = async (req, res) => {
  try {
    const { discussionId, parentId, message, user } = req.body

    if (parentId) {
      const depth = await getDepth(parentId)
      if (depth > 3) {
        return res.status(400).json({ error: "reply depth limit reached" })
      }
    }

    const newComment = await Comment.create({
      discussionId: Number(discussionId),
      parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
      userId: user.id,
      username: user.username,
      role: user.role,
      message
    })

    // ✅ Initialize Redis like count เป็น 0
    const commentId = newComment._id.toString();
    await redis.set(`comment:likes:${commentId}`, 0);

    // ⭐ Atomic +1 (เร็วมาก)
    await db.query(
      `UPDATE discussions 
       SET comment_count = comment_count + 1
       WHERE discussion_id = ?`,
      [discussionId]
    )

    res.json(newComment)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "create comment failed" })
  }
}

/* ================= UPDATE COMMENT ================= */
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    const updated = await Comment.findByIdAndUpdate(
      id,
      { message, updated_at: new Date() },
      { new: true }
    )

    if (!updated) return res.status(404).json({ error: "not found" })
    res.json(updated)

  } catch (err) {
    res.status(500).json({ error: "update failed" })
  }
}

/* ================= DELETE COMMENT ================= */
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params

    const first = await Comment.findById(id).lean()
    if (!first) return res.status(404).json({ error: "not found" })

    const did = Number(first.discussionId)

    // ดึงเฉพาะกระทู้
    const all = await Comment.find({ discussionId: did }, "_id parentId").lean()

    const childrenMap = {}
    all.forEach(c => {
      const key = c.parentId ? c.parentId.toString() : null
      if (!childrenMap[key]) childrenMap[key] = []
      childrenMap[key].push(c._id.toString())
    })

    const toDelete = []
    const stack = [id]

    while (stack.length) {
      const current = stack.pop()
      toDelete.push(current)
      stack.push(...(childrenMap[current] || []))
    }

    await Comment.deleteMany({ _id: { $in: toDelete } })

    // ⭐ Atomic -N
    await db.query(
      `UPDATE discussions 
       SET comment_count = GREATEST(comment_count - ?, 0)
       WHERE discussion_id = ?`,
      [toDelete.length, did]
    )

    res.json({ deleted: toDelete.length })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "delete failed" })
  }
}
