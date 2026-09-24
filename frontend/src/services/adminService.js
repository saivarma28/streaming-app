import { cachedFetch as fetch, BACKEND_URL } from "./apiClient";

/**
 * Retrieve all registered users. (Admin only)
 * GET /api/users
 */
export async function getAllUsers(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to retrieve all users.");
    }
    return data;
  } catch (error) {
    console.error("getAllUsers API Error:", error.message);
    throw error;
  }
}

/**
 * Create a new user from Admin Panel in Firebase & MongoDB.
 * POST /api/users/admin-create
 */
export async function adminCreateUser(token, userData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/admin-create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create user.");
    return data;
  } catch (error) {
    console.error("adminCreateUser API Error:", error.message);
    throw error;
  }
}

/**
 * Update user role, status, premium, or expiry. (Admin only)
 * PUT /api/users/:firebaseUid/admin-update
 */
export async function adminUpdateUser(token, firebaseUid, updateData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${firebaseUid}/admin-update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update user.");
    return data;
  } catch (error) {
    console.error("adminUpdateUser API Error:", error.message);
    throw error;
  }
}

/**
 * Reset a user's password directly. (Admin only)
 * POST /api/users/:firebaseUid/reset-password
 */
export async function adminResetPassword(token, firebaseUid, newPassword) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${firebaseUid}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to reset password.");
    return data;
  } catch (error) {
    console.error("adminResetPassword API Error:", error.message);
    throw error;
  }
}

/**
 * Delete a user account from Firebase and MongoDB. (Admin only)
 * DELETE /api/users/:firebaseUid
 */
export async function adminDeleteUser(token, firebaseUid) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${firebaseUid}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete user.");
    return data;
  } catch (error) {
    console.error("adminDeleteUser API Error:", error.message);
    throw error;
  }
}

/**
 * Retrieves the historical admin action audit logs. (Admin only)
 * GET /api/users/audit-logs
 */
export async function getAdminAuditLogs(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/audit-logs`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to retrieve audit logs.");
    return data;
  } catch (error) {
    console.error("getAdminAuditLogs API Error:", error.message);
    throw error;
  }
}
