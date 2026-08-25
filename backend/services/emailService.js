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

/**
 * Sends a premium payment confirmation receipt email.
 * 
 * @param {string} toEmail 
 * @param {string} userName 
 * @param {object} receiptDetails 
 */
export async function sendPaymentReceiptEmail(toEmail, userName, receiptDetails) {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM || "noreply@streamingapp.com";

  if (!host || !port || !user || !password) {
    throw new Error(
      "SMTP server credentials are not configured in the backend environment variables (.env). Real emails cannot be sent."
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
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
    subject: "StreamApp Premium Payment Receipt",
    text: `StreamApp\nPremium Subscription Payment Successful\n\nHello ${userName},\n\nYour StreamApp Premium subscription payment was successful.\n\nPayment Details:\n\nPlan: StreamApp Premium\nAmount: ₹99\nPayment Status: Successful\nPayment ID: ${receiptDetails.paymentId}\nOrder ID: ${receiptDetails.orderId}\nPayment Date: ${receiptDetails.paymentDate}\nSubscription Status: Active\nSubscription Expiry: ${receiptDetails.expiryDate}\n\nThank you for subscribing to StreamApp Premium.\n\nYou can now access all Premium movies and TV shows.\n\nRegards,\nStreamApp Team`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
      <div style="text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #e50914; margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">StreamApp</h2>
        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Premium Subscription Successful</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5; color: #374151;">Hello <strong>${userName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.5; color: #374151;">Your StreamApp Premium subscription payment was successful. Here is your receipt:</p>
      
      <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; font-size: 15px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Payment Details</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Plan:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827; font-weight: bold;">StreamApp Premium</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Amount:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827; font-weight: bold;">₹99</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Payment Status:</td>
            <td style="padding: 6px 0; text-align: right; color: #10b981; font-weight: bold;">Successful</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Payment ID:</td>
            <td style="padding: 6px 0; text-align: right; color: #1f2937; font-family: monospace;">${receiptDetails.paymentId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Order ID:</td>
            <td style="padding: 6px 0; text-align: right; color: #1f2937; font-family: monospace;">${receiptDetails.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Payment Date:</td>
            <td style="padding: 6px 0; text-align: right; color: #1f2937;">${receiptDetails.paymentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Subscription Status:</td>
            <td style="padding: 6px 0; text-align: right; color: #10b981; font-weight: bold;">Active</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Subscription Expiry:</td>
            <td style="padding: 6px 0; text-align: right; color: #1f2937; font-weight: bold;">${receiptDetails.expiryDate}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 15px; line-height: 1.5; color: #374151;">Thank you for subscribing to StreamApp Premium. You can now access all Premium movies and TV shows.</p>
      
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 25px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">Regards,<br/><strong>StreamApp Team</strong></p>
    </div>`
  };

  await transporter.sendMail(mailOptions);
}
