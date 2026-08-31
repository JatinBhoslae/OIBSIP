import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import { getOutlets } from '../controllers/outletController.js';

const router = express.Router();

router.get('/', protect, getOutlets);

export default router;
