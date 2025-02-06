import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const createLead = async (req, res) => {
  try {
    //Check required fields section
    const { name, date, time, source, service, address, email, mobilenumber } =
      req.body;
    if (
      !name ||
      !date ||
      !time ||
      !source ||
      !service ||
      !address ||
      !email ||
      !mobilenumber
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    //Find last inserted order and increment order ID
    const lastLead = await Lead.findOne({}, { orderid: 1 }).sort({
      createdAt: -1,
    });

    const lastId = lastLead
      ? parseInt(lastLead.orderid?.replace("MMD2025000", "")) + 1
      : 1;
    const orderid = `MMD2025000${lastId}`;

    //Create new lead
    const newLead = new Lead({
      ...req.body,
      orderid,
    });

    await newLead.save();

    res
      .status(201)
      .json({ message: "Lead created successfully!", lead: newLead });
  } catch (error) {
    console.error("Error Creating Lead:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getAllLeads = async (req, res) => {
  const formatDate = (date) => {
    if (!date || date === "0000-00-00") return null;
    return new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD
  };

  // Helper function to format time to 12-hour AM/PM
  const formatTime = (time) => {
    if (!time || time === "00:00:00") return null;
    const date = new Date(`1970-01-01T${time}Z`);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };
  try {
    const { assign } = req.query; // Get 'assign' from query

    // If 'assign' is missing, return an error
    if (!assign) {
      return res.status(400).json({
        status: "error",
        message: "Missing 'assign' parameter",
      });
    }

    // Find user role
    const user = await User.findOne({ name: assign });
    console.log(user);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Invalid username or no data found",
      });
    }

    let leads;
    let permission = "view-only";

    if (user.role === "admin") {
      // Admin gets full access.....
      leads = await Lead.find();
      console.log("showignt eh admin");

      permission = "full-access";
    } else {
      // Regular users get only assigned leads....
      leads = await Lead.find({
        assign: assign,
      });
    }

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No results found",
        data: [],
      });
    }

    // Format dates before sending response
    const formattedLeads = leads.map((lead) => ({
      id: lead._id.toString(),
      name: lead.name,
      mobilenumber: lead.mobilenumber,
      email: lead.email,
      services: lead.services || "",
      address: lead.address,
      district: lead.district,
      date: formatDate(lead.date),
      paidAmount: lead.paidAmount || "",
      qualification: lead.qualification || "",
      gender: lead.gender || "",
      fathername: lead.fathername || "",
      mothername: lead.mothername || "",
      pincode: lead.pincode || "",
      adharnumber: lead.adharnumber || "",
      panNumber: lead.panNumber || "",
      identityOption: lead.identityOption || "",
      printOnPanCard: lead.printOnPanCard || "",
      time: formatTime(lead.time),
      comment: lead.comment || "",
      status: lead.status || "",
      service: lead.service || "",
      followupDate: formatDate(lead.followupDate),
      existingpancardnumber: lead.existingpancardnumber || "",
      villageTownCity: lead.villageTownCity || "",
      pancardstate: lead.pancardstate || "",
      pancarddistrict: lead.pancarddistrict || "",
      orderid: lead.orderid || "",
      registrationDate: formatDate(lead.registrationDate),
      dob: formatDate(lead.dob),
      travellingDate: formatDate(lead.travellingDate),
      returningDate: formatDate(lead.returningDate),
      state: lead.state || "",
      paymentStatus: lead.paymentStatus || "",
      created_at: formatDate(lead.createdAt),
    }));

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      permission,
      data: formattedLeads,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
export const deleteLead = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { leadId } = req.params;

    // Lead find by Lead id
    const lead = await Lead.findById(leadId);

    if (!lead) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User Not Found" });
    }

    await Lead.findByIdAndDelete(leadId, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Lead Deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error in Deleting Lead", error });
  }
};
export const updateLeadAssign = async (req, res) => {
  try {
    const { id, assign } = req.body;

    // Validating input
    if (!id || !assign) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input. 'id' and 'assign' are required.",
      });
    }

    // Find and update the document
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { assign },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Assign value updated successfully.",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error updating assign field:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update assign value.",
      error: error.message,
    });
  }
};

export const getOverdueLead = async (req, res) => {
  try {
    const { assign } = req.query;

    if (!assign) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing 'assign' parameter" });
    }

    // Find user role
    const user = await User.findOne({ name: assign });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Invalid username or no data found",
      });
    }

    let leads;
    let permission = "view-only";

    if (user.role === "admin") {
      console.log("Admin Access - Fetching all leads");
      leads = await Lead.find({
        status: "followup",
        followupDate: { $exists: true, $ne: null, $lt: new Date() }, // Fetch leads where followupDate is before today
      });
      permission = "full-access";
    } else {
      console.log(`Fetching assigned leads for user: ${assign}`);
      leads = await Lead.find({
        assign: assign,
        status: "followup",
        followupDate: { $exists: true, $ne: null, $lt: new Date() }, // Fetch leads where followupDate is before today
      });
    }

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No results found for today",
        data: [],
      });
    }

    // Format dates before sending response
    const formattedLeads = leads.map((lead) => ({
      id: lead._id.toString(),
      name: lead.name,
      mobilenumber: lead.mobilenumber,
      email: lead.email,
      address: lead.address,
      district: lead.district,
      date: formatDate(lead.date),
      followupDate: formatDate(lead.followupDate),
      dob: formatDate(lead.dob),
      registrationDate: formatDate(lead.registrationDate),
      travellingDate: formatDate(lead.travellingDate),
      returnDate: formatDate(lead.returnDate),
      shiftingdate: formatDate(lead.shiftingdate),
      dateOfIncorporation: formatDate(lead.dateOfIncorporation),
      time: formatTime(lead.time),
      orderid: lead.orderid,
      status: lead.status,
    }));

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      permission,
      data: formattedLeads,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Helper function to format date (similar to PHP)
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD
};

// Helper function to format time to 12-hour AM/PM
const formatTime = (time) => {
  if (!time) return null;
  const date = new Date(`1970-01-01T${time}Z`);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

export const createOrUpdateFollowUp = async (req, res) => {
  try {
    const { id, status, followupDate, assign } = req.body;

    if (!status && !followupDate) {
      return res.status(400).json({
        status: "error",
        message: "Status or follow-up time must be provided.",
      });
    }

    if (id) {
      // ✅ Update Existing Follow-Up
      let updateFields = {};
      if (status) updateFields.status = status;
      if (followupDate) updateFields.followupDate = new Date(followupDate);
      if (assign) updateFields.assign = assign;

      const updatedLead = await Lead.findByIdAndUpdate(id, updateFields, {
        new: true,
      });

      if (!updatedLead) {
        return res
          .status(404)
          .json({ status: "error", message: "Lead not found." });
      }

      return res.status(200).json({
        status: "success",
        message: "Follow-Up updated successfully!",
        data: updatedLead,
      });
    } else {
      // ✅ Insert New Follow-Up
      const newFollowUp = new Lead({
        status,
        followupDate: new Date(followuptDate),
        assign,
      });

      await newFollowUp.save();

      return res.status(201).json({
        status: "success",
        message: "Follow-Up created successfully!",
        data: newFollowUp,
      });
    }
  } catch (error) {
    console.error("Error in Follow-Up:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
