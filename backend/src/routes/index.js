import express from "express";

// controllers
import { register, login } from "../controllers/auth.controller.js";
import { getAllUsers, getAdminUsers, makeUserAdmin, removeAdminStatus, getMyProfile, checkMyUsernameAvailability, updateMyProfile } from "../controllers/user.controller.js";
import { getCategoryDropdown, updateCategory, createCategory, deleteCategory } from "../controllers/category.controller.js";
import { getComments, createComment, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { createDiscussion, getAllDiscussions, getDiscussionDetail, getDiscussionById, updateDiscussionContent, deleteDiscussion, incrementView } from "../controllers/discussion.controller.js";
import { getForumStats } from "../controllers/stats.controller.js"
import { toggleLike, getLikeStatus } from "../controllers/like.controller.js"
import { authRequired, adminRequired } from "../middlewares/auth.js"
import { checkBan } from "../middlewares/checkBan.js";
import { createReportComment, getAllReportComments, deleteReportComment, updateReportCommentStatus } from "../controllers/report.comment.controller.js";
import { createReportPost, getAllReportPosts, deleteReportPost, updateReportPostStatus } from "../controllers/report.post.controller.js";
import { unbanUser, checkUserBan, banUser, getAllBans } from "../controllers/ban.controller.js";
import { toggleCommentLike, getCommentsLikeStatus } from "../controllers/comment.like.controller.js";

const router = express.Router();

/* ================= AUTH ================= */
router.post("/auth/register", register);
router.post("/auth/login", login);

/* ================= USER ================= */
router.get("/user/me", authRequired, checkBan, getMyProfile);
router.get("/user/check-username", authRequired, checkBan, checkMyUsernameAvailability);
router.put("/user/me", authRequired, checkBan, updateMyProfile);
router.get("/user", getAllUsers);
router.get("/admin/users", authRequired, checkBan, adminRequired, getAdminUsers);
router.put("/admin/users/:id/make-admin", authRequired, checkBan, adminRequired, makeUserAdmin);
router.put("/admin/users/:id/remove-admin", authRequired, checkBan, adminRequired, removeAdminStatus);

/* ================= BAN ================= */
router.get("/admin/bans", authRequired, checkBan, adminRequired, getAllBans);
router.post("/admin/users/:user_id/ban", banUser);
router.delete("/admin/users/:user_id/ban", unbanUser);
router.get("/admin/users/:user_id/ban", checkUserBan);

/* ================= REPORT COMMENT ================= */
router.post("/comments/:comment_id/report", authRequired, checkBan, createReportComment);
router.get("/admin/reports/comments", authRequired, checkBan, adminRequired, getAllReportComments);
router.delete("/admin/reports/comments/:id", authRequired, checkBan, adminRequired, deleteReportComment);
router.patch("/admin/reports/comments/:id/status", authRequired, checkBan, adminRequired, updateReportCommentStatus);

/* ================= REPORT POST ================= */
// user รายงานโพสต์ (ต้อง login + ไม่โดนแบน)
router.post("/discussion/:post_id/report", authRequired, checkBan, createReportPost);
router.get("/admin/reports", authRequired, checkBan, adminRequired, getAllReportPosts);
router.delete("/admin/reports/:id", authRequired, checkBan, adminRequired, deleteReportPost);
router.patch("/admin/reports/:id/status", authRequired, checkBan, adminRequired, updateReportPostStatus);

/* ================= CATEGORY ================= */
router.get("/category/dropdown", getCategoryDropdown);
router.post("/category", createCategory);
router.put("/category/:id", updateCategory);
router.delete("/category/:id", deleteCategory);

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
router.post("/discussion/:postId/like", authRequired, checkBan, toggleLike)
router.get("/discussion/:postId/like", authRequired, checkBan, getLikeStatus)
router.post("/comment/:commentId/like", toggleCommentLike);
router.post("/comment/likes/:discussionId", getCommentsLikeStatus);

export default router;
