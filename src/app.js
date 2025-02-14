// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import leadRoute from "./routes/leadRoute.js";
import stateRoute from "./routes/stateRoute.js";
import commentRoute from "./routes/commentRoute.js";
import otpRoute from "./routes/otpRoute.js";
import searchRoute from "./routes/searchRoute.js";
import messageRoute from "./routes/messageRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";
import session from "express-session";
import crypto from 'crypto';
import axios from 'axios';

import Paytm from './utils/paytmConfig.js';
import cors from 'cors';
dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT;
const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
const PAYTM_MERCHANT_MID = process.env.PAYTM_MERCHANT_MID;
const PAYTM_MERCHANT_WEBSITE = process.env.PAYTM_MERCHANT_WEBSITE;
const PAYTM_TXN_URL = "https://securegw-stage.paytm.in/order/process"; 
// Middleware
// c:\Users\admin\AppData\Local\Temp\Rar$DRa14560.45622\MMD-BACK-main
// app.use(cors());
// app.use(bodyParser.json());
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true 
}));


app.options("*", cors());
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("mongoDb is connected");
  })
  .catch((err) => {
    console.log(err);
  });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoute);
app.use("/api/lead", leadRoute);
app.use("/api", stateRoute, commentRoute, otpRoute, searchRoute, messageRoute);
app.use("/api/paytm", paymentRoutes);
  
app.get("/api", (req, res) => {
  res.send("API is running...");
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));




// app.post('/initiateTransaction', async (req, res) => {
//   const { orderId, customerId, amount } = req.body;

//   if (!orderId || !customerId || !amount) {
//       return res.status(400).json({ error: "Missing required parameters" });
//   }

//   try {
//       const channelId = Paytm.EChannelId.WEB;
//       const txnAmount = Paytm.Money.constructWithCurrencyAndValue(Paytm.EnumCurrency.INR, amount);
//       const userInfo = new Paytm.UserInfo(customerId);
      
//       const paymentDetailBuilder = new Paytm.PaymentDetailBuilder(channelId, orderId, txnAmount, userInfo);
//       const paymentDetail = paymentDetailBuilder.build();

//       const response = await Paytm.Payment.createTxnToken(paymentDetail);
//       console.log("Transaction Response:", response);

//       if (!response || !response.body || !response.body.txnToken) {
//           return res.status(500).json({ error: "Failed to generate transaction token" });
//       }

//       const txnToken = response.body.txnToken;
//       return res.json({ txnToken, orderId, mid: process.env.PAYTM_MID });

//   } catch (error) {
//       console.error("Error in transaction:", error);
//       return res.status(500).json({ error: error.message });
//   }
// });

// app.post('/callback', async (req, res) => {
//     const { ORDERID } = req.body;

//     const paymentStatusDetailBuilder = new Paytm.PaymentStatusDetailBuilder(ORDERID);
//     const paymentStatusDetail = paymentStatusDetailBuilder.build();

//     try {
//         const response = await Paytm.Payment.getPaymentStatus(paymentStatusDetail);
//         console.log("Payment Status:", response);
//         res.json(response);
//     } catch (error) {
//         console.error("Error fetching payment status:", error);
//         res.status(500).json({ error: error.message });
//     }
// });
const generateChecksum = (params, merchantKey) => {
  const paramsStr = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join("&");

  const hash = crypto.createHmac('sha256', merchantKey).update(paramsStr).digest('hex');
  return hash;
};

app.post('/initiatePayment', async (req, res) => {
  try {
    const { customerId, amount, orderId, industryTypeId, channelId, service } = req.body;

    if (!customerId || !amount || !orderId || !industryTypeId || !channelId || !service) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const paramList = {
      MID: PAYTM_MERCHANT_MID,
      ORDER_ID: orderId,
      CUST_ID: customerId,
      INDUSTRY_TYPE_ID: industryTypeId,
      CHANNEL_ID: channelId,
      TXN_AMOUNT: amount,
      WEBSITE: PAYTM_MERCHANT_WEBSITE,
      CALLBACK_URL: `http://localhost:9000/api/paytm/payment-callback?orderid=${orderId}&service=${service}`,
    };

    // Generate checksum
    const paytmChecksum = await PaytmChecksum.generateSignature(paytmParams, "Wi%SmC%mkRR%jP8M");
    paramList.CHECKSUMHASH = checksum;

    // Submit form data to Paytm
    const formHtml = `
      <html>
        <head>
          <title>Merchant Check Out Page</title>
        </head>
        <body>
          <center><h1>Please do not refresh this page...</h1></center>
          <form method="post" action="${PAYTM_TXN_URL}" name="paytmForm">
            <table border="1">
              <tbody>
                ${Object.keys(paramList).map(key => {
                  return `<input type="hidden" name="${key}" value="${paramList[key]}" />`;
                }).join('')}
                <input type="hidden" name="CHECKSUMHASH" value="${checksum}">
              </tbody>
            </table>
            <script type="text/javascript">
              document.paytmForm.submit();
            </script>
          </form>
        </body>
      </html>
    `;
    
    res.send(formHtml);
  } catch (error) {
    console.error("Payment Initiation Error:", error);
    res.status(500).json({ message: "Error initiating payment." });
  }
});

// Paytm payment callback endpoint
app.post('/payment-callback', async (req, res) => {
  try {
    const paytmResponse = req.body;
    const receivedChecksum = paytmResponse.CHECKSUMHASH;

    // Remove checksum from the response body before verification
    delete paytmResponse.CHECKSUMHASH;

    // Verify the checksum
    const isValidChecksum = await PaytmChecksum.verifySignature(paytmResponse, "Wi%SmC%mkRR%jP8M", receivedChecksum);

    if (!isValidChecksum) {
      console.error("Invalid Checksum - Possible Tampering Detected!");
      return res.status(400).json({ success: false, message: "Invalid checksum" });
    }

    // Process the payment based on the valid checksum
    const { ORDERID, TXNID, TXNAMOUNT, STATUS, RESPMSG, PAYMENTMODE, TXNDATE } = paytmResponse;

    if (!ORDERID || !STATUS) {
      return res.status(400).json({ success: false, message: "Invalid payment response." });
    }

    // Update payment status in the database
    const updatedPayment = await Payment.findOneAndUpdate(
      { orderId: ORDERID },
      { transactionId: TXNID, amount: TXNAMOUNT, paymentStatus: STATUS, paymentMode: PAYMENTMODE, transactionDate: TXNDATE },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    // Optionally update other records like 'Lead' status if needed
    console.log(`Payment status updated: ${ORDERID} is ${STATUS}`);

    return res.status(200).json({
      success: true,
      message: `Payment status updated successfully. orderId: ${ORDERID}, Status: ${STATUS}`,
    });
  } catch (error) {
    console.error("Payment Callback Error:", error);
    return res.status(500).json({ success: false, message: "Payment callback processing failed.", error: error.message });
  }
});

// Function to verify checksum
const verifyChecksum = (params, checksum) => {
  const paramsStr = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join("&");

  const hash = crypto.createHmac('sha256', PAYTM_MERCHANT_KEY).update(paramsStr).digest('hex');
  return hash === checksum;
};

// Start the server

app.listen(PORT, () => {
  console.log("The server is running");
  console.log(`The server is running in port: http:localhost:${PORT}
        `);
});
