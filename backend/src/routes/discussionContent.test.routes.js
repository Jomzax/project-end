import express from "express";
import {
  createDiscussionContent,
  getDiscussionContent,
} from "../controllers/discussionContent.test.controller.js";

const router = express.Router();

router.post("/discussion-content", createDiscussionContent);
router.get("/discussion-content", getDiscussionContent);

export default router;