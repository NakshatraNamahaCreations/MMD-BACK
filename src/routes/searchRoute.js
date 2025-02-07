import express from "express";
import { searchRecords } from "../controllers/searchController.js";

const router = express.Router();

// Route to search records
router.post("/search", searchRecords);

export default router;
