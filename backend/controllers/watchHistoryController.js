import { WatchHistoryService } from "../services/watchHistoryService.js";

/**
 * Controller for user playback progress and watch history
 */

export async function getWatchHistory(req, res) {
  const firebaseUid = req.user?.firebaseUid;

  try {
    const history = await WatchHistoryService.getUserHistory(firebaseUid);
    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("getWatchHistory Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve watch history."
    });
  }
}

export async function saveWatchHistory(req, res) {
  const firebaseUid = req.user?.firebaseUid;
  const { movieId, progress, completed } = req.body;

  if (!movieId || progress === undefined) {
    return res.status(400).json({
      success: false,
      message: "Movie ID and progress are required."
    });
  }

  const parsedMovieId = parseInt(movieId);
  const parsedProgress = parseInt(progress);
  if (isNaN(parsedMovieId) || isNaN(parsedProgress)) {
    return res.status(400).json({
      success: false,
      message: "Movie ID and progress must be valid numbers."
    });
  }

  try {
    const history = await WatchHistoryService.saveProgress(firebaseUid, parsedMovieId, parsedProgress, completed);
    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("saveWatchHistory Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to save watch history."
    });
  }
}

export async function updateWatchHistory(req, res) {
  const firebaseUid = req.user?.firebaseUid;
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
  if (isNaN(parsedMovieId) || isNaN(parsedProgress)) {
    return res.status(400).json({
      success: false,
      message: "Movie ID and progress must be valid numbers."
    });
  }

  try {
    const history = await WatchHistoryService.saveProgress(firebaseUid, parsedMovieId, parsedProgress, completed);
    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("updateWatchHistory Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update watch history."
    });
  }
}

export async function getAllWatchHistories(req, res) {
  try {
    const history = await WatchHistoryService.getAllHistories();
    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("getAllWatchHistories Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving watch histories."
    });
  }
}
