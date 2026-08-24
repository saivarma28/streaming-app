import express from "express";
import multer from "multer";
import {
  getTvShows,
  getTvShowById,
  createTvShow,
  updateTvShow,
  deleteTvShow,
  getSeasons,
  getEpisodes,
  getEpisodeById,
  createEpisode,
  updateEpisode,
  deleteEpisode
} from "../controllers/tvShowController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// TV Show metadata CRUD
router.get("/", authMiddleware, getTvShows);
router.get("/:id", authMiddleware, getTvShowById);
router.post("/", authMiddleware, adminMiddleware, createTvShow);
router.put("/:id", authMiddleware, adminMiddleware, updateTvShow);
router.delete("/:id", authMiddleware, adminMiddleware, deleteTvShow);

// Season & Episode management
router.get("/:id/seasons", authMiddleware, getSeasons);
router.get("/:id/seasons/:seasonNumber/episodes", authMiddleware, getEpisodes);
router.get("/:id/seasons/:seasonNumber/episodes/:episodeNumber", authMiddleware, getEpisodeById);
router.post("/:id/seasons/:seasonNumber/episodes", authMiddleware, adminMiddleware, upload.single("video"), createEpisode);
router.put("/:id/seasons/:seasonNumber/episodes/:episodeId", authMiddleware, adminMiddleware, upload.single("video"), updateEpisode);
router.delete("/:id/seasons/:seasonNumber/episodes/:episodeId", authMiddleware, adminMiddleware, deleteEpisode);

export default router;
