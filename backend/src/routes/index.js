import express from "express";

// controllers
import { register, login } from "../controllers/auth.controller.js";
import { getCategoryDropdown } from "../controllers/category.controller.js";
import { createDiscussion, updateDiscussionContent, getAllDiscussions} from "../controllers/discussion.controller.js";
import { getForumStats} from "../controllers/stats.controller.js"

const router = express.Router();

/* ================= AUTH ================= */
router.post("/auth/register", register);
router.post("/auth/login", login);

/* ================= CATEGORY ================= */
router.get("/category/dropdown", getCategoryDropdown);

/* ================= DISCUSSION ================= */
router.get("/discussion", getAllDiscussions);
router.post("/discussion", createDiscussion);
router.put("/discussion-content", updateDiscussionContent);

/* ================= STATS ================= */
router.get("/stats", getForumStats);



export default router;
