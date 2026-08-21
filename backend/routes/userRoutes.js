import express from "express";
import { syncUser, getMe, updateMe, getAllUsers } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Retrieve all user profiles (Admin only)
router.get("/", authMiddleware, adminMiddleware, getAllUsers);

// Synchronize Firebase UID and profile details with PostgreSQL User table
router.post("/sync", authMiddleware, syncUser);

// Retrieve local database profile details for the authenticated user
router.get("/me", authMiddleware, getMe);

// Update safe fields (name, photoURL, phoneNumber) of the local profile
router.put("/me", authMiddleware, updateMe);

export default router;
