import { getDb, getNextSequenceValue } from "../config/mongodb.js";
import { normalizeMovieUrls } from "./movieController.js";

/**
 * Retrieves the authenticated user's watch history.
 * GET /api/watch-history
 */
export async function getWatchHistory(req, res) {
  try {
    const db = getDb();
    const user = await db.collection("users").findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in local database."
      });
    }

    const history = await db.collection("watch_histories")
      .find({ userId: user.id })
      .sort({ lastWatchedAt: -1 })
      .toArray();

    // Populate nested movie and genre relations
    for (let record of history) {
      const movie = await db.collection("movies").findOne({ id: record.movieId });
      if (movie) {
        const genres = await db.collection("genres")
          .find({ id: { $in: movie.genreIds || [] } })
          .toArray();
        movie.genres = genres;
        normalizeMovieUrls(movie);
        record.movie = movie;
      }
    }

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
    const db = getDb();
    const user = await db.collection("users").findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in local database."
      });
    }

    // Verify the movie exists
    const movie = await db.collection("movies").findOne({ id: parsedMovieId });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found."
      });
    }

    const watchHistoryCollection = db.collection("watch_histories");
    let historyRecord = await watchHistoryCollection.findOne({
      userId: user.id,
      movieId: parsedMovieId
    });

    let history;
    if (historyRecord) {
      // Update
      await watchHistoryCollection.updateOne(
        { id: historyRecord.id },
        {
          $set: {
            progress: parsedProgress,
            completed: isCompleted,
            lastWatchedAt: new Date()
          }
        }
      );
      history = await watchHistoryCollection.findOne({ id: historyRecord.id });
    } else {
      // Create
      const newId = await getNextSequenceValue("watch_histories");
      const newDoc = {
        id: newId,
        userId: user.id,
        movieId: parsedMovieId,
        progress: parsedProgress,
        completed: isCompleted,
        lastWatchedAt: new Date()
      };
      await watchHistoryCollection.insertOne(newDoc);
      history = newDoc;
    }

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
    const db = getDb();
    const user = await db.collection("users").findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in local database."
      });
    }

    const watchHistoryCollection = db.collection("watch_histories");
    let historyRecord = await watchHistoryCollection.findOne({
      userId: user.id,
      movieId: parsedMovieId
    });

    let history;
    if (!historyRecord) {
      // Create
      const newId = await getNextSequenceValue("watch_histories");
      const newDoc = {
        id: newId,
        userId: user.id,
        movieId: parsedMovieId,
        progress: parsedProgress,
        completed: isCompleted,
        lastWatchedAt: new Date()
      };
      await watchHistoryCollection.insertOne(newDoc);
      history = newDoc;
    } else {
      // Update
      await watchHistoryCollection.updateOne(
        { id: historyRecord.id },
        {
          $set: {
            progress: parsedProgress,
            completed: isCompleted,
            lastWatchedAt: new Date()
          }
        }
      );
      history = await watchHistoryCollection.findOne({ id: historyRecord.id });
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

/**
 * Retrieves all watch history records. (Admin only)
 * GET /api/watch-history/all
 */
export async function getAllWatchHistories(req, res) {
  try {
    const db = getDb();
    const history = await db.collection("watch_histories")
      .find({})
      .sort({ lastWatchedAt: -1 })
      .toArray();

    // Populate user and movie (with genres) relations
    for (let record of history) {
      const user = await db.collection("users").findOne({ id: record.userId });
      record.user = user;

      const movie = await db.collection("movies").findOne({ id: record.movieId });
      if (movie) {
        const genres = await db.collection("genres")
          .find({ id: { $in: movie.genreIds || [] } })
          .toArray();
        movie.genres = genres;
        normalizeMovieUrls(movie);
        record.movie = movie;
      }
    }

    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error("getAllWatchHistories Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving watch histories."
    });
  }
}

