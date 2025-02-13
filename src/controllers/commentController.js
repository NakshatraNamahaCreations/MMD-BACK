import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";
import Comment from "../models/Comment.js";

export const addComment = async (req, res) => {
  try {
    const { id, assign, comment } = req.body;

    if (!id || !comment || !assign) {
      return res.status(400).json({
        status: "error",
        message: "Invalid request. 'id', 'comment', and 'assign' are required.",
      });
    }
    const newComment = new Comment({
      document_id: id,
      comment,
      assign,
    });

    await newComment.save();

    res.status(201).json({
      status: "success",
      message: "Comment added successfully.",
      data: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to add comment: " + error.message,
    });
  }
};

export const getComment = async (req, res) => {
  try {
    const { document_id } = req.query;
    const comments = await Comment.find({ document_id }).sort({ datetime: -1 });
    if (!document_id) {
      return res
        .status(400)
        .json({ message: "Error in fetching the comments" });
    }
    res.status(200).json({
      status: "success",
      message: "Comments retrieved successfully.",
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch comments: " + error.message,
    });
  }
};
