import { getDb, getNextSequenceValue } from "../config/mongodb.js";
import { normalizeMediaUrl } from "../utils/mediaUrlHelper.js";

/**
 * Movie Model / Data Access Object for MongoDB 'movies' collection
 */
export class MovieModel {
  static getCollection() {
    return getDb().collection("movies");
  }

  static async find(filter = {}) {
    const movies = await this.getCollection().find(filter).sort({ createdAt: -1 }).toArray();
    for (let movie of movies) {
      await this.populateGenres(movie);
      normalizeMediaUrl(movie);
    }
    return movies;
  }

  static async findById(id) {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) return null;
    const movie = await this.getCollection().findOne({ id: parsedId });
    if (movie) {
      await this.populateGenres(movie);
      normalizeMediaUrl(movie);
    }
    return movie;
  }

  static async populateGenres(movie) {
    if (!movie || !movie.genreIds || !Array.isArray(movie.genreIds)) {
      if (movie) movie.genres = [];
      return movie;
    }
    const genres = await getDb().collection("genres")
      .find({ id: { $in: movie.genreIds } })
      .toArray();
    movie.genres = genres;
    return movie;
  }

  static async create(movieData) {
    const newId = await getNextSequenceValue("movies");
    const doc = {
      id: newId,
      title: movieData.title,
      description: movieData.description,
      thumbnailUrl: movieData.thumbnailUrl || null,
      backdropUrl: movieData.backdropUrl || null,
      trailerUrl: movieData.trailerUrl || null,
      videoUrl: movieData.videoUrl || null,
      hlsUrl: movieData.hlsUrl || movieData.videoUrl || null,
      sourceVideoPath: movieData.sourceVideoPath || movieData.videoUrl || null,
      transcoderJobName: movieData.transcoderJobName || null,
      duration: movieData.duration,
      releaseYear: movieData.releaseYear,
      maturityRating: movieData.maturityRating || null,
      language: movieData.language || "English",
      isPremium: movieData.isPremium || false,
      isPublished: movieData.isPublished !== undefined ? movieData.isPublished : true,
      transcodingStatus: movieData.transcodingStatus || "READY",
      genreIds: movieData.genreIds || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.getCollection().insertOne(doc);
    await this.populateGenres(doc);
    return doc;
  }

  static async updateById(id, updateFields) {
    const parsedId = parseInt(id);
    const fields = { ...updateFields, updatedAt: new Date() };
    await this.getCollection().updateOne({ id: parsedId }, { $set: fields });
    return this.findById(parsedId);
  }

  static async deleteById(id) {
    const parsedId = parseInt(id);
    const result = await this.getCollection().deleteOne({ id: parsedId });
    // Also remove associated watch histories
    await getDb().collection("watch_histories").deleteMany({ movieId: parsedId });
    return result;
  }
}
