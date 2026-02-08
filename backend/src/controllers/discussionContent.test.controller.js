import DiscussionContent from "../models/mongo/TsetDiscussionContent.js";

// POST: สร้าง discussion content
export const createDiscussionContent = async (req, res) => {
  try {
    const { discussion_id, author_id, title, detail } = req.body;

    // 🔒 validation ขั้นต่ำ (สำคัญมาก)
    if (!discussion_id || !author_id || !title || !detail) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const doc = await DiscussionContent.create({
      discussion_id,
      author_id,
      title,
      detail,
    });

    res.status(201).json({
      message: "DiscussionContent INSERT OK",
      data: doc, // 🔥 ส่ง document จริงจาก Mongo
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create DiscussionContent",
      error: err.message,
    });
  }
};

// GET: ดึง discussion content
export const getDiscussionContent = async (req, res) => {
  const list = await DiscussionContent.find().limit(10);
  res.json(list);
};
