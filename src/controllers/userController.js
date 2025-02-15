import User from "../models/User.js";
import { validationResult } from "express-validator";
// import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs-extra";

// Ensure the upload directory exists
const uploadDir = path.join(process.cwd(), "uploads/profile_pictures");
fs.ensureDirSync(uploadDir);

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage }).single("profile_picture");

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({role:'user'});

    res.status(200).json({
      message: "User Fetched Successfully",
      totalUser: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error });
  }
};


export const editUser = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ message: "File upload error", error: err });
    }

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { name, username, email, mobileNumber, role, password } = req.body;

      let user = await User.findById(userId).exec();
      if (!user) {
        return res.status(404).json({ message: "User Not Found" });
      }

      if (name) user.name = name;
      if (username) user.username = username;
      if (email) user.email = email;
      if (mobileNumber) user.mobileNumber = mobileNumber;
      if (role) user.role = role;

      if (password) {
        user.password = password; 
      }

      // Handle Profile Picture Upload
      if (req.file) {
        const baseUrl = "https://api.makemydocuments.in/uploads/profile_pictures/";
        user.profile_picture = baseUrl + req.file.filename;
      }

      await user.save();

      res.status(200).json({
        status: "success",
        message: "User Detail Updated Successfully",
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
      res.status(500).json({ message: "Error updating user", error });
    }
  });
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted successfully!", status:"success" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user", error });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "Missing 'id' or 'status'" });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res
      .status(200)
      .json({status:"success", message: "User status updated successfully!", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

export const getActiveUser = async (req, res) => {
  try {
    const { id } = req.query;

    let user;
    if (id) {
      // Fetch single user by ID
      user = await User.findOne({ _id: id, status: "active", role: "user" });
    } else {
      // Fetch all active users
      user = await User.find({ status: "active", role: "user" }).sort({
        _id: -1,
      });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Fetched User Successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error Fetching User", error });
  }
};

export const getProfile = async (req, res) => {
  try {
    let { id, username } = req.body;
    const user = await User.findOne({ username: username, _id: id });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    res.json({
      status: "success",
      message: "User profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
