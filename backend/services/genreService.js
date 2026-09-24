import { GenreModel } from "../models/Genre.js";

/**
 * Service managing genre catalog operations
 */
export class GenreService {
  static async getAllGenres() {
    return GenreModel.findAll();
  }

  static async createGenre(name) {
    if (!name || name.trim() === "") {
      const err = new Error("Genre name is required.");
      err.status = 400;
      throw err;
    }

    const normalizedName = name.trim();
    const existing = await GenreModel.findByName(normalizedName);
    if (existing) {
      const err = new Error("Genre with this name already exists.");
      err.status = 400;
      throw err;
    }

    return GenreModel.create(normalizedName);
  }

  static async updateGenre(id, name) {
    if (!name || name.trim() === "") {
      const err = new Error("Genre name is required.");
      err.status = 400;
      throw err;
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      const err = new Error("Invalid genre ID.");
      err.status = 400;
      throw err;
    }

    const normalizedName = name.trim();
    const existing = await GenreModel.findByName(normalizedName, parsedId);
    if (existing) {
      const err = new Error("Another genre with this name already exists.");
      err.status = 400;
      throw err;
    }

    const updated = await GenreModel.updateById(parsedId, normalizedName);
    if (!updated) {
      const err = new Error("Genre not found.");
      err.status = 404;
      throw err;
    }
    return updated;
  }

  static async deleteGenre(id) {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      const err = new Error("Invalid genre ID.");
      err.status = 400;
      throw err;
    }

    const deleted = await GenreModel.deleteById(parsedId);
    if (!deleted) {
      const err = new Error("Genre not found.");
      err.status = 404;
      throw err;
    }
    return deleted;
  }
}
