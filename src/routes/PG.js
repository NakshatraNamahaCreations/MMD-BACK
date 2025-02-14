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
    CALLBACK_URL: "https://api.makemydocuments.in/api/PG/paytm/callback",
};

router.post("/paytm/initiate", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ status: "error", message: "Invalid request payload" });
        }

        const leadData = req.body;
        
        // Removing empty keys
        Object.keys(leadData).forEach((key) => {
            if (leadData[key] === "" || leadData[key] === null || leadData[key] === undefined) {
                delete leadData[key]; 
            }
        });

        let ORDER_ID;

        if (leadData.id) {
            // ✅ Update existing lead
            const updatedLead = await Lead.findOneAndUpdate(
                { orderId: leadData.id },
                { $set: leadData },
                { new: true }
            );
            ORDER_ID = leadData.id;
        } else {
            // ✅ Generate new ORDER_ID
            const lastLead = await Lead.findOne({}, { orderId: 1 })
                .sort({ orderId: -1 })
                .collation({ locale: "en", numericOrdering: true });

            const lastId = lastLead?.orderId
                ? parseInt(lastLead.orderId.replace("MMD2025", ""), 10) + 1
                : 1;
                
            ORDER_ID = `MMD2025${String(lastId).padStart(4, "0")}`;
            
            const newLead = new Lead({ ...leadData, orderId: ORDER_ID });
            await newLead.save();
        }

        // ✅ Extracting Parameters
        const { CUST_ID, TXN_AMOUNT, SERVICE } = req.body;

        if (!CUST_ID || !TXN_AMOUNT || !SERVICE) {
            return res.status(400).json({ status: "error", message: "Missing required parameters" });
        }

        // ✅ Prepare Paytm Parameters
        let paramList = {
            MID: paytmConfig.MID,
            ORDER_ID: ORDER_ID,
            CUST_ID: CUST_ID,
            INDUSTRY_TYPE_ID: paytmConfig.INDUSTRY_TYPE_ID,
            CHANNEL_ID: paytmConfig.CHANNEL_ID,
            TXN_AMOUNT: TXN_AMOUNT,
            WEBSITE: paytmConfig.WEBSITE,
            CALLBACK_URL: `${paytmConfig.CALLBACK_URL}?orderid=${ORDER_ID}`,
        };

        // ✅ Generate Checksum using Paytm Utility
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
            { orderId: orderid },
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