import express from "express";
import { sendEmailOtp, verifyEmailOtp } from "../controllers/authController.js";

const router = express.Router();

// Route to request email registration OTP code
router.post("/send-email-otp", sendEmailOtp);

// Route to verify email registration OTP code
router.post("/verify-email-otp", verifyEmailOtp);

export default router;
