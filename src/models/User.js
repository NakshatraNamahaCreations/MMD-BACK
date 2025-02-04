import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        mobileNumber: { type: String, required: true, unique: true },
        role: { type: String, enum: ["admin", "user"], default: "user" },
        password: { type: String, required: true },
      },
      { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
