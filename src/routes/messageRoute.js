import express from "express";
import {
  sendMessage,
  sendPanMessage,
  sentSeniorCitzen,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/send-sms", sendMessage);
router.post("/send-pan-sms", sendPanMessage);
router.post("/send-senior-citizen", sentSeniorCitzen);

export default router;
