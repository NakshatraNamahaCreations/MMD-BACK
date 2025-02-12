import Lead from "../models/Lead.js";
import User from "../models/User.js";
// import { validationResult } from "express-validator";
// import bcrypt from "bcryptjs";
// import mongoose from "mongoose";
// import { formatDate, formatTime } from "../utils/helper.js";

export const updateLeadStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    // Validate input
    if (!id || !status) {
      return res.status(400).json({
        status: "error",
        message: "Lead ID and status are required",
      });
    }

    // Check if the status is valid
    const validStatuses = ["In Progress", "converted", "dead", "followup", "overdue"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed statuses: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    // Find and update the document
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Lead status updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error updating lead status:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
export const todayFollowUp = async (req, res) => {
  try {
    const { assign } = req.body;

    if (!assign) {
      return res
        .status(400)
        .json({ status: "error", message: "Assign field is required" });
    }

    // Fetch the user's role
    const user = await User.findOne({ name: assign });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "The Assign is Invalid or not found",
      });
    }

    let leads;
    let permission = "view-only";

    if (user.role === "admin") {
      leads = await Lead.find({
        status: "followup",
        followupDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999),
        },
      }).sort({ updated_by: -1 });
      permission = "full-access";
    } else {
      leads = await Lead.find({
        assign,
        status: "followup",
        followupDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999),
        },
      }).sort({ updated_by: -1 });
    }

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No results found for today",
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      totalCount: leads.length,
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
      leads = await Lead.find({
        status: "followup",
        followupDate: { $exists: true, $ne: null, $lt: new Date() },
      });
      permission = "full-access";
    } else {
      leads = await Lead.find({
        $or: [
          { assign: assign }, // Leads assigned to the user
          { assign: "Unassigned" },   // Unassigned leads
          { assign: null },     // Empty string assignments
        ],
        status: "followup",
        followupDate: { $exists: true, $ne: null, $lt: new Date() },
      });
    }

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No results found for overdue",
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      totalLength: leads.length,
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

