import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const generateOTP = () => Math.floor(1000 + Math.random() * 9000);

export const sendOTP = async (req, res) => {
  try {
    const { mobilenumber } = req.body;

    if (!mobilenumber) {
      return res.status(400).json({
        status: "error",
        message: "Mobile number is missing or invalid.",
      });
    }

    const otp = generateOTP();

    const payload = {
      mobile: mobilenumber,
      authkey: process.env.OTP_AUTH_KEY,
      template_id: process.env.OTP_TEMPLATE_KEY,
      otp: otp,
      otp_expiry: 5,
    };

    const response = await axios.post(process.env.MSG91_OTP_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });

    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
      mobile: mobilenumber,
      otp: otp,
      api_response: response.data,
    });
  } catch (error) {
    console.error("OTP Error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { mobilenumber, otp } = req.body;

    if (!mobilenumber || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Mobile number and OTP are required.",
      });
    }

    const url = `${process.env.MSG91_OTP_URL}?otp=${otp}&mobile=${mobilenumber}`;

    console.log("Verifying OTP for:", mobilenumber, "OTP:", otp);

    const response = await axios.get(url, {
      headers: { authkey: process.env.OTP_AUTH_KEY },
    });

    if (response.data.type === "success") {
      res.status(200).json({
        status: "success",
        message: "OTP verification successful.",
        mobile: mobilenumber,
        api_response: response.data,
      });
    } else {
      res.status(400).json({
        status: "error",
        message: response.data.message || "OTP verification failed.",
        mobile: mobilenumber,
        api_response: response.data,
      });
    }
  } catch (error) {
    console.error("OTP Verification Error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};
