import { TvShowService } from "../services/tvShowService.js";
import { normalizeMediaUrl } from "../utils/mediaUrlHelper.js";

// Re-export normalizeTvUrls for backward compatibility
export const normalizeTvUrls = normalizeMediaUrl;

/**
 * Controller for TV show and episode operations
 */

export async function getTvShows(req, res) {
  const { adminView, genreId } = req.query;
  const firebaseUid = req.user?.firebaseUid;

  try {
    const tvShows = await TvShowService.getTvShows({ adminView, genreId, firebaseUid });
    return res.status(200).json({ success: true, tvShows });
  } catch (error) {
    console.error("getTvShows Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch TV shows." });
  }
}

export async function getTvShowById(req, res) {
  const { id } = req.params;
  const firebaseUid = req.user?.firebaseUid;

  try {
    const tvShow = await TvShowService.getTvShowById(id, firebaseUid);
    return res.status(200).json({ success: true, tvShow });
  } catch (error) {
    console.error("getTvShowById Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to fetch TV show." });
  }
}

export async function createTvShow(req, res) {
  const {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    trailerUrl,
    releaseYear,
    maturityRating,
    language,
    isPremium,
    isPublished,
    genreIds,
    totalSeasons
  } = req.body;

  if (!title || !description || !releaseYear) {
    return res.status(400).json({
      success: false,
      message: "Title, description, and release year are required fields."
    });
  }

  try {
    const doc = await TvShowService.createTvShow({
      title,
      description,
      thumbnailUrl,
      backdropUrl,
      trailerUrl,
      releaseYear: parseInt(releaseYear),
      maturityRating,
      language: language || "English",
      isPremium: isPremium === true || isPremium === "true",
      isPublished: isPublished === true || isPublished === "true",
      genreIds: Array.isArray(genreIds) ? genreIds : [],
      totalSeasons: parseInt(totalSeasons) || 1
    });

    return res.status(201).json({ success: true, tvShow: doc });
  } catch (error) {
    console.error("createTvShow Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create TV show." });
  }
}

export async function updateTvShow(req, res) {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.releaseYear !== undefined) updateData.releaseYear = parseInt(updateData.releaseYear);
  if (updateData.totalSeasons !== undefined) updateData.totalSeasons = parseInt(updateData.totalSeasons);
  if (updateData.isPremium !== undefined) updateData.isPremium = updateData.isPremium === true || updateData.isPremium === "true";
  if (updateData.isPublished !== undefined) updateData.isPublished = updateData.isPublished === true || updateData.isPublished === "true";

  try {
    const updated = await TvShowService.updateTvShow(id, updateData);
    return res.status(200).json({ success: true, tvShow: updated });
  } catch (error) {
    console.error("updateTvShow Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to update TV show." });
  }
}

export async function deleteTvShow(req, res) {
  const { id } = req.params;

  try {
    await TvShowService.deleteTvShow(id);
    return res.status(200).json({ success: true, message: "TV Show deleted successfully." });
  } catch (error) {
    console.error("deleteTvShow Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to delete TV show." });
  }
}

export async function getTvShowPresignedUploadUrl(req, res) {
  const { filename, contentType } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({
      success: false,
      message: "Filename and contentType are required fields."
    });
  }

  try {
    const result = await TvShowService.generatePresignedUploadUrl(filename, contentType);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Failed to generate presigned R2 upload URL for TV Show:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to generate presigned upload URL." });
  }
}

export async function getSeasons(req, res) {
  const { id } = req.params;

  try {
    const seasons = await TvShowService.getSeasons(id);
    return res.status(200).json({ success: true, seasons });
  } catch (error) {
    console.error("getSeasons Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch seasons." });
  }
}

export async function getEpisodes(req, res) {
  const { id, seasonNumber } = req.params;
  const { adminView } = req.query;
  const firebaseUid = req.user?.firebaseUid;

  try {
    const episodes = await TvShowService.getEpisodes(id, seasonNumber, { adminView, firebaseUid });
    return res.status(200).json({ success: true, episodes });
  } catch (error) {
    console.error("getEpisodes Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch episodes." });
  }
}

export async function getEpisodeById(req, res) {
  const { id, seasonNumber, episodeNumber } = req.params;
  const firebaseUid = req.user?.firebaseUid;

  try {
    const episode = await TvShowService.getEpisodeByNumber(id, seasonNumber, episodeNumber, firebaseUid);
    return res.status(200).json({ success: true, episode });
  } catch (error) {
    console.error("getEpisodeById Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to fetch episode details." });
  }
}

export async function createEpisode(req, res) {
  const { id, seasonNumber } = req.params;
  const { title, description, thumbnailUrl, duration, isPublished, videoUrl, episodeNumber } = req.body;

  if (!title || episodeNumber === undefined) {
    return res.status(400).json({ success: false, message: "Title and episodeNumber are required fields." });
  }

  try {
    const episodeData = {
      title,
      description,
      thumbnailUrl,
      videoUrl,
      duration: parseInt(duration) || 0,
      episodeNumber: parseInt(episodeNumber),
      isPublished: isPublished === "true" || isPublished === true
    };

    const episode = await TvShowService.createEpisode(id, seasonNumber, episodeData, req.file);
    return res.status(201).json({ success: true, episode });
  } catch (error) {
    console.error("createEpisode Controller Error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to create episode." });
  }
}

export async function updateEpisode(req, res) {
  const { id, seasonNumber, episodeId } = req.params;
  const { title, description, thumbnailUrl, duration, isPublished, videoUrl, episodeNumber } = req.body;

  const updateFields = {};
  if (title !== undefined) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;
  if (thumbnailUrl !== undefined) updateFields.thumbnailUrl = thumbnailUrl;
  if (duration !== undefined) updateFields.duration = parseInt(duration) || 0;
  if (episodeNumber !== undefined) updateFields.episodeNumber = parseInt(episodeNumber);
  if (isPublished !== undefined) updateFields.isPublished = isPublished === "true" || isPublished === true;
  if (videoUrl !== undefined) {
    updateFields.videoUrl = videoUrl;
    updateFields.hlsUrl = videoUrl;
    updateFields.sourceVideoPath = videoUrl;
    updateFields.transcodingStatus = "READY";
  }

  try {
    const updated = await TvShowService.updateEpisode(id, seasonNumber, episodeId, updateFields, req.file);
    return res.status(200).json({ success: true, episode: updated });
  } catch (error) {
    console.error("updateEpisode Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to update episode." });
  }
}

export async function deleteEpisode(req, res) {
  const { episodeId } = req.params;

  try {
    await TvShowService.deleteEpisode(episodeId);
    return res.status(200).json({ success: true, message: "Episode deleted successfully." });
  } catch (error) {
    console.error("deleteEpisode Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to delete episode." });
  }
}
