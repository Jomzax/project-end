import express from "express";

// controllers
import { register, login } from "../controllers/auth.controller.js";
import { getCategoryDropdown } from "../controllers/category.controller.js";
import { getComments, createComment, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { createDiscussion, getAllDiscussions, getDiscussionDetail, getDiscussionById, updateDiscussionContent, deleteDiscussion, incrementView } from "../controllers/discussion.controller.js";
import { getForumStats } from "../controllers/stats.controller.js"
import { toggleLike, getLikeStatus } from "../controllers/like.controller.js"
import { authRequired } from "../middlewares/auth.js"

const router = express.Router();

/* ================= AUTH ================= */
router.post("/auth/register", register);
router.post("/auth/login", login);

/* ================= CATEGORY ================= */
router.get("/category/dropdown", getCategoryDropdown);

/* ================= DISCUSSION ================= */
router.get("/discussion", getAllDiscussions);
router.post("/discussion", createDiscussion);
router.get("/discussion/:id", getDiscussionById);
router.get("/discussion/:id/detail", getDiscussionDetail);
router.put("/discussion/:id", updateDiscussionContent);
router.delete("/discussion/:id", deleteDiscussion);
router.post("/discussion/:id/view", incrementView);

/* ================= COMMENT ================= */
router.get("/comment/:discussionId", getComments)
router.post("/comment", createComment)
router.patch("/comment/:id", updateComment)
router.delete("/comment/:id", deleteComment)

/* ================= STATS ================= */
router.get("/stats", getForumStats);

/* ================= LIKE ================= */
router.post("/discussion/:postId/like", authRequired, toggleLike)
router.get("/discussion/:postId/like", authRequired, getLikeStatus)

export default router;
