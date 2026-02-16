import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    discussionId: {
      type: Number,
      required: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true
    },

    userId: {
      type: Number,
      required: true
    },

    username: {
      type: String,
      required: true
    },

    role: {
      type: String,
      default: "User"
    },

    message: {
      type: String,
      required: true
    },

    created_at: String,
    updated_at: String
  },
  { versionKey: false }
);


// ===== เวลาไทย =====
function thaiTime() {
  return new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Bangkok",
    hour12: false
  });
}


// ===== ตอนสร้าง =====
CommentSchema.pre("save", function () {
  const now = thaiTime();

  if (!this.created_at) {
    this.created_at = now;
  }

  this.updated_at = now;
});


// ===== ตอนแก้ =====
CommentSchema.pre("findOneAndUpdate", function () {
  this.set({ updated_at: thaiTime() });
});

CommentSchema.index({ discussionId: 1 })

export default mongoose.model("Comment", CommentSchema, "Comment");
