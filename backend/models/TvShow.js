import { getDb, getNextSequenceValue } from "../config/mongodb.js";
import { normalizeMediaUrl } from "../utils/mediaUrlHelper.js";

/**
 * TV Show Model / Data Access Object for MongoDB 'tvshows' and 'episodes' collections
 */
export class TvShowModel {
  static getCollection() {
    return getDb().collection("tvshows");
  }

  static getEpisodeCollection() {
    return getDb().collection("episodes");
  }

  static async find(filter = {}) {
    const tvShows = await this.getCollection().find(filter).sort({ createdAt: -1 }).toArray();
    for (let show of tvShows) {
      if (show.genreIds && Array.isArray(show.genreIds)) {
        const genres = await getDb().collection("genres")
          .find({ id: { $in: show.genreIds } })
          .toArray();
        show.genres = genres;
      } else {
        show.genres = [];
      }
    }
    return tvShows;
  }

  static async findById(id) {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) return null;
    const show = await this.getCollection().findOne({ id: parsedId });
    if (show && show.genreIds && Array.isArray(show.genreIds)) {
      const genres = await getDb().collection("genres")
        .find({ id: { $in: show.genreIds } })
        .toArray();
      show.genres = genres;
    }
    return show;
  }

  static async create(tvShowData) {
    const newId = await getNextSequenceValue("tvshows");
    const doc = {
      id: newId,
      title: tvShowData.title,
      description: tvShowData.description,
      thumbnailUrl: tvShowData.thumbnailUrl || null,
      backdropUrl: tvShowData.backdropUrl || null,
      trailerUrl: tvShowData.trailerUrl || null,
      releaseYear: tvShowData.releaseYear,
      maturityRating: tvShowData.maturityRating || null,
      language: tvShowData.language || "English",
      isPremium: tvShowData.isPremium || false,
      isPublished: tvShowData.isPublished !== undefined ? tvShowData.isPublished : true,
      genreIds: tvShowData.genreIds || [],
      totalSeasons: tvShowData.totalSeasons || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.getCollection().insertOne(doc);
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
    await this.getEpisodeCollection().deleteMany({ tvShowId: parsedId });
    return this.getCollection().deleteOne({ id: parsedId });
  }

  // --- Episode & Season Methods ---

  static async getSeasons(tvShowId) {
    const parsedTvShowId = parseInt(tvShowId);
    const episodes = await this.getEpisodeCollection()
      .find({ tvShowId: parsedTvShowId })
      .toArray();

    const seasonMap = {};
    for (const ep of episodes) {
      const sNum = ep.seasonNumber;
      if (!seasonMap[sNum]) {
        seasonMap[sNum] = {
          seasonNumber: sNum,
          episodeCount: 0
        };
      }
      seasonMap[sNum].episodeCount++;
    }

    const seasons = Object.values(seasonMap).sort((a, b) => a.seasonNumber - b.seasonNumber);
    return seasons;
  }

  static async getEpisodes(tvShowId, seasonNumber, filter = {}) {
    const whereClause = {
      tvShowId: parseInt(tvShowId),
      seasonNumber: parseInt(seasonNumber),
      ...filter
    };
    const episodes = await this.getEpisodeCollection()
      .find(whereClause)
      .sort({ episodeNumber: 1 })
      .toArray();

    return episodes.map((ep) => normalizeMediaUrl(ep));
  }

  static async getEpisodeByNumber(tvShowId, seasonNumber, episodeNumber) {
    const ep = await this.getEpisodeCollection().findOne({
      tvShowId: parseInt(tvShowId),
      seasonNumber: parseInt(seasonNumber),
      episodeNumber: parseInt(episodeNumber)
    });
    return normalizeMediaUrl(ep);
  }

  static async getEpisodeById(episodeId) {
    const ep = await this.getEpisodeCollection().findOne({ id: parseInt(episodeId) });
    return normalizeMediaUrl(ep);
  }

  static async createEpisode(episodeData) {
    const newId = await getNextSequenceValue("episodes");
    const doc = {
      id: newId,
      tvShowId: parseInt(episodeData.tvShowId),
      seasonNumber: parseInt(episodeData.seasonNumber),
      episodeNumber: parseInt(episodeData.episodeNumber),
      title: episodeData.title,
      description: episodeData.description || "",
      thumbnailUrl: episodeData.thumbnailUrl || null,
      videoUrl: episodeData.videoUrl || null,
      hlsUrl: episodeData.hlsUrl || episodeData.videoUrl || null,
      sourceVideoPath: episodeData.sourceVideoPath || episodeData.videoUrl || null,
      duration: episodeData.duration || 0,
      isPublished: episodeData.isPublished !== undefined ? episodeData.isPublished : true,
      transcodingStatus: episodeData.transcodingStatus || "READY",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.getEpisodeCollection().insertOne(doc);
    return normalizeMediaUrl(doc);
  }

  static async updateEpisode(episodeId, updateFields) {
    const parsedId = parseInt(episodeId);
    const fields = { ...updateFields, updatedAt: new Date() };
    await this.getEpisodeCollection().updateOne({ id: parsedId }, { $set: fields });
    return this.getEpisodeById(parsedId);
  }

  static async deleteEpisode(episodeId) {
    const parsedId = parseInt(episodeId);
    return this.getEpisodeCollection().deleteOne({ id: parsedId });
  }
}
