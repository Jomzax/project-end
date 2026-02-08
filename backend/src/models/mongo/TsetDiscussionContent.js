import mongoose from "mongoose";

const discussionContentSchema = new mongoose.Schema(
  {
    discussion_id: {
      type: String,
      required: true, // id จาก MySQL (อนาคต)
    },
    author_id: {
      type: Number,
      required: true, // user_id จาก MySQL
    },
    title: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// ชื่อ model = DiscussionContent
export default mongoose.model(
  "webboard",
  discussionContentSchema,
  "DiscussionContent" // บังคับชื่อ collection ให้ตรง
);
