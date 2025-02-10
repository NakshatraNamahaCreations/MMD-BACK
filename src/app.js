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
dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT;
// Middleware
// app.use(cors());
// app.use(bodyParser.json());
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
app.use("/paytm", paymentRoutes);

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
app.get("/session", (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ message: "No active session" });
  }
  res.status(200).json({ message: "Session active", session: req.session });
});
app.listen(PORT, () => {
  console.log("The server is running");
  console.log(`The server is running in port: http:localhost:${PORT}
        `);
});
