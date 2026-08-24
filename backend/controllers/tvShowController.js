import { getDb, getNextSequenceValue } from "../config/mongodb.js";
import { uploadToR2, s3, isR2Configured, bucketNameExport } from "../services/cloudflareR2.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Helper to dynamically normalize private R2 URLs using environment prefix
export function normalizeTvUrls(item) {
  if (!item) return item;
  const publicPrefix = process.env.R2_PUBLIC_URL_PREFIX;
  if (publicPrefix && item.hlsUrl && item.hlsUrl.includes("r2.cloudflarestorage.com")) {
    const cleanPrefix = publicPrefix.replace(/\/$/, "");
    const parts = item.hlsUrl.split("/streaming-app/");
    if (parts.length > 1) {
      item.hlsUrl = `${cleanPrefix}/${parts[1]}`;
    }
  }
  return item;
}

/**
 * Get TV shows listing.
 */
export async function getTvShows(req, res) {
  const { adminView, genreId } = req.query;

  try {
    const db = getDb();
    const tvCollection = db.collection("tvshows");
    let whereClause = { isPublished: true };

    if (adminView === "true" && req.user?.firebaseUid) {
      const user = await db.collection("users").findOne({ firebaseUid: req.user.firebaseUid });
      if (user && user.role === "admin") {
        whereClause = {};
      }
    }

    if (genreId) {
      whereClause.genreIds = parseInt(genreId);
    }

    const tvShows = await tvCollection.find(whereClause).sort({ createdAt: -1 }).toArray();

    // Populate genres relation
    for (let tvShow of tvShows) {
      const genres = await db.collection("genres")
        .find({ id: { $in: tvShow.genreIds || [] } })
        .toArray();
      tvShow.genres = genres;
    }

    return res.status(200).json({ success: true, tvShows });
  } catch (error) {
    console.error("getTvShows Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch TV shows." });
  }
}

/**
 * Get single TV show by ID.
 */
export async function getTvShowById(req, res) {
  const { id } = req.params;

  try {
    const db = getDb();
    const tvCollection = db.collection("tvshows");
    const tvShow = await tvCollection.findOne({ id: parseInt(id) });

    if (!tvShow) {
      return res.status(404).json({ success: false, message: "TV Show not found." });
    }

    // Check permissions if TV show is unpublished
    if (!tvShow.isPublished) {
      let isAuthorized = false;
      if (req.user?.firebaseUid) {
        const user = await db.collection("users").findOne({ firebaseUid: req.user.firebaseUid });
        if (user && user.role === "admin") {
          isAuthorized = true;
        }
      }
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: "Forbidden. Access to unpublished media restricted." });
      }
    }

    const genres = await db.collection("genres")
      .find({ id: { $in: tvShow.genreIds || [] } })
      .toArray();
    tvShow.genres = genres;

    return res.status(200).json({ success: true, tvShow });
  } catch (error) {
    console.error("getTvShowById Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve TV show." });
  }
}

/**
 * Create new TV show.
 */
export async function createTvShow(req, res) {
  const {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    releaseYear,
    language,
    isPublished,
    genreIds,
    tmdbId
  } = req.body;

  if (!title || !description || !releaseYear) {
    return res.status(400).json({ success: false, message: "Title, description, and release year are required." });
  }

  const parsedReleaseYear = parseInt(releaseYear);
  const parsedIsPublished = isPublished === "true" || isPublished === true;
  const parsedTmdbId = tmdbId ? parseInt(tmdbId) : null;

  let parsedGenreIds = [];
  if (genreIds) {
    try {
      if (typeof genreIds === "string") {
        parsedGenreIds = JSON.parse(genreIds);
      } else if (Array.isArray(genreIds)) {
        parsedGenreIds = genreIds;
      }
    } catch (e) {
      parsedGenreIds = String(genreIds).split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }
  }

  try {
    const db = getDb();
    const tvCollection = db.collection("tvshows");
    const newId = await getNextSequenceValue("tvshows");

    const newTvDoc = {
      id: newId,
      title,
      description,
      thumbnailUrl: thumbnailUrl || null,
      backdropUrl: backdropUrl || null,
      releaseYear: parsedReleaseYear,
      language: language || "English",
      isPublished: parsedIsPublished,
      genreIds: parsedGenreIds,
      tmdbId: parsedTmdbId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await tvCollection.insertOne(newTvDoc);

    const genres = await db.collection("genres")
      .find({ id: { $in: newTvDoc.genreIds || [] } })
      .toArray();
    newTvDoc.genres = genres;

    return res.status(201).json({ success: true, tvShow: newTvDoc });
  } catch (error) {
    console.error("createTvShow Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create TV show." });
  }
}

