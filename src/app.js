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
import Paytm from './utils/paytmConfig.js';
import cors from 'cors';
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";



const app = express();
const PORT = process.env.PORT;

// Get the __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") })
// Middleware

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




app.post('/initiateTransaction', async (req, res) => {
  const { orderId, customerId, amount } = req.body;

  if (!orderId || !customerId || !amount) {
      return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
      const channelId = Paytm.EChannelId.WEB;
      const txnAmount = Paytm.Money.constructWithCurrencyAndValue(Paytm.EnumCurrency.INR, amount);
      const userInfo = new Paytm.UserInfo(customerId);
      
      const paymentDetailBuilder = new Paytm.PaymentDetailBuilder(channelId, orderId, txnAmount, userInfo);
      const paymentDetail = paymentDetailBuilder.build();

      const response = await Paytm.Payment.createTxnToken(paymentDetail);
      console.log("Transaction Response:", response);

      if (!response || !response.body || !response.body.txnToken) {
          return res.status(500).json({ error: "Failed to generate transaction token" });
      }

      const txnToken = response.body.txnToken;
      return res.json({ txnToken, orderId, mid: process.env.PAYTM_MID });

  } catch (error) {
      console.error("Error in transaction:", error);
      return res.status(500).json({ error: error.message });
  }
});

app.post('/callback', async (req, res) => {
    const { ORDERID } = req.body;

    const paymentStatusDetailBuilder = new Paytm.PaymentStatusDetailBuilder(ORDERID);
    const paymentStatusDetail = paymentStatusDetailBuilder.build();

    try {
        const response = await Paytm.Payment.getPaymentStatus(paymentStatusDetail);
        console.log("Payment Status:", response);
        res.json(response);
    } catch (error) {
        console.error("Error fetching payment status:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  console.log("The server is running");
  console.log(`The server is running in port: http:localhost:${PORT}
        `);
});
