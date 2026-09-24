import { MovieService } from "../services/movieService.js";
import { normalizeMediaUrl } from "../utils/mediaUrlHelper.js";

// Re-export normalizeMovieUrls for backward compatibility
export const normalizeMovieUrls = normalizeMediaUrl;

/**
 * Controller for movie operations
 */

/**
 * Retrieves movies list.
 * GET /api/movies
 */
export async function getMovies(req, res) {
  const { adminView, genreId } = req.query;
  const firebaseUid = req.user?.firebaseUid;

  try {
    const movies = await MovieService.getMovies({ adminView, genreId, firebaseUid });
    return res.status(200).json({ success: true, movies });
  } catch (error) {
    console.error("getMovies Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching movies."
    });
  }
}

/**
 * Retrieves a single movie by ID.
 * GET /api/movies/:id
 */
export async function getMovieById(req, res) {
  const { id } = req.params;
  const firebaseUid = req.user?.firebaseUid;

  try {
    const movie = await MovieService.getMovieById(id, firebaseUid);
    return res.status(200).json({ success: true, movie });
  } catch (error) {
    console.error("getMovieById Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "An error occurred while retrieving movie details."
    });
  }
}

/**
 * Creates a new movie. (Admin only)
 * POST /api/movies
 */
export async function createMovie(req, res) {
  let {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    trailerUrl,
    duration,
    releaseYear,
    maturityRating,
    language,
    isPremium,
    isPublished,
    genreIds,
    videoUrl
  } = req.body;

  if (!title || !description || !duration || !releaseYear) {
    return res.status(400).json({
      success: false,
      message: "Title, description, duration, and release year are required fields."
    });
  }

  const parsedDuration = parseInt(duration);
  const parsedReleaseYear = parseInt(releaseYear);
  const parsedIsPremium = isPremium === "true" || isPremium === true;
  const parsedIsPublished = isPublished === "true" || isPublished === true;

  if (isNaN(parsedDuration) || isNaN(parsedReleaseYear)) {
    return res.status(400).json({
      success: false,
      message: "Duration and release year must be valid numbers."
    });
  }

  let parsedGenreIds = [];
  if (genreIds) {
    try {
      if (typeof genreIds === "string") {
        parsedGenreIds = JSON.parse(genreIds);
      } else if (Array.isArray(genreIds)) {
        parsedGenreIds = genreIds;
      }
    } catch (e) {
      parsedGenreIds = String(genreIds)
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
    }
  }

  try {
    const movieData = {
      title,
      description,
      thumbnailUrl: thumbnailUrl || null,
      backdropUrl: backdropUrl || null,
      trailerUrl: trailerUrl || null,
      videoUrl: videoUrl || null,
      duration: parsedDuration,
      releaseYear: parsedReleaseYear,
      maturityRating: maturityRating || null,
      language: language || "English",
      isPremium: parsedIsPremium,
      isPublished: parsedIsPublished,
      genreIds: parsedGenreIds
    };

    const movie = await MovieService.createMovie(movieData, req.file);
    return res.status(201).json({ success: true, movie });
  } catch (error) {
    console.error("createMovie Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create movie record."
    });
  }
}

/**
 * Updates an existing movie record. (Admin only)
 * PUT /api/movies/:id
 */
export async function updateMovie(req, res) {
  const { id } = req.params;
  let {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    trailerUrl,
    duration,
    releaseYear,
    maturityRating,
    language,
    isPremium,
    isPublished,
    genreIds,
    videoUrl
  } = req.body;

  const updateFields = {};
  if (title !== undefined) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;
  if (thumbnailUrl !== undefined) updateFields.thumbnailUrl = thumbnailUrl;
  if (backdropUrl !== undefined) updateFields.backdropUrl = backdropUrl;
  if (trailerUrl !== undefined) updateFields.trailerUrl = trailerUrl;
  if (duration !== undefined) updateFields.duration = parseInt(duration);
  if (releaseYear !== undefined) updateFields.releaseYear = parseInt(releaseYear);
  if (maturityRating !== undefined) updateFields.maturityRating = maturityRating;
  if (language !== undefined) updateFields.language = language;
  if (isPremium !== undefined) updateFields.isPremium = isPremium === "true" || isPremium === true;
  if (isPublished !== undefined) updateFields.isPublished = isPublished === "true" || isPublished === true;
  if (videoUrl !== undefined) {
    updateFields.videoUrl = videoUrl;
    updateFields.hlsUrl = videoUrl;
    updateFields.sourceVideoPath = videoUrl;
    updateFields.transcodingStatus = "READY";
  }

  if (genreIds !== undefined) {
    try {
      if (typeof genreIds === "string") {
        updateFields.genreIds = JSON.parse(genreIds);
      } else if (Array.isArray(genreIds)) {
        updateFields.genreIds = genreIds;
      }
    } catch (e) {
      updateFields.genreIds = String(genreIds)
        .split(",")
        .map((gid) => parseInt(gid.trim()))
        .filter((gid) => !isNaN(gid));
    }
  }

  try {
    const updatedMovie = await MovieService.updateMovie(id, updateFields, req.file);
    return res.status(200).json({ success: true, movie: updatedMovie });
  } catch (error) {
    console.error("updateMovie Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update movie record."
    });
  }
}

/**
 * Deletes a movie record. (Admin only)
 * DELETE /api/movies/:id
 */
export async function deleteMovie(req, res) {
  const { id } = req.params;

  try {
    await MovieService.deleteMovie(id);
    return res.status(200).json({
      success: true,
      message: "Movie deleted successfully from catalog."
    });
  } catch (error) {
    console.error("deleteMovie Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to delete movie."
    });
  }
}

/**
 * Checks and updates the GCP transcoding job status.
 * GET /api/movies/:id/transcoding-status
 */
export async function getTranscodingStatus(req, res) {
  const { id } = req.params;

  try {
    const status = await MovieService.getTranscodingStatus(id);
    return res.status(200).json({ success: true, status });
  } catch (error) {
    console.error("getTranscodingStatus Controller Error:", error.message);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "An error occurred while fetching transcoding status."
    });
  }
}

/**
 * Generates presigned PUT URL for direct R2 uploads.
 * POST /api/movies/presigned-url
 */
export async function getPresignedUploadUrl(req, res) {
  const { filename, contentType } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({
      success: false,
      message: "Filename and contentType are required fields."
    });
  }

  try {
    const result = await MovieService.generatePresignedUploadUrl(filename, contentType);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Failed to generate presigned R2 upload URL:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate presigned upload URL."
    });
  }
}
