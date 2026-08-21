import express from "express";
import {
  getWatchHistory,
  saveWatchHistory,
  updateWatchHistory,
  getAllWatchHistories
} from "../controllers/watchHistoryController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Retrieve all users' watch histories (Admin only)
router.get("/all", authMiddleware, adminMiddleware, getAllWatchHistories);

// All watch history endpoints are authenticated for the logged-in user
router.get("/", authMiddleware, getWatchHistory);
router.post("/", authMiddleware, saveWatchHistory);
router.put("/:movieId", authMiddleware, updateWatchHistory);

export default router;
