import * as tmdbService from "../services/tmdbService.js";
import { getDb } from "../config/mongodb.js";
import { normalizeMovieUrls } from "./movieController.js";

/**
 * Handle API error response helper
 */
function handleControllerError(res, error, defaultMessage) {
  console.error(`${defaultMessage}:`, error.message);
  return res.status(500).json({
    success: false,
    message: error.message || defaultMessage,
  });
}

export async function getPopularMovies(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getPopularMovies(page);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return handleControllerError(res, err, "Failed to retrieve popular movies from TMDB");
  }
}

export async function getTrendingMovies(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getTrendingMovies("day", page);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return handleControllerError(res, err, "Failed to retrieve trending movies from TMDB");
  }
}

export async function getTopRatedMovies(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getTopRatedMovies(page);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return handleControllerError(res, err, "Failed to retrieve top-rated movies from TMDB");
  }
}

export async function getNowPlayingMovies(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getNowPlayingMovies(page);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return handleControllerError(res, err, "Failed to retrieve now playing movies from TMDB");
  }
}

export async function getPopularTv(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getPopularTv(page);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return handleControllerError(res, err, "Failed to retrieve popular TV shows from TMDB");
  }
}

export async function getTrendingTv(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getTrendingTv("day", page);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return handleControllerError(res, err, "Failed to retrieve trending TV shows from TMDB");
  }
}

export async function search(req, res) {
  const { query } = req.query;
  const page = parseInt(req.query.page, 10) || 1;

  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: "Search query is required." });
  }

  try {
    const data = await tmdbService.searchMulti(query.trim(), page);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return handleControllerError(res, err, "Failed to perform search query on TMDB");
  }
}

export async function getMovieDetails(req, res) {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "A valid numeric TMDB ID is required." });
  }

  try {
    const tmdbId = parseInt(id, 10);
    const tmdbDetails = await tmdbService.getMovieDetails(tmdbId);

    // Check if there is an associated local streaming movie record
    let localMovie = null;
    try {
      const db = getDb();
      if (db) {
        localMovie = await db.collection("movies").findOne({
          $or: [
            { tmdbId: tmdbId },
            { title: { $regex: new RegExp("^" + tmdbDetails.title + "$", "i") } }
          ]
        });
        if (localMovie) {
          normalizeMovieUrls(localMovie);
        }
      }
    } catch (dbErr) {
      console.warn("DB Query failed in getMovieDetails:", dbErr.message);
    }

    return res.status(200).json({
      success: true,
      movie: tmdbDetails,
      localMovie
    });
  } catch (err) {
    return handleControllerError(res, err, "Failed to retrieve movie details from TMDB");
  }
}

export async function getTvDetails(req, res) {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "A valid numeric TMDB ID is required." });
  }

  try {
    const tmdbId = parseInt(id, 10);
    const tmdbDetails = await tmdbService.getTvDetails(tmdbId);

    // Check if there is an associated local streaming TV record by name (shows might be saved as movie records)
    let localMovie = null;
    try {
      const db = getDb();
      if (db) {
        localMovie = await db.collection("movies").findOne({
          $or: [
            { tmdbId: tmdbId },
            { title: { $regex: new RegExp("^" + tmdbDetails.name + "$", "i") } }
          ]
        });
        if (localMovie) {
          normalizeMovieUrls(localMovie);
        }
      }
    } catch (dbErr) {
      console.warn("DB Query failed in getTvDetails:", dbErr.message);
    }

    return res.status(200).json({
      success: true,
      tv: tmdbDetails,
      localMovie
    });
  } catch (err) {
    return handleControllerError(res, err, "Failed to retrieve TV show details from TMDB");
  }
}
