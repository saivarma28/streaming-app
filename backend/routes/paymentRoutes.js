import express from "express";
import { createOrder, verifyPayment, getSubscriptionStatus } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.get("/status", authMiddleware, getSubscriptionStatus);

export default router;
