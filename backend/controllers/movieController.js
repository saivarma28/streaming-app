import { prisma } from "../config/db.js";
import { uploadToCloudflareStream } from "../services/cloudflareStream.js";

/**
 * Retrieves movies list.
 * Regular users only see published movies. Admins can see all if query.adminView === 'true'.
 * Supports optional filtering by genreId.
 * 
 * GET /api/movies
 */
export async function getMovies(req, res) {
  const { adminView, genreId } = req.query;

  try {
    let whereClause = { isPublished: true };

    // If adminView is requested, verify user role first
    if (adminView === "true" && req.user?.firebaseUid) {
      const user = await prisma.user.findUnique({
        where: { firebaseUid: req.user.firebaseUid }
      });
      if (user && user.role === "admin") {
        whereClause = {}; // Admins can view all records (both published and unpublished)
      }
    }

    // Apply optional genre filter
    if (genreId) {
      whereClause.genres = {
        some: {
          id: parseInt(genreId)
        }
      };
    }

    const movies = await prisma.movie.findMany({
      where: whereClause,
      include: {
        genres: true
      },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({
      success: true,
      movies
    });
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

  try {
    const movie = await prisma.movie.findUnique({
      where: { id: parseInt(id) },
      include: {
        genres: true
      }
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found."
      });
    }

    // Check permissions if movie is unpublished
    if (!movie.isPublished) {
      let isAuthorized = false;
      if (req.user?.firebaseUid) {
        const user = await prisma.user.findUnique({
          where: { firebaseUid: req.user.firebaseUid }
        });
        if (user && user.role === "admin") {
          isAuthorized = true;
        }
      }
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. Access to unpublished media restricted."
        });
      }
    }

    return res.status(200).json({
      success: true,
      movie
    });
  } catch (error) {
    console.error("getMovieById Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving movie details."
    });
  }
}

/**
 * Creates a new movie. (Admin only)
 * Optionally handles uploading a video file directly to Cloudflare Stream.
 * 
 * POST /api/movies
 */
export async function createMovie(req, res) {
  let {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    trailerUrl,
    videoStreamId,
    duration,
    releaseYear,
    maturityRating,
    language,
    isPremium,
    isPublished,
    genreIds
  } = req.body;

  // Validation
  if (!title || !description || !duration || !releaseYear) {
    return res.status(400).json({
      success: false,
      message: "Title, description, duration, and release year are required fields."
    });
  }

  // Parse types from multipart/form-data
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

  // Parse genreIds if transferred as JSON string or comma-separated list
  let parsedGenreIds = [];
  if (genreIds) {
    try {
      if (typeof genreIds === "string") {
        parsedGenreIds = JSON.parse(genreIds);
      } else if (Array.isArray(genreIds)) {
        parsedGenreIds = genreIds;
      }
    } catch (e) {
      // Fallback to split if simple comma-separated string
      parsedGenreIds = String(genreIds)
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
    }
  }

  try {
    // 1. Process Video File Upload to Cloudflare Stream if provided
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudflareStream(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        videoStreamId = uploadResult.videoStreamId;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: `Video upload failed: ${uploadError.message}`
        });
      }
    }

    // 2. Insert Movie Record into PostgreSQL via Prisma
    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        thumbnailUrl,
        backdropUrl,
        trailerUrl,
        videoStreamId: videoStreamId || null,
        duration: parsedDuration,
        releaseYear: parsedReleaseYear,
        maturityRating: maturityRating || null,
        language: language || "English",
        isPremium: parsedIsPremium,
        isPublished: parsedIsPublished,
        genres: {
          connect: parsedGenreIds.map((id) => ({ id: parseInt(id) }))
        }
      },
      include: {
        genres: true
      }
    });

    return res.status(201).json({
      success: true,
      movie
    });
  } catch (error) {
    console.error("createMovie Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create movie record."
    });
  }
}

/**
 * Updates an existing movie record. (Admin only)
 * Optionally handles uploading/replacing a video file on Cloudflare Stream.
 * 
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
    videoStreamId,
    duration,
    releaseYear,
    maturityRating,
    language,
    isPremium,
    isPublished,
    genreIds
  } = req.body;

  try {
    const existingMovie = await prisma.movie.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMovie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found."
      });
    }

    // Parse types
    const parsedDuration = duration !== undefined ? parseInt(duration) : undefined;
    const parsedReleaseYear = releaseYear !== undefined ? parseInt(releaseYear) : undefined;
    const parsedIsPremium = isPremium !== undefined ? (isPremium === "true" || isPremium === true) : undefined;
    const parsedIsPublished = isPublished !== undefined ? (isPublished === "true" || isPublished === true) : undefined;

    // Parse genreIds if provided
    let parsedGenreIds = undefined;
    if (genreIds !== undefined) {
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

    // 1. Process Video File Upload to Cloudflare Stream if replacing
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudflareStream(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        videoStreamId = uploadResult.videoStreamId;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: `Video upload failed: ${uploadError.message}`
        });
      }
    }

    // 2. Perform database update
    const updatedMovie = await prisma.movie.update({
      where: { id: parseInt(id) },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : undefined,
        backdropUrl: backdropUrl !== undefined ? backdropUrl : undefined,
        trailerUrl: trailerUrl !== undefined ? trailerUrl : undefined,
        videoStreamId: videoStreamId !== undefined ? videoStreamId : undefined,
        duration: parsedDuration,
        releaseYear: parsedReleaseYear,
        maturityRating: maturityRating !== undefined ? maturityRating : undefined,
        language: language !== undefined ? language : undefined,
        isPremium: parsedIsPremium,
        isPublished: parsedIsPublished,
        genres: parsedGenreIds !== undefined ? {
          set: parsedGenreIds.map((gid) => ({ id: parseInt(gid) }))
        } : undefined
      },
      include: {
        genres: true
      }
    });

    return res.status(200).json({
      success: true,
      movie: updatedMovie
    });
  } catch (error) {
    console.error("updateMovie Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update movie record."
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
    const existingMovie = await prisma.movie.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMovie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found."
      });
    }

    await prisma.movie.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      success: true,
      message: "Movie deleted successfully from catalog."
    });
  } catch (error) {
    console.error("deleteMovie Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete movie."
    });
  }
}
