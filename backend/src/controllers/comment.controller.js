import mongoose from "mongoose"
import Comment from "../models/mongo/Comment.js"


/* ================= DEPTH HELPER ================= */
const getDepth = async (parentId) => {
  let depth = 1
  let current = parentId

  while (current) {
    const parent = await Comment.findById(current).lean()
    if (!parent) break
    current = parent.parentId
    depth++
  }

  return depth
}


/* ================= GET COMMENTS ================= */
export const getComments = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const comments = await Comment.find({ discussionId })
      .sort({ created_at: 1 })
      .lean();

    const map = {};
    const roots = [];

    comments.forEach(c => {
      map[c._id] = {
        ...c,
        id: c._id.toString(),
        replies: []
      };
    });

    comments.forEach(c => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });

    // จำกัดแสดงผล 3 ชั้น
    const MAX_DEPTH = 3;
    const trimDepth = (nodes, depth = 1) =>
      nodes.map(node => ({
        ...node,
        replies: depth >= MAX_DEPTH ? [] : trimDepth(node.replies, depth + 1)
      }));

    res.json(trimDepth(roots));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "load comments failed" });
  }
};


/* ================= CREATE COMMENT ================= */
export const createComment = async (req, res) => {
  try {
    const { discussionId, parentId, message, user } = req.body

    // 🔥 LIMIT 3 ชั้นจริงใน DB
    if (parentId) {
      const depth = await getDepth(parentId)

      if (depth > 3) {
        return res.status(400).json({
          error: "reply depth limit reached (max 3)"
        })
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

    res.json(newComment)

  } catch (err) {
    console.error("CREATE COMMENT ERROR:", err)
    res.status(500).json({ error: "create comment failed" })
  }
}


/* ================= UPDATE COMMENT ================= */
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    if (!message?.trim())
      return res.status(400).json({ error: "message required" })

    const updated = await Comment.findByIdAndUpdate(
      id,
      {
        message,
        updated_at: new Date()
      },
      { new: true }
    )

    if (!updated)
      return res.status(404).json({ error: "comment not found" })

    res.json(updated)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "update failed" })
  }
}




/* ================= DELETE COMMENT ================= */
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const all = await Comment.find().lean();

    const childrenMap = {};
    all.forEach(c => {
      const key = c.parentId ? c.parentId.toString() : null;
      if (!childrenMap[key]) childrenMap[key] = [];
      childrenMap[key].push(c._id.toString());
    });

    const toDelete = [];
    const stack = [id];

    while (stack.length) {
      const current = stack.pop();
      toDelete.push(current);
      stack.push(...(childrenMap[current] || []));
    }

    await Comment.deleteMany({ _id: { $in: toDelete } });

    res.json({ deleted: toDelete });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "delete failed" });
  }
};
