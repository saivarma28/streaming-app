import { WatchHistoryModel } from "../models/WatchHistory.js";
import { UserModel } from "../models/User.js";
import { MovieModel } from "../models/Movie.js";

/**
 * Service managing user playback progress and watch history
 */
export class WatchHistoryService {
  static async getUserHistory(firebaseUid) {
    const user = await UserModel.findByFirebaseUid(firebaseUid);
    if (!user) {
      const err = new Error("User not found in local database.");
      err.status = 404;
      throw err;
    }
    return WatchHistoryModel.findByUserId(user.id);
  }

  static async saveProgress(firebaseUid, movieId, progress, completed = false) {
    const user = await UserModel.findByFirebaseUid(firebaseUid);
    if (!user) {
      const err = new Error("User not found in local database.");
      err.status = 404;
      throw err;
    }

    const movie = await MovieModel.findById(movieId);
    if (!movie) {
      const err = new Error("Movie not found.");
      err.status = 404;
      throw err;
    }

    return WatchHistoryModel.upsertProgress(user.id, movieId, progress, completed);
  }

  static async getAllHistories() {
    return WatchHistoryModel.findAll();
  }
}
