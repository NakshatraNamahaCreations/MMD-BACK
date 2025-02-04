import User from "../models/User.js";

export const getAllUsers = async (req, res) => {
    try {
        // Fetch all users and exclude passwords for security
        const users = await User.find().select("-password");

        res.status(200).json({
            message: "Users retrieved successfully",
            totalUsers: users.length,
            users
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users", error });
    }
};
