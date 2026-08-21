// API Service to communicate with the Node.js/Express Backend
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Request a real 6-digit OTP code to be sent to the user's email address.
 * Hits POST /api/auth/send-email-otp
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
 * Hits POST /api/auth/verify-email-otp
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
 * Synchronize Firebase user details with PostgreSQL.
 * Hits POST /api/users/sync
 * 
 * @param {string} token - Firebase ID token
 * @returns {Promise<{success: boolean, user: object}>}
 */
export async function syncUser(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/sync`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to synchronize user profile.");
    }
    return data;
  } catch (error) {
    console.error("syncUser API Error:", error.message);
    throw error;
  }
}

/**
 * Retrieve current user profile details from PostgreSQL.
 * Hits GET /api/users/me
 * 
 * @param {string} token - Firebase ID token
 * @returns {Promise<{success: boolean, user: object}>}
 */
export async function getUserMe(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch user profile.");
    }
    return data;
  } catch (error) {
    console.error("getUserMe API Error:", error.message);
    throw error;
  }
}

/**
 * Update current user profile details in PostgreSQL.
 * Hits PUT /api/users/me
 * 
 * @param {string} token - Firebase ID token
 * @param {object} profileData - Fields to update (name, photoURL, phoneNumber)
 * @returns {Promise<{success: boolean, user: object}>}
 */
export async function updateUserMe(token, profileData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update user profile.");
    }
    return data;
  } catch (error) {
    console.error("updateUserMe API Error:", error.message);
    throw error;
  }
}

