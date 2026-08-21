import express from "express";
import {
  getWatchHistory,
  saveWatchHistory,
  updateWatchHistory
} from "../controllers/watchHistoryController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All watch history endpoints are authenticated for the logged-in user
router.get("/", authMiddleware, getWatchHistory);
router.post("/", authMiddleware, saveWatchHistory);
router.put("/:movieId", authMiddleware, updateWatchHistory);

export default router;
