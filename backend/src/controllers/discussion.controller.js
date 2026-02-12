import db from "../db/mysql.js";
import DiscussionContent from "../models/mongo/DiscussionContent.js";

const formatDateTime = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

/* ================= CREATE DISCUSSION ================= */
export const createDiscussion = async (req, res) => {


  try {
    const { user_id, category_id, title, detail } = req.body;

    if (!user_id || !category_id || !title || !detail) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const slug = Date.now();

    // 1️⃣ Insert MySQL
    const [result] = await db.query(
      `INSERT INTO discussions 
       (user_id, category_id, title, slug, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [Number(user_id), Number(category_id), title, slug]
    );

    const discussionId = result.insertId;

    // 2️⃣ Insert Mongo
    const now = formatDateTime();

    await DiscussionContent.create({
      discussion_id: discussionId.toString(),
      author_id: Number(user_id),
      title,
      detail,
      created_at: now,
      updated_at: ""
    });

    res.status(201).json({
      success: true,
      discussion_id: discussionId
    });

  } catch (err) {
    console.error("CREATE DISCUSSION ERROR:", err);
    res.status(500).json({
      message: "Failed to create discussion",
      error: err.message
    });
  }
};

/* ================= UPDATE DISCUSSION CONTENT ================= */
export const updateDiscussionContent = async (req, res) => {
  try {
    const { discussion_id, title, detail } = req.body;

    if (!discussion_id) {
      return res.status(400).json({ message: "Missing discussion_id" });
    }

    const now = formatDateTime();

    await DiscussionContent.updateOne(
      { discussion_id: discussion_id },
      {
        $set: {
          title,
          detail,
          updated_at: now   // 🔥 ตรงนี้จะใส่เวลาเมื่อมีการแก้ไข
        }
      }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
