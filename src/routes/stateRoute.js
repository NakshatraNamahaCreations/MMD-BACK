import express from "express";
import {
  getConvertedLead,
  getDeadLead,
  getFollowups,
  getInprogressLead,
  getOverdueLead,
  getStatusCounts,
  todayFollowUp,
  updateLeadStatus,
} from "../controllers/stateController.js";
const router = express.Router();

router.post("/updateStatus", updateLeadStatus);
router.get("/getOverdueLead", getOverdueLead);
router.get("/get-today-lead", todayFollowUp);
router.get("/get-lead-followups", getFollowups);
router.get("/get-inprogress-leads", getInprogressLead);
router.get("/get-converted-leads", getConvertedLead);
router.get("/get-dead-leads", getDeadLead);
router.get("/getStatusCount", getStatusCounts);

export default router;
