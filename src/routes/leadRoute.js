import express, { Router } from "express";
import {
  createLead,
  createOrUpdateFollowUp,
  deleteLead,
  getAllLeads,
  getCounts,
  updateLeadAssign,
} from "../controllers/leadController.js";

const router = express.Router();

router.post("/createLead", createLead);
router.get("/getLeads", getAllLeads);
router.delete("/deleteLead/:leadId", deleteLead);
router.put("/updateAssign", updateLeadAssign);
router.post("/follow-up", createOrUpdateFollowUp);
router.get("/count", getCounts);

export default router;