/**
 * Update existing TV show.
 */
export async function updateTvShow(req, res) {
  const { id } = req.params;
  const {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    releaseYear,
    language,
    isPublished,
    genreIds,
    tmdbId
  } = req.body;

  try {
    const db = getDb();
    const tvCollection = db.collection("tvshows");
    const existing = await tvCollection.findOne({ id: parseInt(id) });

    if (!existing) {
      return res.status(404).json({ success: false, message: "TV Show not found." });
    }

    const updateFields = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (thumbnailUrl !== undefined) updateFields.thumbnailUrl = thumbnailUrl;
    if (backdropUrl !== undefined) updateFields.backdropUrl = backdropUrl;
    if (language !== undefined) updateFields.language = language;
    if (releaseYear !== undefined) updateFields.releaseYear = parseInt(releaseYear);
    if (isPublished !== undefined) updateFields.isPublished = isPublished === "true" || isPublished === true;
    if (tmdbId !== undefined) updateFields.tmdbId = tmdbId ? parseInt(tmdbId) : null;

    if (genreIds !== undefined) {
      try {
        if (typeof genreIds === "string") {
          updateFields.genreIds = JSON.parse(genreIds);
        } else if (Array.isArray(genreIds)) {
          updateFields.genreIds = genreIds;
        }
      } catch (e) {
        updateFields.genreIds = String(genreIds).split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      }
    }

    await tvCollection.updateOne({ id: parseInt(id) }, { $set: updateFields });
    const updated = await tvCollection.findOne({ id: parseInt(id) });

    const genres = await db.collection("genres")
      .find({ id: { $in: updated.genreIds || [] } })
      .toArray();
    updated.genres = genres;

    return res.status(200).json({ success: true, tvShow: updated });
  } catch (error) {
    console.error("updateTvShow Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update TV show." });
  }
}

/**
 * Delete TV show.
 */
export async function deleteTvShow(req, res) {
  const { id } = req.params;

  try {
    const db = getDb();
    const tvCollection = db.collection("tvshows");
    const existing = await tvCollection.findOne({ id: parseInt(id) });

    if (!existing) {
      return res.status(404).json({ success: false, message: "TV Show not found." });
    }

    await tvCollection.deleteOne({ id: parseInt(id) });
    // Also clean up all associated episodes in the database
    await db.collection("episodes").deleteMany({ tvShowId: parseInt(id) });

    return res.status(200).json({ success: true, message: "TV Show and all associated episodes deleted successfully." });
  } catch (error) {
    console.error("deleteTvShow Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete TV show." });
  }
}

/**
 * Get Seasons and episode counts for a TV show.
 */
