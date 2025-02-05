import express, { Router } from 'express';
import { deleteUser, editUser, getAllUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/getUsers', getAllUsers);
router.put('/editUser/:userId', editUser);
router.delete('/deleteUser/:userId', deleteUser);

export default router;