export const getFollowups = async (req, res) => {
  try {
    let { assign } = req.body;

    if (!assign) {
      return res.status(400).json({
        status: "error",
        message: "Assign field is required",
      });
    }

    // Fetch the user role
    const user = await User.findOne({ username: assign });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Invalid username or no data found",
      });
    }

    // Get today's date at midnight (00:00:00) to compare correctly
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = {
      status: "followup",
      followupDate: { $gt: today }, // Fetch only future follow-ups
    };

    let permission = "view-only";

    if (user.role === "admin") {
      permission = "full-access";
    } else {
      query.assign = assign; // Users see only their assigned follow-ups
    }

    const leads = await Lead.find(query).sort({ followupDate: 1 }); // Sort by nearest follow-up date

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No valid follow-ups found",
        data: [],
      });
    }

    //   id: doc._id.toString(),
    //   name: doc.name,
    //   date: formatDate(doc.date),
    //   time: formatTime(doc.time),
    //   source: doc.source,
    //   service: doc.service,
    //   address: doc.address,
    //   email: doc.email,
    //   mobilenumber: doc.mobilenumber,
    //   assign: doc.assign,
    //   district: doc.district,
    //   pincode: doc.pincode,
    //   state: doc.state,
    //   paidAmount: doc.paidAmount,
    //   followupDate: formatDate(doc.followupDate),
    //   status: doc.status,
    //   registrationNumber: doc.registrationNumber,
    //   registrationDate: formatDate(doc.registrationDate),
    //   applying_for: doc.applying_for,
    //   gender: doc.gender,
    //   age: doc.age,
    //   disease: doc.disease,
    //   existingpancardnumber: doc.existingpancardnumber,
    //   dob: formatDate(doc.dob),
    //   travellingDate: formatDate(doc.travellingDate),
    //   returningDate: formatDate(doc.returningDate),
    //   fathername: doc.fathername,
    //   mothername: doc.mothername,
    //   printOnPanCard: doc.printOnPanCard,
    //   identityOption: doc.identityOption,
    //   stampPaper: doc.stampPaper,
    //   ownername: doc.ownername,
    //   ownerAddress: doc.ownerAddress,
    //   ownerDistrict: doc.ownerDistrict,
    //   ownerPincode: doc.ownerPincode,
    //   tenantName: doc.tenantName,
    //   tenantaddress: doc.tenantaddress,
    //   tenantPincode: doc.tenantPincode,
    //   shiftingdate: formatDate(doc.shiftingdate),
    //   shiftingaddress: doc.shiftingaddress,
    //   monthlyrent: doc.monthlyrent,
    //   shippingaddress: doc.shippingaddress,
    //   waterCharges: doc.waterCharges,
    //   paintingCharges: doc.paintingCharges,
    //   accommodation: doc.accommodation,
    //   appliancesFittings: doc.appliancesFittings,
    //   villageTownCity: doc.villageTownCity,
    //   adharnumber: doc.adharnumber,
    //   businessName: doc.businessName,
    //   organisationType: doc.organisationType,
    //   dateOfIncorporation: formatDate(doc.dateOfIncorporation),
    //   panNumber: doc.panNumber,
    //   spouseName: doc.spouseName,
    //   applicationType: doc.applicationType,
    //   passportBookletType: doc.passportBookletType,
    //   qualification: doc.qualification,
    //   employmentType: doc.employmentType,
    //   maritalStatus: doc.maritalStatus,
    //   bloodgroup: doc.bloodgroup,
    //   paymentStatus: doc.paymentStatus,
    //   orderId: doc.orderId,
    //   created_at: formatDate(doc.createdAt),
    //   updated_by: formatDate(doc.updatedAt),
    // }));

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      permission,
      totalLength: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getInprogressLead = async (req, res) => {
  try {
    const { assign } = req.body;

    if (!assign) {
      return res.status(400).json({
        status: "error",
        message: "Assign field is required",
      });
    }

    // Fetch user details
    const user = await User.findOne({ username: assign });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Invalid username or no data found",
      });
    }

    let query = { status: "In Progress" };
    let permission = "view-only";

    if (user.role === "user") {
      query.assign = assign;
    } else if (user.role === "admin") {
      permission = "full-access";
    } else {
      return res.status(403).json({
        status: "error",
        message: "Access denied for this role",
      });
    }

    // Fetch leads based on role
    const leads = await Lead.find(query).sort({ updated_by: 1 });

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No results found",
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      role: user.role,
      totalLength: leads.length,
      permission,
      data: leads,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getConvertedLead = async (req, res) => {
  try {
    const { assign } = req.body;

    if (!assign) {
      return res.status(400).json({
        status: "error",
        message: "Assign field is required",
      });
    }

    // Fetch user details
    const user = await User.findOne({ name: assign });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Invalid username or no data found",
      });
    }

    let query = { status: "converted" };
    let permission = "view-only";

    if (user.role === "user") {
      query.assign = assign;
    } else if (user.role === "admin") {
      permission = "full-access";
    } else {
      return res.status(403).json({
        status: "error",
        message: "Access denied for this role",
      });
    }

    // Fetch leads based on role
    const leads = await Lead.find(query).sort({ updated_by: 1 });

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No results found",
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      role: user.role,
      totalLength: leads.length,
      permission,
      data: leads,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getDeadLead = async (req, res) => {
  try {
    const { assign } = req.body;

    if (!assign) {
      return res.status(400).json({
        status: "error",
        message: "Assign field is required",
      });
    }

    // Fetch user details
    const user = await User.findOne({ username: assign });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Invalid username or no data found",
      });
    }

    let query = { status: "dead" };
    let permission = "view-only";

    if (user.role === "user") {
      query.assign = assign;
    } else if (user.role === "admin") {
      permission = "full-access";
    } else {
      return res.status(403).json({
        status: "error",
        message: "Access denied for this role",
      });
    }

    // Fetch leads based on role
    const leads = await Lead.find(query).sort({ updated_by: 1 });

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No results found",
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      role: user.role,
      totalLength: leads.length,
      permission,
      data: leads,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getStatusCounts = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueFollowUps = await Lead.countDocuments({
      status: "followup",
      followupDate: { $exists: true, $ne: null, $lt: today },
    });

    const todayFollowUps = await Lead.countDocuments({
      status: "followup",
      followupDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    const inProgressLeads = await Lead.countDocuments({
      status: "In Progress",
    });

    const convertedLeads = await Lead.countDocuments({ status: "converted" });
    const deadLeads = await Lead.countDocuments({ status: "dead" });

    res.status(200).json({
      status: "success",
      message: "Lead counts retrieved successfully",
      data: {
        overdueFollowUps,
        todayFollowUps,
        inProgressLeads,
        convertedLeads,
        deadLeads,
      },
    });
  } catch (error) {
    console.error("Error fetching lead counts:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
