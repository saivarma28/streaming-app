import express from "express";
import { getGenres, createGenre } from "../controllers/genreController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Publicly retrieve list of genres (requires login)
router.get("/", authMiddleware, getGenres);

// Create a new genre (Admin only)
router.post("/", authMiddleware, adminMiddleware, createGenre);

export default router;