export async function getSeasons(req, res) {
  const { id } = req.params;

  try {
    const db = getDb();
    const tvShowId = parseInt(id);

    // Verify TV show exists and check publish status permissions
    const tvShow = await db.collection("tvshows").findOne({ id: tvShowId });
    if (!tvShow) {
      return res.status(404).json({ success: false, message: "TV Show not found." });
    }

    if (!tvShow.isPublished) {
      let isAuthorized = false;
      if (req.user?.firebaseUid) {
        const user = await db.collection("users").findOne({ firebaseUid: req.user.firebaseUid });
        if (user && user.role === "admin") {
          isAuthorized = true;
        }
      }
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: "Forbidden. Access to unpublished media restricted." });
      }
    }

    const episodes = await db.collection("episodes").find({ tvShowId }).toArray();

    // Group by season number
    const seasonMap = {};
    episodes.forEach(ep => {
      const sNum = ep.seasonNumber || 1;
      if (!seasonMap[sNum]) {
        seasonMap[sNum] = {
          seasonNumber: sNum,
          episodeCount: 0,
          publishedCount: 0
        };
      }
      seasonMap[sNum].episodeCount++;
      if (ep.isPublished) {
        seasonMap[sNum].publishedCount++;
      }
    });

    const seasons = Object.values(seasonMap).sort((a, b) => a.seasonNumber - b.seasonNumber);

    return res.status(200).json({ success: true, seasons });
  } catch (error) {
    console.error("getSeasons Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch seasons info." });
  }
}

/**
 * Get Episodes for a season.
 */
export async function getEpisodes(req, res) {
  const { id, seasonNumber } = req.params;
  const { adminView } = req.query;

  try {
    const db = getDb();
    const tvShowId = parseInt(id);
    const sNum = parseInt(seasonNumber);

    // Verify TV show exists and check publish status permissions
    const tvShow = await db.collection("tvshows").findOne({ id: tvShowId });
    if (!tvShow) {
      return res.status(404).json({ success: false, message: "TV Show not found." });
    }

    if (!tvShow.isPublished) {
      let isAuthorized = false;
      if (req.user?.firebaseUid) {
        const user = await db.collection("users").findOne({ firebaseUid: req.user.firebaseUid });
        if (user && user.role === "admin") {
          isAuthorized = true;
        }
      }
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: "Forbidden. Access to unpublished media restricted." });
      }
    }

    let whereClause = { tvShowId, seasonNumber: sNum, isPublished: true };

    if (adminView === "true" && req.user?.firebaseUid) {
      const user = await db.collection("users").findOne({ firebaseUid: req.user.firebaseUid });
      if (user && user.role === "admin") {
        whereClause = { tvShowId, seasonNumber: sNum };
      }
    }

    const episodes = await db.collection("episodes").find(whereClause).sort({ episodeNumber: 1 }).toArray();

    episodes.forEach(ep => normalizeTvUrls(ep));

    return res.status(200).json({ success: true, episodes });
  } catch (error) {
    console.error("getEpisodes Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch episodes." });
  }
}

/**
 * Get single episode.
 */
export async function getEpisodeById(req, res) {
  const { id, seasonNumber, episodeNumber } = req.params;

  try {
    const db = getDb();
    const tvShowId = parseInt(id);
    const sNum = parseInt(seasonNumber);
    const epNum = parseInt(episodeNumber);

    // Verify TV show exists and check publish status permissions
    const tvShow = await db.collection("tvshows").findOne({ id: tvShowId });
    if (!tvShow) {
      return res.status(404).json({ success: false, message: "TV Show not found." });
    }

    if (!tvShow.isPublished) {
      let isAuthorized = false;
      if (req.user?.firebaseUid) {
        const user = await db.collection("users").findOne({ firebaseUid: req.user.firebaseUid });
        if (user && user.role === "admin") {
          isAuthorized = true;
        }
      }
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: "Forbidden. Access to unpublished media restricted." });
      }
    }

    const episode = await db.collection("episodes").findOne({ tvShowId, seasonNumber: sNum, episodeNumber: epNum });

    if (!episode) {
      return res.status(404).json({ success: false, message: "Episode not found." });
    }

    normalizeTvUrls(episode);

    return res.status(200).json({ success: true, episode });
  } catch (error) {
    console.error("getEpisodeById Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch episode details." });
  }
}

/**
 * Create Episode.
 */
