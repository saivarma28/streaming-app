import express from "express";
import {
  getPopularMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getPopularTv,
  getTrendingTv,
  search,
  getMovieDetails,
  getTvDetails
} from "../controllers/tmdbController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authMiddleware globally to all TMDB routes to secure them
router.use(authMiddleware);

router.get("/movies/popular", getPopularMovies);
router.get("/movies/trending", getTrendingMovies);
router.get("/movies/top-rated", getTopRatedMovies);
router.get("/movies/now-playing", getNowPlayingMovies);
router.get("/tv/popular", getPopularTv);
router.get("/tv/trending", getTrendingTv);
router.get("/search", search);
router.get("/movie/:id", getMovieDetails);
router.get("/tv/:id", getTvDetails);

export default router;
