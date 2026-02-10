import express from "express";

// controllers
import { register, login } from "../controllers/auth.controller.js";
import { getCategoryDropdown } from "../controllers/category.controller.js";
import {
  createDiscussionContent,
  getDiscussionContent,
} from "../controllers/discussionContent.test.controller.js";

const router = express.Router();

/* ================= AUTH ================= */
router.post("/auth/register", register);
router.post("/auth/login", login);

/* ================= CATEGORY ================= */
router.get("/category/dropdown", getCategoryDropdown);

/* ================= DISCUSSION ================= */
router.post("/discussion-content", createDiscussionContent);
router.get("/discussion-content", getDiscussionContent);

export default router;
