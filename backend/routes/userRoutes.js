import express from "express";
import { 
  syncUser, 
  getMe, 
  updateMe, 
  getAllUsers,
  adminCreateUser,
  adminUpdateUser,
  adminResetPassword,
  adminDeleteUser,
  getAuditLogs
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Retrieve all user profiles (Admin only)
router.get("/", authMiddleware, adminMiddleware, getAllUsers);

// Admin-only user management routes
router.post("/admin-create", authMiddleware, adminMiddleware, adminCreateUser);
router.put("/:firebaseUid/admin-update", authMiddleware, adminMiddleware, adminUpdateUser);
router.post("/:firebaseUid/reset-password", authMiddleware, adminMiddleware, adminResetPassword);
router.delete("/:firebaseUid", authMiddleware, adminMiddleware, adminDeleteUser);
router.get("/audit-logs", authMiddleware, adminMiddleware, getAuditLogs);

// Synchronize Firebase UID and profile details with MongoDB User table
router.post("/sync", authMiddleware, syncUser);

// Retrieve local database profile details for the authenticated user
router.get("/me", authMiddleware, getMe);

// Update safe fields (name, photoURL, phoneNumber) of the local profile
router.put("/me", authMiddleware, updateMe);

export default router;
