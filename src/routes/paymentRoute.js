import express from "express";
import {
  initiatePayment,
  paymentCallback,
} from "../controllers/paymentController.js";
// const {
//   initiatePayment,
//   paymentCallback,
// } = require("../controllers/paymentController");

const router = express.Router();

router.post("/initiate-payment", initiatePayment);
router.post("/payment-callback", paymentCallback);

export default router;
