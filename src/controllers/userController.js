import User from "../models/User.js";
import { validationResult } from "express-validator";
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req, res) => {
    try {

        const users = await User.find().select("-password");

        res.status(200).json({
            message:'User Fetched Successfully',
            totalUser: users.length,
            users
        })

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users", error });
    }
};

export const editUser = async (req,res) => {
try{

      const errors = validationResult(req);
            if (!errors.isEmpty()) {
              return res.status(400).json({ errors: errors.array() });
            }
            const { userId } = req.params;
            const {name, username, email, mobileNumber, role, password} = req.body;

            let user = await User.findById(userId).exec();

            if(!user){
                return res.status(404).json({message:"User Not Found"});
            }
           
            if(name) user.name = name;
            if (username) user.username = username;
            if (email) user.email = email;
            if (mobileNumber) user.mobileNumber = mobileNumber;
            if (role) user.role = role;

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                user.password = hashedPassword;
            }

            await user.save();

            res.status(200).json({
                message:'User Detail Updated Successfully',
                user:{
                    id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    mobileNumber: user.mobileNumber,
                    role: user.role,
                }
            });
    
}
catch(error){
    console.error(error);
    res.status(500).json({message:error});
}
}
