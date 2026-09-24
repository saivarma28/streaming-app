import { UserService } from "../services/userService.js";
import { AuditLogModel } from "../models/AuditLog.js";

/**
 * Controller for user profile synchronization, updates, and administration
 */

/**
 * Syncs the authenticated Firebase user with MongoDB.
 * POST /api/users/sync
 */
export async function syncUser(req, res) {
  const { email } = req.user;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Sync aborted: email address not found in verified token."
    });
  }

  try {
    const user = await UserService.syncUser(req.user);
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isPremium: user.isPremium || false,
        premiumExpiryDate: user.premiumExpiryDate || null,
        subscriptionStatus: user.subscriptionStatus || null,
        subscriptionExpiryDate: user.subscriptionExpiryDate || null,
        isDisabled: user.isDisabled || false
      }
    });
  } catch (error) {
    console.error("syncUser Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during database user profile synchronization."
    });
  }
}

/**
 * Gets the current authenticated user's profile from MongoDB.
 * GET /api/users/me
 */
export async function getMe(req, res) {
  const { firebaseUid } = req.user;

  try {
    const user = await UserService.getProfileByFirebaseUid(firebaseUid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found in local database."
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isPremium: user.isPremium || false,
        premiumExpiryDate: user.premiumExpiryDate || null,
        subscriptionStatus: user.subscriptionStatus || null,
        subscriptionExpiryDate: user.subscriptionExpiryDate || null,
        isDisabled: user.isDisabled || false
      }
    });
  } catch (error) {
    console.error("getMe Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user profile."
    });
  }
}

/**
 * Updates the current authenticated user's profile details.
 * PUT /api/users/me
 */
export async function updateMe(req, res) {
  const { firebaseUid } = req.user;
  const { name, photoURL, phoneNumber } = req.body;

  try {
    const updatedUser = await UserService.updateProfile(firebaseUid, { name, photoURL, phoneNumber });

    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        firebaseUid: updatedUser.firebaseUid,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        photoURL: updatedUser.photoURL,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
        isPremium: updatedUser.isPremium || false,
        premiumExpiryDate: updatedUser.premiumExpiryDate || null,
        subscriptionStatus: updatedUser.subscriptionStatus || null,
        subscriptionExpiryDate: updatedUser.subscriptionExpiryDate || null,
        isDisabled: updatedUser.isDisabled || false
      }
    });
  } catch (error) {
    console.error("updateMe Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update user profile."
    });
  }
}

/**
 * Retrieves all user profiles. (Admin only)
 * GET /api/users
 */
export async function getAllUsers(req, res) {
  try {
    const users = await UserService.getAllUsers();
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("getAllUsers Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving user list."
    });
  }
}

/**
 * Creates a new user in Firebase Auth and MongoDB. (Admin only)
 * POST /api/users/admin-create
 */
export async function adminCreateUser(req, res) {
  const { name, email, password, role, isPremium, premiumExpiryDate, isDisabled } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required."
    });
  }

  try {
    const user = await UserService.adminCreateUser(
      { email: req.user.email, name: req.dbUser?.name || req.user.name },
      { name, email, password, role, isPremium, premiumExpiryDate, isDisabled }
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        premiumExpiryDate: user.premiumExpiryDate,
        isDisabled: user.isDisabled,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("adminCreateUser Error:", error.message);
    let errorMsg = error.message || "An error occurred while creating the user.";
    if (error.code === "auth/email-already-exists") {
      errorMsg = "A user with this email address already exists in Firebase Auth.";
    } else if (error.code === "auth/invalid-password") {
      errorMsg = "Password must be at least 6 characters.";
    }
    return res.status(500).json({ success: false, message: errorMsg });
  }
}

/**
 * Updates a user's role, status, premium, or expiry in Firebase & MongoDB. (Admin only)
 * PUT /api/users/:firebaseUid/admin-update
 */
export async function adminUpdateUser(req, res) {
  const { firebaseUid } = req.params;
  const { name, role, isPremium, premiumExpiryDate, isDisabled } = req.body;

  try {
    await UserService.adminUpdateUser(
      { email: req.user.email, name: req.dbUser?.name || req.user.name },
      firebaseUid,
      { name, role, isPremium, premiumExpiryDate, isDisabled }
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully."
    });
  } catch (error) {
    console.error("adminUpdateUser Error:", error.message);
    const status = error.message.includes("not found") ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "An error occurred while updating the user."
    });
  }
}

/**
 * Resets a user's password securely. (Admin only)
 * POST /api/users/:firebaseUid/reset-password
 */
export async function adminResetPassword(req, res) {
  const { firebaseUid } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters."
    });
  }

  try {
    await UserService.adminResetPassword(
      { email: req.user.email, name: req.dbUser?.name || req.user.name },
      firebaseUid,
      newPassword
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully."
    });
  } catch (error) {
    console.error("adminResetPassword Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password."
    });
  }
}

/**
 * Deletes a user account from Firebase and MongoDB. (Admin only)
 * DELETE /api/users/:firebaseUid
 */
export async function adminDeleteUser(req, res) {
  const { firebaseUid } = req.params;

  try {
    await UserService.adminDeleteUser(
      { email: req.user.email, name: req.dbUser?.name || req.user.name },
      firebaseUid
    );

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully."
    });
  } catch (error) {
    console.error("adminDeleteUser Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete user."
    });
  }
}

/**
 * Retrieves the historical admin action audit logs. (Admin only)
 * GET /api/users/audit-logs
 */
export async function getAuditLogs(req, res) {
  try {
    const logs = await AuditLogModel.getRecentLogs(100);
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("getAuditLogs Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching admin audit logs."
    });
  }
}