export async function createEpisode(req, res) {
  const { id, seasonNumber } = req.params;
  const {
    title,
    description,
    thumbnailUrl,
    episodeNumber,
    duration,
    releaseDate,
    isPublished,
    videoUrl
  } = req.body;

  if (!title || !episodeNumber) {
    return res.status(400).json({ success: false, message: "Episode title and episode number are required." });
  }

  const tvShowId = parseInt(id);
  const sNum = parseInt(seasonNumber);
  const epNum = parseInt(episodeNumber);
  const parsedDuration = duration ? parseInt(duration) : 45;
  const parsedIsPublished = isPublished === "true" || isPublished === true;

  try {
    const db = getDb();
    const episodeCollection = db.collection("episodes");

    // Check if episode already exists
    const duplicate = await episodeCollection.findOne({ tvShowId, seasonNumber: sNum, episodeNumber: epNum });
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Episode ${epNum} in Season ${sNum} already exists.` });
    }

    const newId = await getNextSequenceValue("episodes");

    const newEpisodeDoc = {
      id: newId,
      tvShowId,
      seasonNumber: sNum,
      episodeNumber: epNum,
      title,
      description: description || "",
      thumbnailUrl: thumbnailUrl || null,
      duration: parsedDuration,
      releaseDate: releaseDate || "",
      isPublished: parsedIsPublished,
      hlsUrl: videoUrl || null,
      sourceVideoPath: videoUrl || null,
      transcodingStatus: req.file ? "UPLOADING" : "READY",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await episodeCollection.insertOne(newEpisodeDoc);
    let episode = newEpisodeDoc;

    if (req.file) {
      try {
        const isR2Configured = process.env.R2_ENDPOINT ? true : false;
        if (isR2Configured) {
          const destinationPath = `tvshows/${tvShowId}/season_${sNum}/episode_${epNum}/video_${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
          const publicUrl = await uploadToR2(req.file.buffer, destinationPath, req.file.mimetype);

          await episodeCollection.updateOne(
            { id: episode.id },
            {
              $set: {
                sourceVideoPath: publicUrl,
                transcodingStatus: "READY",
                hlsUrl: publicUrl
              }
            }
          );
          episode = await episodeCollection.findOne({ id: episode.id });
        } else {
          // Local fallback
          console.warn("WARNING: Cloudflare R2 not configured. Using local file storage fallback.");
          const uploadDir = path.resolve("uploads/tvshows");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const filename = `tv_${tvShowId}_s${sNum}e${epNum}_${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
          const filepath = path.join(uploadDir, filename);
          fs.writeFileSync(filepath, req.file.buffer);

          const localUrl = `http://localhost:5000/uploads/tvshows/${filename}`;

          await episodeCollection.updateOne(
            { id: episode.id },
            {
              $set: {
                sourceVideoPath: filepath,
                transcodingStatus: "READY",
                hlsUrl: localUrl
              }
            }
          );
          episode = await episodeCollection.findOne({ id: episode.id });
        }
      } catch (uploadError) {
        console.error("Episode file upload process failed:", uploadError.message);
        await episodeCollection.updateOne({ id: episode.id }, { $set: { transcodingStatus: "FAILED" } });
        episode = await episodeCollection.findOne({ id: episode.id });
      }
    }

    normalizeTvUrls(episode);

    return res.status(201).json({ success: true, episode });
  } catch (error) {
    console.error("createEpisode Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create episode record." });
  }
}

/**
 * Update Episode.
 */
