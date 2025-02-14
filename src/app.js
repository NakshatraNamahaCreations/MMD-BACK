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
import PaytmChecksum from "paytmchecksum";
import bodyParser from "body-parser";
dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT;
const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
const PAYTM_MERCHANT_MID = process.env.PAYTM_MID;
const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE;
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
app.use(bodyParser.urlencoded({ extended: true })); // ✅ Required to parse Paytm callback
app.use(bodyParser.json()); // ✅ Required for JSON handling

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
app.use(bodyParser.json());




 

app.post("/initiatePayment", async (req, res) => {
  try {
    const { customerId, amount, orderId, industryTypeId, channelId, service } = req.body;

    if (!customerId || !amount || !orderId || !industryTypeId || !channelId || !service) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let paytmParams = {
      MID: PAYTM_MERCHANT_MID,
      ORDER_ID: orderId,
      CUST_ID: customerId,
      INDUSTRY_TYPE_ID: industryTypeId,
      CHANNEL_ID: channelId,
      TXN_AMOUNT: amount.toString(),
      WEBSITE: PAYTM_WEBSITE,
      CALLBACK_URL: `http://localhost:9000/payment-callback`,
      CURRENCY: "INR",
    };

    const checksum = await PaytmChecksum.generateSignature(
      paytmParams,
      PAYTM_MERCHANT_KEY
    );

    paytmParams["CHECKSUMHASH"] = checksum;

    console.log("🔹 Generated Checksum:", checksum);
    console.log("🔹 Final Paytm Params Before Sending to Paytm:", paytmParams);

    const formHtml = `
      <html>
        <head><title>Redirecting...</title></head>
        <body>
          <center><h1>Please do not refresh this page...</h1></center>
          <form method="post" action="https://securegw-stage.paytm.in/order/process" name="paytmForm">
            ${Object.keys(paytmParams)
              .map(
                (key) =>
                  `<input type="hidden" name="${key}" value="${paytmParams[key]}" />`
              )
              .join("")}
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


app.post("/payment-callback", async (req, res) => {
  try {
    console.log("Raw Paytm Callback Response:", req.body);

    if (!req.body.CHECKSUMHASH) {
      console.error("Error: Missing CHECKSUMHASH in Paytm response.");
      return res.status(400).json({ success: false, message: "Missing CHECKSUMHASH", rawData: req.body });
    }

    const paytmResponse = req.body;
    const receivedChecksum = paytmResponse.CHECKSUMHASH;
    delete paytmResponse.CHECKSUMHASH;

    const isValidChecksum = await PaytmChecksum.verifySignature(
      paytmResponse,
      PAYTM_MERCHANT_KEY,
      receivedChecksum
    );

    console.log("Checksum Verification:", isValidChecksum);

    if (!isValidChecksum) {
      console.error("Invalid Checksum - Possible Tampering Detected!");
      return res.status(400).json({ success: false, message: "Invalid checksum" });
    }

    console.log(`Payment Status: ${paytmResponse.STATUS}, Order ID: ${paytmResponse.ORDERID}`);

    if (paytmResponse.STATUS === "TXN_SUCCESS") {
      return res.redirect(`http://localhost:3000/payment-success?orderId=${paytmResponse.ORDERID}`);
    } else {
      return res.redirect(`http://localhost:3000/payment-failed?orderId=${paytmResponse.ORDERID}`);
    }
  } catch (error) {
    console.error("Payment Callback Error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment callback processing failed.",
      error: error.message,
    });
  }
});

console.log("PAYTM_MERCHANT_KEY:", PAYTM_MERCHANT_KEY);





app.listen(PORT, () => {
  console.log("The server is running");
  console.log(`The server is running in port: http:localhost:${PORT}
        `);
});
