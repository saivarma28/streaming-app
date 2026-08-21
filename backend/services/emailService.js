import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Sends a real verification OTP email to a user's address.
 * Throws an error if SMTP configuration credentials are not set.
 * 
 * @param {string} toEmail 
 * @param {string} otpCode 
 */
export async function sendOtpEmail(toEmail, otpCode) {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM || "noreply@streamingapp.com";

  // Strict check: Throw explicit error if SMTP setup is missing/unconfigured
  if (!host || !port || !user || !password) {
    throw new Error(
      "SMTP server credentials are not configured in the backend environment variables (.env). Real emails cannot be sent."
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // Use SSL/TLS for 465, STARTTLS for 587
    auth: {
      user,
      pass: password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from,
    to: toEmail,
    subject: "Your Streaming App Verification Code",
    text: `Hello,

Your verification code is:

${otpCode}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email.

Regards,
Streaming App Team`,
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
      <h2 style="color: #e50914; margin-bottom: 20px;">Streaming App Verification</h2>
      <p style="color: #374151; font-size: 16px;">Hello,</p>
      <p style="color: #374151; font-size: 16px;">Your verification code is:</p>
      <div style="background-color: #f3f4f6; font-size: 28px; font-weight: bold; letter-spacing: 4px; text-align: center; padding: 15px; margin: 20px 0; color: #111827; border-radius: 6px;">
        ${otpCode}
      </div>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
      <p style="color: #6b7280; font-size: 14px;">If you did not request this code, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">Regards,<br/>Streaming App Team</p>
    </div>`
  };

  await transporter.sendMail(mailOptions);
}
