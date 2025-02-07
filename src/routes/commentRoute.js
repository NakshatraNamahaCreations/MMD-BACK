import express from "express";
import { addComment, getComment } from "../controllers/commentController.js";

const router = express.Router();

router.post("/addComment", addComment);
router.get("/getComment", getComment);

export default router;
