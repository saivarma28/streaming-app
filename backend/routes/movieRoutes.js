import express from "express";
import multer from "multer";
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getTranscodingStatus
} from "../controllers/movieController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Configure multer storage in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// GET /api/movies - Retrieves listing (public/auth required, handles adminView parameter)
router.get("/", authMiddleware, getMovies);

// GET /api/movies/:id - Retrieves details (public/auth required, handles unpublished block for normal users)
router.get("/:id", authMiddleware, getMovieById);

// GET /api/movies/:id/transcoding-status - Retrieves transcoding status (auth required)
router.get("/:id/transcoding-status", authMiddleware, getTranscodingStatus);

// POST /api/movies - Creates movie & handles direct stream video upload (Admin only)
router.post("/", authMiddleware, adminMiddleware, upload.single("video"), createMovie);

// PUT /api/movies/:id - Updates movie details & handles stream video upload replacement (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, upload.single("video"), updateMovie);

// DELETE /api/movies/:id - Deletes movie (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, deleteMovie);

export default router;