export async function updateEpisode(req, res) {
  const { id, seasonNumber, episodeId } = req.params;
  const {
    title,
    description,
    thumbnailUrl,
    episodeNumber,
    duration,
    releaseDate,
    isPublished,
    videoUrl
  } = req.body;

  try {
    const db = getDb();
    const episodeCollection = db.collection("episodes");
    const existing = await episodeCollection.findOne({ id: parseInt(episodeId) });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Episode not found." });
    }

    const updateFields = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (thumbnailUrl !== undefined) updateFields.thumbnailUrl = thumbnailUrl;
    if (releaseDate !== undefined) updateFields.releaseDate = releaseDate;
    if (duration !== undefined) updateFields.duration = parseInt(duration);
    if (episodeNumber !== undefined) updateFields.episodeNumber = parseInt(episodeNumber);
    if (isPublished !== undefined) updateFields.isPublished = isPublished === "true" || isPublished === true;
    if (videoUrl !== undefined) {
      updateFields.videoUrl = videoUrl;
      updateFields.hlsUrl = videoUrl;
      updateFields.sourceVideoPath = videoUrl;
      updateFields.transcodingStatus = "READY";
    }

    if (req.file) {
      updateFields.transcodingStatus = "UPLOADING";
      await episodeCollection.updateOne({ id: existing.id }, { $set: updateFields });

      try {
        const isR2Configured = process.env.R2_ENDPOINT ? true : false;
        if (isR2Configured) {
          const destinationPath = `tvshows/${existing.tvShowId}/season_${existing.seasonNumber}/episode_${existing.episodeNumber}/video_${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
          const publicUrl = await uploadToR2(req.file.buffer, destinationPath, req.file.mimetype);

          updateFields.sourceVideoPath = publicUrl;
          updateFields.transcodingStatus = "READY";
          updateFields.hlsUrl = publicUrl;
        } else {
          // Local fallback
          const uploadDir = path.resolve("uploads/tvshows");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const filename = `tv_${existing.tvShowId}_s${existing.seasonNumber}e${existing.episodeNumber}_${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
          const filepath = path.join(uploadDir, filename);
          fs.writeFileSync(filepath, req.file.buffer);

          const localUrl = `http://localhost:5000/uploads/tvshows/${filename}`;

          updateFields.sourceVideoPath = filepath;
          updateFields.transcodingStatus = "READY";
          updateFields.hlsUrl = localUrl;
        }
      } catch (uploadError) {
        console.error("Episode file update failed:", uploadError.message);
        updateFields.transcodingStatus = "FAILED";
      }
    }

    await episodeCollection.updateOne({ id: existing.id }, { $set: updateFields });
    const updated = await episodeCollection.findOne({ id: existing.id });

    normalizeTvUrls(updated);

    return res.status(200).json({ success: true, episode: updated });
  } catch (error) {
    console.error("updateEpisode Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update episode." });
  }
}

/**
 * Delete Episode.
 */
export async function deleteEpisode(req, res) {
  const { episodeId } = req.params;

  try {
    const db = getDb();
    const episodeCollection = db.collection("episodes");
    const existing = await episodeCollection.findOne({ id: parseInt(episodeId) });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Episode not found." });
    }

    await episodeCollection.deleteOne({ id: parseInt(episodeId) });

    return res.status(200).json({ success: true, message: "Episode deleted successfully." });
  } catch (error) {
    console.error("deleteEpisode Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete episode." });
  }
}

export async function getTvShowPresignedUploadUrl(req, res) {
  if (!isR2Configured) {
    return res.status(400).json({
      success: false,
      message: "Cloudflare R2 is not configured in the environment."
    });
  }

  const { filename, contentType } = req.body;
  if (!filename || !contentType) {
    return res.status(400).json({
      success: false,
      message: "Filename and contentType are required fields."
    });
  }

  try {
    const cleanFilename = filename.replace(/\s+/g, "_");
    const destinationPath = `tvshows/uploads/video_${Date.now()}_${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketNameExport,
      Key: destinationPath,
      ContentType: contentType
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    let publicUrl;
    if (process.env.R2_PUBLIC_URL_PREFIX) {
      const prefix = process.env.R2_PUBLIC_URL_PREFIX.replace(/\/$/, "");
      publicUrl = `${prefix}/${destinationPath}`;
    } else {
      publicUrl = `${process.env.R2_ENDPOINT}/${bucketNameExport}/${destinationPath}`;
    }

    return res.status(200).json({
      success: true,
      uploadUrl: presignedUrl,
      videoUrl: publicUrl
    });
  } catch (error) {
    console.error("Failed to generate presigned R2 upload URL for TV show:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate presigned upload URL."
    });
  }
}
