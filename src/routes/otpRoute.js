import express from "express";
import { sendOTP, verifyOTP } from "../controllers/otpController.js";

const router = express.Router();

// Route to send OTP
router.post("/sendOTP", sendOTP);
router.post("/verifyOTP", verifyOTP);

export default router;
