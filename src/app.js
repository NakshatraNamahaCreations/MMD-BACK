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
import PaymentModel from "./models/Payment.js";
import paytmConfig from './utils/paytmConfig.js';
import cors from 'cors';
import PaytmChecksum from "paytmchecksum";
import bodyParser from "body-parser";
dotenv.config({ path: "../.env" });
import PG from './routes/PG.js'
const app = express();
const PORT = process.env.PORT;
const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
const PAYTM_MERCHANT_MID = process.env.PAYTM_MID;
const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE;
const PAYTM_TXN_URL = "https://securegw-stage.paytm.in/order/process"; 

// Middleware

// app.use(cors());
// app.use(bodyParser.json());
app.use(cors({
  origin:  "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true 
}));


app.options("*", cors());

// app.use(cors());
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
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json()); 
app.use("/api/PG", PG);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoute);
app.use("/api/lead", leadRoute);
app.use("/api", stateRoute, commentRoute, otpRoute, searchRoute, messageRoute);
app.use("/api/paytm", paymentRoutes);
  
app.get("/api", (req, res) => {
  res.send("API is running...");
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json());


app.listen(PORT, () => {
  console.log("The server is running");
  console.log(`The server is running in port: http:localhost:${PORT}
        `);
});
