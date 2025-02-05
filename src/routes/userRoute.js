import express, { Router } from 'express';
import { editUser, getAllUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/getUsers', getAllUsers);
router.put('/editUser/:userId', editUser);

export default router;