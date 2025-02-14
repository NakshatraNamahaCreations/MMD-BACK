import User from "../models/User.js";
// import bcrypt from "bcryptjs";
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
      return res.status(400).json({ message: "User already exists!" });
    }

  
    const user = new User({
      name,
      username,
      email,
      mobileNumber,
      role,
      password, 
    });

    await user.save();

    res.status(201).json({ message: "User Created Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error occurred during signup" });
  }
};


export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username or password is missing
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user in the database
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }


    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Return user details in response
    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        profile_picture: user.profile_picture,
        password:user.password
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login Failed" });
  }
};


// export const forgotPassword = async (req, res) => {
  
//   try {
//     const { email } = req.body;

//     // Check if the user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "User not found!" });
//     }

//     // Generate a 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

//     // Store OTP in the user document
//     user.resetOtp = otp;
//     user.resetOtpExpiry = otpExpiry;
//     await user.save();

//     // Create email transporter
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     // Email content
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: user.email,
//       subject: "Password Reset OTP",
//       html: `<p>Dear ${user.name},</p>
//              <p>Your OTP for password reset is: <strong>${otp}</strong></p>
//              <p>This OTP will expire in 10 minutes.</p>
//              <p>If you did not request this, please ignore this email.</p>
//              <p>Regards,<br>Support Team</p>`,
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);

//     res.status(200).json({ message: "OTP sent to your email." });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Error processing forgot password request." });
//   }
// };


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // ✅ Extract username and password from the database
    const { username, password, name } = user;

    // ✅ Create a test email account using Ethereal
    let testAccount = await nodemailer.createTestAccount();

    // ✅ Create transporter with Ethereal credentials
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user, // Fake email from Ethereal
        pass: testAccount.pass, // Fake password from Ethereal
      },
    });

    // ✅ Send username & password via email
    let mailOptions = {
      from: `"Support Team" <${testAccount.user}>`, // Fake sender
      to: user.email, // ✅ Send to the actual user
      subject: "Your Account Credentials",
      html: `
        <p>Dear ${name},</p>
        <p>Your account details are:</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>For security reasons, please change your password after logging in.</p>
        <p><a href="https://admin.makemydocuments.in">Go to Login</a></p>
        <p>Regards,<br>Support Team</p>
      `,
    };

    let info = await transporter.sendMail(mailOptions);

    // ✅ Log email preview URL for testing
    console.log("Email sent! Preview URL:", nodemailer.getTestMessageUrl(info));

    return res.status(200).json({
      message: "Username and password sent to your email.",
      previewURL: nodemailer.getTestMessageUrl(info),
      username:username,
      password:password
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Error processing forgot password request." });
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

// export const resetPassword = async (req, res) => {
//   try {
//     const { email, newPassword } = req.body;
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({ message: "User not found!" });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     user.password = hashedPassword;

//     // Clear OTP fields for security
//     user.resetOtp = undefined;
//     user.resetOtpExpiry = undefined;

//     await user.save();

//     res.status(200).json({ message: "Password reset successfully." });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error resetting password." });
//   }
// };
