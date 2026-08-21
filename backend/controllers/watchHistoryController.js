import { prisma } from "../config/db.js";

/**
 * Retrieves the authenticated user's watch history.
 * GET /api/watch-history
 */
export async function getWatchHistory(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.firebaseUid }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in local database."
      });
    }

    const history = await prisma.watchHistory.findMany({
      where: { userId: user.id },
      include: {
        movie: {
          include: {
            genres: true
          }
        }
      },
      orderBy: { lastWatchedAt: "desc" }
    });

    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error("getWatchHistory Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve watch history."
    });
  }
}

/**
 * Creates or updates a watch history record.
 * POST /api/watch-history
 */
export async function saveWatchHistory(req, res) {
  const { movieId, progress, completed } = req.body;

  if (!movieId || progress === undefined) {
    return res.status(400).json({
      success: false,
      message: "Movie ID and progress are required."
    });
  }

  const parsedMovieId = parseInt(movieId);
  const parsedProgress = parseInt(progress);
  const isCompleted = completed === true || completed === "true";

  if (isNaN(parsedMovieId) || isNaN(parsedProgress)) {
    return res.status(400).json({
      success: false,
      message: "Movie ID and progress must be valid numbers."
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.firebaseUid }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in local database."
      });
    }

    // Verify the movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: parsedMovieId }
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found."
      });
    }

    // Upsert the watch history record
    const history = await prisma.watchHistory.upsert({
      where: {
        userId_movieId: {
          userId: user.id,
          movieId: parsedMovieId
        }
      },
      update: {
        progress: parsedProgress,
        completed: isCompleted,
        lastWatchedAt: new Date()
      },
      create: {
        userId: user.id,
        movieId: parsedMovieId,
        progress: parsedProgress,
        completed: isCompleted
      }
    });

    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error("saveWatchHistory Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save watch history."
    });
  }
}

/**
 * Updates an existing watch history record for a specific movie.
 * PUT /api/watch-history/:movieId
 */
export async function updateWatchHistory(req, res) {
  const { movieId } = req.params;
  const { progress, completed } = req.body;

  if (progress === undefined) {
    return res.status(400).json({
      success: false,
      message: "Progress value is required to update watch history."
    });
  }

  const parsedMovieId = parseInt(movieId);
  const parsedProgress = parseInt(progress);
  const isCompleted = completed === true || completed === "true";

  if (isNaN(parsedMovieId) || isNaN(parsedProgress)) {
    return res.status(400).json({
      success: false,
      message: "Movie ID and progress must be valid numbers."
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.firebaseUid }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in local database."
      });
    }

    // Check if the history record exists
    const existingHistory = await prisma.watchHistory.findUnique({
      where: {
        userId_movieId: {
          userId: user.id,
          movieId: parsedMovieId
        }
      }
    });

    let history;

    if (!existingHistory) {
      // If it doesn't exist yet, we create it
      history = await prisma.watchHistory.create({
        data: {
          userId: user.id,
          movieId: parsedMovieId,
          progress: parsedProgress,
          completed: isCompleted
        }
      });
    } else {
      // Update existing record
      history = await prisma.watchHistory.update({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: parsedMovieId
          }
        },
        data: {
          progress: parsedProgress,
          completed: isCompleted,
          lastWatchedAt: new Date()
        }
      });
    }

    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error("updateWatchHistory Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update watch history."
    });
  }
}
