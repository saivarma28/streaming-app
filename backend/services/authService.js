import crypto from "crypto";
import { saveOtp, getOtp, incrementAttempts, deleteOtp, MAX_ATTEMPTS } from "../utils/otpStore.js";
import { sendOtpEmail } from "./emailService.js";
import { UserModel } from "../models/User.js";

/**
 * Service handling authentication operations (OTP, verification, phone lookup)
 */
export class AuthService {
  /**
   * Generates a 6-digit OTP, stores its SHA-256 hash in temporary storage, and dispatches via Nodemailer.
   */
  static async sendEmailOtp(email) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Generate secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // 2. Hash the OTP using SHA-256
    const hashedOtp = crypto.createHash("sha256").update(otpCode).digest("hex");

    // 3. Save to in-memory temporary store (enforces 1-minute request rate limit internally)
    saveOtp(normalizedEmail, hashedOtp);

    // 4. Send the OTP code to the email inbox
    await sendOtpEmail(normalizedEmail, otpCode);

    return { success: true, message: "Verification OTP sent to your email." };
  }

  /**
   * Validates user-submitted OTP with timing-safe comparison.
   */
  static async verifyEmailOtp(email, otp) {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    const record = getOtp(normalizedEmail);
    if (!record) {
      throw new Error("Invalid OTP.");
    }

    if (Date.now() > record.expiresAt) {
      deleteOtp(normalizedEmail);
      throw new Error("OTP expired. Please request a new OTP.");
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      deleteOtp(normalizedEmail);
      throw new Error("Too many attempts. Please request a new OTP.");
    }

    incrementAttempts(normalizedEmail);

    const submittedHash = crypto.createHash("sha256").update(trimmedOtp).digest("hex");
    const recordBuffer = Buffer.from(record.hashedOtp, "hex");
    const submittedBuffer = Buffer.from(submittedHash, "hex");

    const isValid = crypto.timingSafeEqual(recordBuffer, submittedBuffer);
    if (!isValid) {
      throw new Error("Invalid OTP.");
    }

    // Success: delete OTP session record
    deleteOtp(normalizedEmail);
    return { success: true, message: "Email verified successfully." };
  }

  /**
   * Checks whether a phone number is registered in MongoDB.
   */
  static async checkPhoneExists(phoneNumber) {
    const user = await UserModel.findByPhoneNumber(phoneNumber);
    return { success: true, exists: !!user };
  }
}
