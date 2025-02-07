import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
// import { formatDate, formatTime } from "../utils/helper.js";
import mongoose from "mongoose";

export const createLead = async (req, res) => {
  try {
    // ✅ Ensure request body is received correctly
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid request payload" });
    }

    // ✅ Extract fields properly
    const leadData = req.body;

    // ✅ Remove empty or undefined values
    Object.keys(leadData).forEach((key) => {
      if (
        leadData[key] === "" ||
        leadData[key] === null ||
        leadData[key] === undefined
      ) {
        delete leadData[key]; // Remove empty values before saving
      }
    });

    if (leadData.id) {
      // ✅ Update existing lead
      const updatedLead = await Lead.findOneAndUpdate(
        { orderId: leadData.id },
        { $set: leadData },
        { new: true }
      );

      if (updatedLead) {
        return res.json({
          status: "success",
          message: "Lead updated successfully!",
          lead: updatedLead,
        });
      } else {
        return res.status(404).json({
          status: "error",
          message: "No lead found with the given orderId.",
        });
      }
    } else {
      // ✅ Generate new orderId
      const lastLead = await Lead.findOne({}, { orderId: 1 })
        .sort({ orderId: -1 })
        .collation({ locale: "en", numericOrdering: true });

      const lastId =
        lastLead && lastLead.orderId
          ? parseInt(lastLead.orderId.replace("MMD2025", ""), 10) + 1
          : 1;

      const orderId = `MMD2025${String(lastId).padStart(4, "0")}`;

      // ✅ Create new lead
      const newLead = new Lead({ ...leadData, orderId });

      // ✅ Save to database
      await newLead.save();

      res.status(201).json({
        status: "success",
        message: "Lead created successfully!",
        lead: newLead,
      });
    }
  } catch (error) {
    console.error("Error Creating Lead:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getAllLeads = async (req, res) => {
  try {
    const { assign } = req.query;

    if (!assign) {
      return res.status(400).json({
        status: "error",
        message: "Missing 'assign' parameter",
      });
    }

    // Find user role
    const user = await User.findOne({ username: assign });
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
      leads = await Lead.find();
      console.log("showignt eh admin");

      permission = "full-access";
    } else {
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
    // const formattedLeads = leads.map((lead) => ({
    //   id: lead._id.toString(),
    //   name: lead.name,
    //   mobilenumber: lead.mobilenumber,
    //   email: lead.email,
    //   services: lead.services || "",
    //   address: lead.address,
    //   district: lead.district,
    //   date: formatDate(lead.date),
    //   paidAmount: lead.paidAmount || "",
    //   qualification: lead.qualification || "",
    //   gender: lead.gender || "",
    //   fathername: lead.fathername || "",
    //   mothername: lead.mothername || "",
    //   pincode: lead.pincode || "",
    //   adharnumber: lead.adharnumber || "",
    //   panNumber: lead.panNumber || "",
    //   identityOption: lead.identityOption || "",
    //   printOnPanCard: lead.printOnPanCard || "",
    //   time: formatTime(lead.time),
    //   comment: lead.comment || "",
    //   status: lead.status || "",
    //   service: lead.service || "",
    //   followupDate: formatDate(lead.followupDate),
    //   existingpancardnumber: lead.existingpancardnumber || "",
    //   villageTownCity: lead.villageTownCity || "",
    //   pancardstate: lead.pancardstate || "",
    //   pancarddistrict: lead.pancarddistrict || "",
    //   orderid: lead.orderId || "",
    //   registrationDate: formatDate(lead.registrationDate),
    //   dob: formatDate(lead.dob),
    //   travellingDate: formatDate(lead.travellingDate),
    //   returningDate: formatDate(lead.returningDate),
    //   state: lead.state || "",
    //   paymentStatus: lead.paymentStatus || "",
    //   created_at: formatDate(lead.createdAt),
    // }));

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      permission,
      data: leads,
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
      const newFollowUp = new Lead({
        status,
        followupDate: new Date(followupDate),
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

export const getCounts = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();

    const totalUsers = await User.countDocuments();

    const statusCounts = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const formattedStatusCounts = statusCounts.reduce((acc, status) => {
      acc[status._id] = status.count;
      return acc;
    }, {});

    const assignedCounts = await Lead.aggregate([
      { $group: { _id: "$assign", count: { $sum: 1 } } },
    ]);

    const formattedAssignedCounts = assignedCounts.reduce((acc, assign) => {
      acc[assign._id] = assign.count;
      return acc;
    }, {});

    res.status(200).json({
      status: "success",
      message: "Counts retrieved successfully",
      data: {
        totalLeads,
        totalUsers,
        leadsByStatus: formattedStatusCounts,
        leadsByAssign: formattedAssignedCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
