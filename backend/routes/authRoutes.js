import express from "express";
import { sendEmailOtp, verifyEmailOtp, checkPhoneExists } from "../controllers/authController.js";

const router = express.Router();

// Route to request email registration OTP code
router.post("/send-email-otp", sendEmailOtp);

// Route to verify email registration OTP code
router.post("/verify-email-otp", verifyEmailOtp);

// Route to check if a mobile number is registered
router.get("/check-phone", checkPhoneExists);

export default router;
