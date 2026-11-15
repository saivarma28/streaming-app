import { cachedFetch as fetch, BACKEND_URL } from "./apiClient";

/**
 * Synchronize Firebase user details with MongoDB.
 * POST /api/users/sync
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
 * Retrieve current user profile details from MongoDB.
 * GET /api/users/me
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
 * Update current user profile details in MongoDB.
 * PUT /api/users/me
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
