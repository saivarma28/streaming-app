import { AuthService } from "../services/authService.js";

/**
 * Controller for authentication operations
 */

/**
 * Generates and sends a 6-digit verification code to the requested email.
 * POST /api/auth/send-email-otp
 */
export async function sendEmailOtp(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email address is required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }

  try {
    const result = await AuthService.sendEmailOtp(email);
    return res.status(200).json(result);
  } catch (error) {
    console.error("sendEmailOtp Controller Error:", error.message);

    if (error.message.includes("cooldown") || error.message.includes("wait")) {
      return res.status(429).json({ success: false, message: error.message });
    }

    if (error.message.includes("SMTP") || error.message.includes("credentials")) {
      return res.status(500).json({
        success: false,
        message: "Email dispatch failed: SMTP credentials are not configured on the server."
      });
    }

    return res.status(500).json({ success: false, message: error.message || "An error occurred while sending OTP." });
  }
}

/**
 * Validates the email verification OTP.
 * POST /api/auth/verify-email-otp
 */
export async function verifyEmailOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP code are required." });
  }

  const trimmedOtp = otp.trim();
  if (trimmedOtp.length !== 6 || /\D/.test(trimmedOtp)) {
    return res.status(400).json({ success: false, message: "OTP must contain exactly 6 digits." });
  }

  try {
    const result = await AuthService.verifyEmailOtp(email, otp);
    return res.status(200).json(result);
  } catch (error) {
    console.error("verifyEmailOtp Controller Error:", error.message);
    return res.status(400).json({ success: false, message: error.message || "An error occurred during verification." });
  }
}

/**
 * Checks whether a phone number is already registered in MongoDB.
 * GET /api/auth/check-phone
 */
export async function checkPhoneExists(req, res) {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Phone number query parameter is required." });
  }

  try {
    const result = await AuthService.checkPhoneExists(phoneNumber);
    return res.status(200).json(result);
  } catch (error) {
    console.error("checkPhoneExists Error:", error.message);
    return res.status(500).json({ success: false, message: "An error occurred while checking phone status." });
  }
}
