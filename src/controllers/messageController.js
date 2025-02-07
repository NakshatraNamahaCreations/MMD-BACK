import axios from "axios";
import dotenv from "dotenv";
// import config from "../config/env.js";
dotenv.config({ path: "../../.env" });

export const sendMessage = async (req, res) => {
  let variables = "Hleel";
  try {
    const { mobile, name } = req.body;

    if (!mobile) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Mobile number is required.",
      });
    }

    const url = "https://api.msg91.com/api/v5/flow/";
    const payload = {
      flow_id: process.env.MSG91_TEMPLATE_ID,
      sender: process.env.MSG91_SENDER_ID,
      mobiles: mobile,
      name: name || "Customer",
      var2: variables?.var2 || "",
    };

    const headers = {
      authkey: process.env.MSG91_AUTH_KEY,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });
    return res.json({ status: response.status, response: response.data });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to send SMS",
      error: error.message,
    });
  }
};
