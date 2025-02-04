import express, { Router } from 'express';
import { getAllUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/getUsers', getAllUsers);

export default router;