import express, { Router } from "express";
import {
  deleteUser,
  editUser,
  getActiveUser,
  getAllUsers,
  getProfile,
  updateUserStatus,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/getUsers/", getAllUsers);
router.put("/editUser/:userId", editUser);
router.delete("/deleteUser/:userId", deleteUser);
router.put("/updateUser/", updateUserStatus);
router.get("/getActiveUser", getActiveUser);
router.get("/getProfile", getProfile);

export default router;
