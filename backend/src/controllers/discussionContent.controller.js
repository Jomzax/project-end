import DiscussionContent from "../models/mongo/DiscussionContent.js";

export const createDiscussionContent = async (req, res) => {
  try {
    const doc = await DiscussionContent.create(req.body);

    res.json({
      message: "DiscussionContent INSERT OK",
      data: doc,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDiscussionContent = async (req, res) => {
  try {
    const data = await DiscussionContent.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
