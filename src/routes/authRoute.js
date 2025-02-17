import express from "express";
import {
  forgotPassword,
  login,
  // resetPassword,
  signup,
  verifyOtp,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
// router.post("/forgotPassword", forgotPassword);
// router.post("/forgotPassword", forgotPassword);
// router.post("/forgotPassword", forgotPassword);
router.post("/forgot-password", forgotPassword);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Reset password
// router.post("/reset-password", resetPassword);

export default router;
