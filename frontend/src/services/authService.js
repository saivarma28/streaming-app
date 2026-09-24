import { cachedFetch as fetch, BACKEND_URL } from "./apiClient";

/**
 * Request a 6-digit verification OTP sent to the user's email address.
 * POST /api/auth/send-email-otp
 * 
 * @param {string} email 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendEmailOtp(email) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/send-email-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to send email OTP code.");
    }
    return data;
  } catch (error) {
    console.error("sendEmailOtp API Error:", error.message);
    throw error;
  }
}

/**
 * Verify the 6-digit OTP code entered by the user.
 * POST /api/auth/verify-email-otp
 * 
 * @param {string} email 
 * @param {string} otp 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyEmailOtp(email, otp) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-email-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, otp })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Invalid OTP code.");
    }
    return data;
  } catch (error) {
    console.error("verifyEmailOtp API Error:", error.message);
    throw error;
  }
}

/**
 * Check whether a phone number is registered in the database.
 * GET /api/auth/check-phone?phoneNumber=+91XXXXXXXXXX
 * 
 * @param {string} phoneNumber 
 * @returns {Promise<{success: boolean, exists: boolean}>}
 */
export async function checkPhoneExists(phoneNumber) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/check-phone?phoneNumber=${encodeURIComponent(phoneNumber)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to check phone number registration status.");
    }
    return data;
  } catch (error) {
    console.error("checkPhoneExists API Error:", error.message);
    throw error;
  }
}
