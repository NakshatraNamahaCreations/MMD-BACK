import express, { Router } from "express";
import {
  createLead,
  createOrUpdateFollowUp,
  deleteLead,
  getAllLeads,
  getOverdueLead,
  updateLeadAssign,
} from "../controllers/leadController.js";

const router = express.Router();

router.post("/createLead", createLead);
router.get("/getLeads/", getAllLeads);
router.delete("/deleteLead/:leadId", deleteLead);
router.put("/updateAssign", updateLeadAssign);
router.put("/getOverdueLead", getOverdueLead);
router.post("/follow-up", createOrUpdateFollowUp);

export default router;
