

// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import leadRoute from "./routes/leadRoute.js";

dotenv.config({path:'../.env'});

const app = express();
const PORT = process.env.PORT;
// Middleware
// app.use(cors());
// app.use(bodyParser.json());
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('mongoDb is connected');
  })
  .catch((err) => {
    console.log(err);
  });
  app.use(express.json()); 
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoute);
  app.use("/api/lead", leadRoute);

app.get("/api", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT,() => {
    console.log("The server is running");
    console.log(`The server is running in port: http:localhost:${PORT}
        `);
})


