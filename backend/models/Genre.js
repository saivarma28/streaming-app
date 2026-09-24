import { getDb, getNextSequenceValue } from "../config/mongodb.js";

/**
 * Genre Model / Data Access Object for MongoDB 'genres' collection
 */
export class GenreModel {
  static getCollection() {
    return getDb().collection("genres");
  }

  static async findAll() {
    return this.getCollection().find({}).sort({ name: 1 }).toArray();
  }

  static async findById(id) {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) return null;
    return this.getCollection().findOne({ id: parsedId });
  }

  static async findByName(name, excludeId = null) {
    const query = { name: name.trim() };
    if (excludeId !== null) {
      query.id = { $ne: parseInt(excludeId) };
    }
    return this.getCollection().findOne(query);
  }

  static async create(name) {
    const newId = await getNextSequenceValue("genres");
    const doc = {
      id: newId,
      name: name.trim(),
      createdAt: new Date()
    };
    await this.getCollection().insertOne(doc);
    return doc;
  }

  static async updateById(id, name) {
    const parsedId = parseInt(id);
    await this.getCollection().updateOne(
      { id: parsedId },
      { $set: { name: name.trim() } }
    );
    return this.findById(parsedId);
  }

  static async deleteById(id) {
    const parsedId = parseInt(id);
    const genre = await this.findById(parsedId);
    if (!genre) return null;

    await this.getCollection().deleteOne({ id: parsedId });

    // Remove genre id from movies and tv shows
    await getDb().collection("movies").updateMany(
      { genreIds: parsedId },
      { $pull: { genreIds: parsedId } }
    );
    await getDb().collection("tvshows").updateMany(
      { genreIds: parsedId },
      { $pull: { genreIds: parsedId } }
    );

    return genre;
  }
}
