
import mongoose from "mongoose";
import { type } from "os";

const discussionContentSchema = new mongoose.Schema(
  {
    discussion_id: {
      type: String,
      required: true,
    },
    author_id: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      required: true,
    },
    created_at: {
      type: String,
      default: "",
    },
    updated_at: {
      type: String,
      default: "",
    }
  },
  {
    versionKey: false
  }
);

export default mongoose.model(
  "DiscussionContent",
  discussionContentSchema,
  "DiscussionContent"
);
