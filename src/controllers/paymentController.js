import Payment from "../models/Payment.js";
import Lead from "../models/Lead.js";
import dotenv from "dotenv";
import PaytmChecksum from "paytmchecksum";
import { config } from "../config/paytmConfig.js";

dotenv.config({ path: "../../.env" });

/**
 * 🚀 Initiate Payment Transaction
 */
export const initiatePayment = async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    if (!customerId || !amount) {
      return res.status(400).json({ message: "Customer ID and amount are required." });
    }

    const orderId = "ORDER" + Math.floor(10000 + Math.random() * 90000);

    // Paytm Parameters
    const paytmParams = {
      MID: process.env.PAYTM_MID,
      WEBSITE: process.env.PAYTM_WEBSITE,
      INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE,
      CHANNEL_ID: process.env.PAYTM_CHANNEL_ID, 
      ORDER_ID: orderId,
      CUST_ID: customerId,
      TXN_AMOUNT: amount.toString(),
      CALLBACK_URL: process.env.PAYTM_CALLBACK_URL || "http://localhost:9000/api/payment/callback",
    };


    paytmParams["CHECKSUMHASH"] = await PaytmChecksum.generateSignature(paytmParams, process.env.PAYTM_MERCHANT_KEY);


    await new Payment({ orderId, customerId, amount, paymentStatus: "PENDING" }).save();

    res.json({
      success: true,
      message: "Transaction initiated",
      paytmParams,
      paytmUrl: "https://securegw-stage.paytm.in/order/process",
    });
  } catch (error) {
    console.error("Payment Initiation Error:", error);
    res.status(500).json({ success: false, message: "Payment initiation failed." });
  }
};


export const paymentCallback = async (req, res) => {
  try {
    console.log("🔹 Paytm Callback Received:", req.body);

    const paytmResponse = req.body;
    console.log("🔹 Full Response:", JSON.stringify(paytmResponse, null, 2));

    // Ensure the response contains data and checksum
    if (!paytmResponse || Object.keys(paytmResponse).length === 0) {
      return res.status(400).json({ success: false, message: "Invalid callback request." });
    }

    // Ensure checksum exists
    if (!paytmResponse.CHECKSUMHASH) {
      return res.status(400).json({ success: false, message: "Missing CHECKSUMHASH in callback response." });
    }

    console.log("✅ CHECKSUMHASH Found:", paytmResponse.CHECKSUMHASH);

    // Remove CHECKSUMHASH before checksum verification
    const { CHECKSUMHASH, ...paytmResponseWithoutChecksum } = paytmResponse;

    // Verify the checksum
    const receivedChecksum = CHECKSUMHASH;
    const isValidChecksum = PaytmChecksum.verifySignature(
      paytmResponseWithoutChecksum, 
      config.PAYTM_MERCHANT_KEY, 
      receivedChecksum
    );

    console.log("✅ Valid Checksum:", isValidChecksum);

    if (!isValidChecksum) {
      console.error("❌ Invalid Checksum - Possible Tampering Detected!");
      return res.status(400).json({ success: false, message: "Invalid checksum" });
    }

    console.log("✅ Checksum Verified! Processing Transaction...");

    const { ORDERID, TXNID, TXNAMOUNT, STATUS, RESPMSG, PAYMENTMODE, TXNDATE } = paytmResponse;

    if (!ORDERID || !STATUS) {
      return res.status(400).json({ success: false, message: "Invalid payment response." });
    }

    // Update Payment Record
    const updatedPayment = await Payment.findOneAndUpdate(
      { orderId: ORDERID },
      {
        transactionId: TXNID,
        amount: TXNAMOUNT,
        paymentStatus: STATUS,
        paymentMode: PAYMENTMODE,
        transactionDate: TXNDATE,
      },
      { new: true }
    );

    if (!updatedPayment) {
      console.error(`Payment not found in database for orderId: ${ORDERID}`);
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    // Optionally update Lead record
    const updatedLead = await Lead.findOneAndUpdate(
      { orderId: ORDERID },
      { paymentStatus: STATUS },
      { new: true }
    );

    if (!updatedLead) {
      console.warn(`No Lead found for orderId: ${ORDERID}`);
    }

    console.log(`✅ Payment Status Updated: orderId ${ORDERID} is ${STATUS}`);

    return res.status(200).json({
      success: true,
      message: `Payment status updated successfully. orderId: ${ORDERID}, Status: ${STATUS}`,
    });
  } catch (error) {
    console.error("Payment Callback Error:", error);
    return res.status(500).json({ success: false, message: "Payment callback processing failed.", error: error.message });
  }
};

