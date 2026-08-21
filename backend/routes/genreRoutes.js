import express from "express";
import { getGenres, createGenre, updateGenre, deleteGenre } from "../controllers/genreController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Publicly retrieve list of genres (requires login)
router.get("/", authMiddleware, getGenres);

// Create a new genre (Admin only)
router.post("/", authMiddleware, adminMiddleware, createGenre);

// Update a genre name (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, updateGenre);

// Delete a genre (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, deleteGenre);

export default router;
