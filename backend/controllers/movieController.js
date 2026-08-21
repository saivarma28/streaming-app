import { prisma } from "../config/db.js";
import { uploadToGCS } from "../services/googleCloudStorage.js";
import { createTranscodingJob, getTranscodingJobStatus } from "../services/googleTranscoder.js";
import fs from "fs";
import path from "path";

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
 * Optionally handles uploading a video file directly to Google Cloud Storage.
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
    // 1. Insert Movie Record into PostgreSQL via Prisma first
    let movie = await prisma.movie.create({
      data: {
        title,
        description,
        thumbnailUrl,
        backdropUrl,
        trailerUrl,
        duration: parsedDuration,
        releaseYear: parsedReleaseYear,
        maturityRating: maturityRating || null,
        language: language || "English",
        isPremium: parsedIsPremium,
        isPublished: parsedIsPublished,
        transcodingStatus: req.file ? "UPLOADING" : "READY",
        genres: {
          connect: parsedGenreIds.map((id) => ({ id: parseInt(id) }))
        }
      },
      include: {
        genres: true
      }
    });

    // 2. Process Video File Upload
    if (req.file) {
      try {
        const isGcpConfigured = process.env.GOOGLE_CLOUD_BUCKET_NAME ? true : false;

        if (isGcpConfigured) {
          const destinationPath = `movies/${movie.id}/source_${Date.now()}_${req.file.originalname}`;
          const inputUri = await uploadToGCS(req.file.buffer, destinationPath, req.file.mimetype);
          
          const outputFolder = `movies/${movie.id}/transcoded/`;
          const outputUri = `gs://${process.env.GOOGLE_CLOUD_OUTPUT_BUCKET_NAME}/${outputFolder}`;
          
          // Create Transcoder job
          const jobInfo = await createTranscodingJob(inputUri, outputUri);
          
          const hlsUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_OUTPUT_BUCKET_NAME}/${outputFolder}master.m3u8`;
          
          movie = await prisma.movie.update({
            where: { id: movie.id },
            data: {
              sourceVideoPath: inputUri,
              transcoderJobName: jobInfo.jobName,
              transcodingStatus: "PROCESSING",
              hlsUrl: hlsUrl
            },
            include: {
              genres: true
            }
          });
        } else {
          // Local fallback: save file to backend/uploads/movies
          console.warn("WARNING: Google Cloud not configured. Using local file storage fallback.");
          
          const uploadDir = path.resolve("uploads/movies");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const filename = `movie_${movie.id}_${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
          const filepath = path.join(uploadDir, filename);
          fs.writeFileSync(filepath, req.file.buffer);
          
          const localUrl = `http://localhost:5000/uploads/movies/${filename}`;
          
          movie = await prisma.movie.update({
            where: { id: movie.id },
            data: {
              sourceVideoPath: filepath,
              transcodingStatus: "READY",
              hlsUrl: localUrl
            },
            include: {
              genres: true
            }
          });
        }
      } catch (uploadError) {
        console.error("Upload/Transcode process failed:", uploadError.message);
        // Mark status as FAILED
        movie = await prisma.movie.update({
          where: { id: movie.id },
          data: { transcodingStatus: "FAILED" },
          include: { genres: true }
        });
        
        return res.status(500).json({
          success: false,
          message: `Video upload failed: ${uploadError.message}`,
          movie
        });
      }
    }

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
 * Optionally handles uploading/replacing a video file on Google Cloud Storage.
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

    let uploadResult = {};
    // 1. Process Video File Upload
    if (req.file) {
      try {
        // Temporarily mark status as UPLOADING during the file write process
        await prisma.movie.update({
          where: { id: existingMovie.id },
          data: { transcodingStatus: "UPLOADING" }
        });

        const isGcpConfigured = process.env.GOOGLE_CLOUD_BUCKET_NAME ? true : false;

        if (isGcpConfigured) {
          const destinationPath = `movies/${existingMovie.id}/source_${Date.now()}_${req.file.originalname}`;
          const inputUri = await uploadToGCS(req.file.buffer, destinationPath, req.file.mimetype);
          
          const outputFolder = `movies/${existingMovie.id}/transcoded/`;
          const outputUri = `gs://${process.env.GOOGLE_CLOUD_OUTPUT_BUCKET_NAME}/${outputFolder}`;
          
          const jobInfo = await createTranscodingJob(inputUri, outputUri);
          
          const hlsUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_OUTPUT_BUCKET_NAME}/${outputFolder}master.m3u8`;
          
          uploadResult = {
            sourceVideoPath: inputUri,
            transcoderJobName: jobInfo.jobName,
            transcodingStatus: "PROCESSING",
            hlsUrl: hlsUrl
          };
        } else {
          // Local fallback: save file to backend/uploads/movies
          console.warn("WARNING: Google Cloud not configured. Using local file storage fallback.");
          
          const uploadDir = path.resolve("uploads/movies");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const filename = `movie_${existingMovie.id}_${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
          const filepath = path.join(uploadDir, filename);
          fs.writeFileSync(filepath, req.file.buffer);
          
          const localUrl = `http://localhost:5000/uploads/movies/${filename}`;
          
          uploadResult = {
            sourceVideoPath: filepath,
            transcodingStatus: "READY",
            hlsUrl: localUrl
          };
        }
      } catch (uploadError) {
        console.error("Upload/Transcode process failed:", uploadError.message);
        // Mark status as FAILED in DB
        await prisma.movie.update({
          where: { id: existingMovie.id },
          data: { transcodingStatus: "FAILED" }
        });
        return res.status(500).json({
          success: false,
          message: `Video upload replacement failed: ${uploadError.message}`
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
        duration: parsedDuration,
        releaseYear: parsedReleaseYear,
        maturityRating: maturityRating !== undefined ? maturityRating : undefined,
        language: language !== undefined ? language : undefined,
        isPremium: parsedIsPremium,
        isPublished: parsedIsPublished,
        genres: parsedGenreIds !== undefined ? {
          set: parsedGenreIds.map((gid) => ({ id: parseInt(gid) }))
        } : undefined,
        ...uploadResult
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

/**
 * Checks and updates the GCP transcoding job status.
 * GET /api/movies/:id/transcoding-status
 */
export async function getTranscodingStatus(req, res) {
  const { id } = req.params;

  try {
    const movie = await prisma.movie.findUnique({
      where: { id: parseInt(id) }
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found."
      });
    }

    // If status is PROCESSING and there is a transcoder job name, we poll Google Cloud
    if (movie.transcodingStatus === "PROCESSING" && movie.transcoderJobName) {
      try {
        const jobStatus = await getTranscodingJobStatus(movie.transcoderJobName);
        let newStatus = movie.transcodingStatus;

        if (jobStatus.state === "SUCCEEDED") {
          newStatus = "READY";
        } else if (jobStatus.state === "FAILED") {
          newStatus = "FAILED";
        }

        if (newStatus !== movie.transcodingStatus) {
          await prisma.movie.update({
            where: { id: parseInt(id) },
            data: { transcodingStatus: newStatus }
          });
          movie.transcodingStatus = newStatus;
        }
      } catch (err) {
        console.warn("Failed to check Google Transcoding job status:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      status: movie.transcodingStatus
    });
  } catch (error) {
    console.error("getTranscodingStatus Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching transcoding status."
    });
  }
}

