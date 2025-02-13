import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";

export const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, username, email, mobileNumber, role, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return res.status(400).json({ message: "User already exist!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      username,
      email,
      mobileNumber,
      role,
      password: hashedPassword,
    });
    await user.save();

    res.status(201).json({ message: "User Created Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error occured during the SignUp" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
// if(!username || !password){
//   res.json({"message": "json error"});
// }
    const user = await User.findOne({ username: username });
    console.log(user);

    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email/username or password" });
    }
    
    // res.status(200).json({
    //     message: "Login successful!",
    //     user: {
    //         id: user._id,
    //         name: user.name,
    //         username: user.username,
    //         email: user.email,
    //         mobileNumber: user.mobileNumber,
    //         role: user.role,
    //     },
    // });
    res.status(200).json({
      success: true, 
      message: "Login Successfull",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        profile_picture: user.profile_picture, 
            },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login Failed" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    // Store OTP in the user document
    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    await user.save();

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset OTP",
      html: `<p>Dear ${user.name},</p>
             <p>Your OTP for password reset is: <strong>${otp}</strong></p>
             <p>This OTP will expire in 10 minutes.</p>
             <p>If you did not request this, please ignore this email.</p>
             <p>Regards,<br>Support Team</p>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error processing forgot password request." });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.resetOtp !== otp || user.resetOtpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Clear OTP fields after verification
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "OTP verified. You can now reset your password." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying OTP." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear OTP fields for security
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error resetting password." });
  }
};
