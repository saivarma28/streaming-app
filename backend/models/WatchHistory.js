import { getDb, getNextSequenceValue } from "../config/mongodb.js";
import { MovieModel } from "./Movie.js";

/**
 * WatchHistory Model / Data Access Object for MongoDB 'watch_histories' collection
 */
export class WatchHistoryModel {
  static getCollection() {
    return getDb().collection("watch_histories");
  }

  static async findByUserId(userId) {
    const history = await this.getCollection()
      .find({ userId: parseInt(userId) })
      .sort({ lastWatchedAt: -1 })
      .toArray();

    for (let record of history) {
      const movie = await MovieModel.findById(record.movieId);
      if (movie) {
        record.movie = movie;
      }
    }

    return history;
  }

  static async findOne(userId, movieId) {
    return this.getCollection().findOne({
      userId: parseInt(userId),
      movieId: parseInt(movieId)
    });
  }

  static async upsertProgress(userId, movieId, progress, completed = false) {
    const parsedUserId = parseInt(userId);
    const parsedMovieId = parseInt(movieId);
    const parsedProgress = parseInt(progress);
    const isCompleted = completed === true || completed === "true";

    const existingRecord = await this.findOne(parsedUserId, parsedMovieId);

    if (existingRecord) {
      await this.getCollection().updateOne(
        { id: existingRecord.id },
        {
          $set: {
            progress: parsedProgress,
            completed: isCompleted,
            lastWatchedAt: new Date()
          }
        }
      );
      return this.getCollection().findOne({ id: existingRecord.id });
    } else {
      const newId = await getNextSequenceValue("watch_histories");
      const newDoc = {
        id: newId,
        userId: parsedUserId,
        movieId: parsedMovieId,
        progress: parsedProgress,
        completed: isCompleted,
        lastWatchedAt: new Date()
      };
      await this.getCollection().insertOne(newDoc);
      return newDoc;
    }
  }

  static async findAll() {
    const history = await this.getCollection()
      .find({})
      .sort({ lastWatchedAt: -1 })
      .toArray();

    for (let record of history) {
      const user = await getDb().collection("users").findOne({ id: record.userId });
      record.user = user;

      const movie = await MovieModel.findById(record.movieId);
      if (movie) {
        record.movie = movie;
      }
    }

    return history;
  }
}
