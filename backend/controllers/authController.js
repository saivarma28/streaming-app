import crypto from "crypto";
import { saveOtp, getOtp, incrementAttempts, deleteOtp, MAX_ATTEMPTS } from "../utils/otpStore.js";
import { sendOtpEmail } from "../services/emailService.js";

/**
 * Generates and sends a 6-digit verification code to the requested email.
 * 
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

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Generate secure 6-digit OTP using crypto
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // 2. Hash the OTP using SHA-256
    const hashedOtp = crypto.createHash("sha256").update(otpCode).digest("hex");

    // 3. Save to in-memory temporary storage (enforces 1-minute request rate limit internally)
    saveOtp(normalizedEmail, hashedOtp);

    // 4. Send the OTP code to the email inbox using Nodemailer service
    await sendOtpEmail(normalizedEmail, otpCode);

    // 5. Respond to client (OTP is NEVER returned or console.logged)
    return res.status(200).json({
      success: true,
      message: "Verification OTP sent to your email."
    });
  } catch (error) {
    console.error("sendEmailOtp Controller Error:", error.message);
    
    // Capture 1-minute resend cooldown error
    if (error.message.includes("cooldown") || error.message.includes("wait")) {
      return res.status(429).json({ success: false, message: error.message });
    }

    // Capture SMTP config error
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
 * 
 * POST /api/auth/verify-email-otp
 */
export async function verifyEmailOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP code are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedOtp = otp.trim();

  if (trimmedOtp.length !== 6 || /\D/.test(trimmedOtp)) {
    return res.status(400).json({ success: false, message: "OTP must contain exactly 6 digits." });
  }

  try {
    const record = getOtp(normalizedEmail);

    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      deleteOtp(normalizedEmail);
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
    }

    // Check maximum attempts limit
    if (record.attempts >= MAX_ATTEMPTS) {
      deleteOtp(normalizedEmail);
      return res.status(400).json({ success: false, message: "Too many attempts. Please request a new OTP." });
    }

    // Increment attempts count
    incrementAttempts(normalizedEmail);

    // Hash the user-submitted OTP
    const submittedHash = crypto.createHash("sha256").update(trimmedOtp).digest("hex");

    // Secure timing-safe buffer comparison to prevent timing attacks
    const recordBuffer = Buffer.from(record.hashedOtp, "hex");
    const submittedBuffer = Buffer.from(submittedHash, "hex");

    const isValid = crypto.timingSafeEqual(recordBuffer, submittedBuffer);

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // Successful verification: delete OTP session record and respond
    deleteOtp(normalizedEmail);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully."
    });
  } catch (error) {
    console.error("verifyEmailOtp Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "An error occurred during verification." });
  }
}
