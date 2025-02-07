import Lead from "../models/Lead.js";

export const searchRecords = async (req, res) => {
  try {
    const { search } = req.body;

    if (!search || search.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Search term is required.",
      });
    }

    const searchFields = [
      "name",
      "mobilenumber",
      "email",
      "services",
      "address",
      "district",
      "paidAmount",
      "qualification",
      "gender",
      "fathername",
      "mothername",
      "pincode",
      "adharnumber",
      "panNumber",
      "identityOption",
      "printOnPanCard",
      "comment",
      "status",
      "service",
      "existingpancardnumber",
      "villageTownCity",
      "pancardstate",
      "pancarddistrict",
      "orderId",
      "insurance_registration_number",
      "applying_for",
      "employmentType",
      "nearby_police_station",
      "disease",
      "stampPaper",
      "ownername",
      "ownerage",
      "ownersfathername",
      "tenantName",
      "tenantage",
      "tenantsfathername",
      "tenantaddress",
      "shippingaddress",
      "passportBookletType",
      "givename",
      "surname",
      "maritalStatus",
      "placeofbirth",
      "bloodgroup",
      "gstnumber",
      "businessName",
      "typeoforganisation",
      "assign",
      "organisationType",
      "spouseName",
      "applicationType",
      "state",
      "age",
      "paymentStatus",
    ];

    const query = {
      $or: searchFields.map((field) => ({
        [field]: { $regex: search, $options: "i" },
      })),
    };

    const results = await Lead.find(query).limit(50);

    res.status(200).json({
      status: "success",
      message:
        results.length > 0
          ? "Search results retrieved successfully."
          : "No matching data found.",
      data: results,
    });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve search results",
      error: error.message,
    });
  }
};
