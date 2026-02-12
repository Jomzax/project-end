import express from "express";

// controllers
import { register, login } from "../controllers/auth.controller.js";
import { createDiscussion } from "../controllers/discussion.controller.js";
import { getCategoryDropdown } from "../controllers/category.controller.js";
import { updateDiscussionContent } from "../controllers/discussion.controller.js";

const router = express.Router();

/* ================= AUTH ================= */
router.post("/auth/register", register);
router.post("/auth/login", login);

/* ================= CATEGORY ================= */
router.get("/category/dropdown", getCategoryDropdown);

/* ================= DISCUSSION ================= */
router.post("/discussion", createDiscussion);
router.put("/discussion-content", updateDiscussionContent);


export default router;
