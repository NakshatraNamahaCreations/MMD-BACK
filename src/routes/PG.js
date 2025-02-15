import PaytmChecksum  from "paytmchecksum";
import PaymentModel from "../models/PG.js"; // Ensure your model is correctly imported
import express from "express";


const router = express.Router();
import Lead from "../models/Lead.js";


// Paytm Config
const paytmConfig = {
    MID: "MAKEMY09422872921500",
    MERCHANT_KEY: "Wi%SmC%mkRR%jP8M",
    WEBSITE: "DEFAULT",
    INDUSTRY_TYPE_ID: "Retail",
    CHANNEL_ID: "WEB",
    CALLBACK_URL: "http://localhost:9000/api/PG/paytm/callback",
};

router.post("/paytm/initiate", async (req, res) => {
    try {
        const { CUST_ID, TXN_AMOUNT, SERVICE, ORDER_ID } = req.body;

        console.log("Received ORDER_ID:", ORDER_ID, typeof ORDER_ID);  // Debugging

        if (!CUST_ID || !TXN_AMOUNT || !SERVICE || !ORDER_ID) {
            return res.status(400).json({ status: "error", message: "Missing required parameters" });
        }

        let paramList = {
            MID: paytmConfig.MID,
            ORDER_ID: ORDER_ID, // Make sure this is dynamically assigned
            CUST_ID: CUST_ID,
            INDUSTRY_TYPE_ID: paytmConfig.INDUSTRY_TYPE_ID,
            CHANNEL_ID: paytmConfig.CHANNEL_ID,
            TXN_AMOUNT: TXN_AMOUNT,
            WEBSITE: paytmConfig.WEBSITE,
            CALLBACK_URL: `${paytmConfig.CALLBACK_URL}?orderid=${ORDER_ID}&service=${SERVICE}`,
        };

        console.log("Param List Before Checksum:", paramList); // Debugging

        const checksum = await PaytmChecksum.generateSignature(paramList, paytmConfig.MERCHANT_KEY);
        paramList.CHECKSUMHASH = checksum;

        res.json({ status: "success", ORDER_ID, CHECKSUMHASH: checksum, paramList });
    } catch (error) {
        console.error("Error initiating Paytm payment:", error);
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
});



router.post("/paytm/callback", async (req, res) => {
    try {
        console.log("Paytm Callback Received:", req.body);

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "Empty callback response." });
        }

        const { CHECKSUMHASH, ...paramList } = req.body; // Extract checksum and parameters
        const {  orderid } = req.query; // Extract service & orderId from URL

        if (!CHECKSUMHASH) {
            console.error("Missing CHECKSUMHASH in response.");
            return res.status(400).json({ success: false, message: "Missing CHECKSUMHASH in callback response." });
        }

        // Ensure MERCHANT_KEY is defined
        if (!paytmConfig.MERCHANT_KEY) {
            console.error("Paytm MERCHANT_KEY is not defined.");
            return res.status(500).json({ success: false, message: "Paytm configuration error" });
        }

        // Verify checksum using Paytm's library
        const isValidChecksum = await PaytmChecksum.verifySignature(paramList, paytmConfig.MERCHANT_KEY, CHECKSUMHASH);
        if (!isValidChecksum) {
            console.error("Checksum verification failed.");
            return res.status(400).json({ success: false, message: "Checksum verification failed." });
        }

        // Determine Payment Status
        const paymentStatus = paramList.STATUS === "TXN_SUCCESS" ? "PAID" : "UNPAID";

        if (!orderid) {
            console.error("Order ID is missing.");
            return res.status(400).json({ success: false, message: "Order ID is missing." });
        }

        // Update transaction status in MongoDB
        const transaction = await Lead.findOneAndUpdate(
            { PGID: orderid },
            { paymentStatus },
            { new: true }
        );

        if (!transaction) {
            console.error(`Transaction not found for Order ID: ${orderid}`);
            return res.status(404).json({ success: false, message: "Transaction not found." });
        }

        console.log(`Payment status updated to ${paymentStatus} for Order ID: ${orderid}`);

        // Redirect user to success or failure page
        const successRedirectURL = `https://makemydocuments.in/paymentsuccess?service=${service}`;
        const failureRedirectURL = `https://makemydocuments.in/paymentfailure?service=${service}`;
        
        return res.redirect(paymentStatus === "PAID" ? successRedirectURL : failureRedirectURL);
    } catch (error) {
        console.error("Error processing Paytm callback:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


export default router;