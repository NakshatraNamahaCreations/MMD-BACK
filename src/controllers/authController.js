import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";

export const signup = async(req, res) => {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const {name, username, email, mobileNumber, role, password} = req.body;

        console.log("the req body", req.body

        );
        
        const existingUser = await User.findOne({$or: [{email}, {username}]});

        if(existingUser){
            return res.status(400).json({message:"User already exist!"});
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            username,
            email,
            mobileNumber,
            role,
            password: hashedPassword,
        })
     await user.save();

     res.status(201).json({message:'User Created Successfully'});

    }

    catch(error){
        console.error(error);
        res.status(500).json({message:"Error occured during the SignUp"});  
    }

}

export const login = async (req,res) => {

    try{
        const {username, password} = req.body;

        const user = await User.findOne({username: username});
        console.log(user);
        

        if(!user){
           return  res.status(400).json({message:"User Not Found"});
        }
       
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email/username or password" });
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
        res.status(200).json(
            {
                message:'Login Successfull',
                user:{
                    id:username._id,
                    name:user.name,
                    username:user.username,
                    email:user.email,
                    mobileNumber:user.mobileNumber,
                    role:user.role
                }
            }
        )
    } catch(error){
        console.error(error);
        res.status(500).json({message:'Login Successfull'})
    }


}

export const forgotPassword = async(req, res) => {

        try {
            const { email } = req.body;
    
            // Check if the user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: "User not found!" });
            }
    
            // Create email transporter (Using Gmail)
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
                subject: "Your Account Details - Forgot Password",
                html: `<p>Dear ${user.name},</p>
                       <p>Here are your login details:</p>
                       <p><strong>Username:</strong> ${user.username}</p>
                       <p><strong>Password:</strong> ${user.password}</p>
                       <p>For security reasons, we recommend you change your password after logging in.</p>
                       <p>Regards,<br>Support Team</p>`
            };
    
            // Send email
            await transporter.sendMail(mailOptions);
    
            res.status(200).json({ message: "Your username and password have been sent to your email." });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error processing forgot password request." });
        }
    };