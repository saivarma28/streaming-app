import fs from "fs";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TvShowModel } from "../models/TvShow.js";
import { UserModel } from "../models/User.js";
import { uploadToR2, s3, isR2Configured, bucketNameExport } from "./cloudflareR2.js";

/**
 * Service managing TV show metadata, seasons, episodes, and direct uploads
 */
export class TvShowService {
  static async getTvShows({ adminView, genreId, firebaseUid }) {
    let whereClause = { isPublished: true };

    if (adminView === "true" && firebaseUid) {
      const user = await UserModel.findByFirebaseUid(firebaseUid);
      if (user && user.role === "admin") {
        whereClause = {};
      }
    }

    if (genreId) {
      whereClause.genreIds = parseInt(genreId);
    }

    return TvShowModel.find(whereClause);
  }

  static async getTvShowById(id, firebaseUid) {
    const tvShow = await TvShowModel.findById(id);
    if (!tvShow) {
      const err = new Error("TV Show not found.");
      err.status = 404;
      throw err;
    }

    if (!tvShow.isPublished) {
      let isAuthorized = false;
      if (firebaseUid) {
        const user = await UserModel.findByFirebaseUid(firebaseUid);
        if (user && user.role === "admin") {
          isAuthorized = true;
        }
      }
      if (!isAuthorized) {
        const err = new Error("Forbidden. Access to unpublished media restricted.");
        err.status = 403;
        throw err;
      }
    }

    if (tvShow.isPremium) {
      let isPremiumAuthorized = false;
      if (firebaseUid) {
        const user = await UserModel.findByFirebaseUid(firebaseUid);
        if (user) {
          const expiry = user.premiumExpiryDate || user.subscriptionExpiryDate;
          if (user.role === "admin" || (user.isPremium === true && expiry && new Date(expiry) > new Date())) {
            isPremiumAuthorized = true;
          }
        }
      }
      if (!isPremiumAuthorized) {
        const err = new Error("Premium subscription required");
        err.status = 403;
        throw err;
      }
    }

    return tvShow;
  }

  static async createTvShow(tvShowData) {
    return TvShowModel.create(tvShowData);
  }

  static async updateTvShow(id, updateData) {
    const existing = await TvShowModel.findById(id);
    if (!existing) {
      const err = new Error("TV Show not found.");
      err.status = 404;
      throw err;
    }
    return TvShowModel.updateById(id, updateData);
  }

  static async deleteTvShow(id) {
    const existing = await TvShowModel.findById(id);
    if (!existing) {
      const err = new Error("TV Show not found.");
      err.status = 404;
      throw err;
    }
    return TvShowModel.deleteById(id);
  }

  static async generatePresignedUploadUrl(filename, contentType) {
    if (!isR2Configured) {
      throw new Error("Cloudflare R2 is not configured in the environment.");
    }

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

    return {
      uploadUrl: presignedUrl,
      videoUrl: publicUrl
    };
  }

  static async getSeasons(tvShowId) {
    return TvShowModel.getSeasons(tvShowId);
  }

  static async getEpisodes(tvShowId, seasonNumber, { adminView, firebaseUid }) {
    let filter = { isPublished: true };

    if (adminView === "true" && firebaseUid) {
      const user = await UserModel.findByFirebaseUid(firebaseUid);
      if (user && user.role === "admin") {
        filter = {};
      }
    }

    return TvShowModel.getEpisodes(tvShowId, seasonNumber, filter);
  }

  static async getEpisodeByNumber(tvShowId, seasonNumber, episodeNumber, firebaseUid) {
    const episode = await TvShowModel.getEpisodeByNumber(tvShowId, seasonNumber, episodeNumber);
    if (!episode) {
      const err = new Error("Episode not found.");
      err.status = 404;
      throw err;
    }

    if (!episode.isPublished) {
      let isAuthorized = false;
      if (firebaseUid) {
        const user = await UserModel.findByFirebaseUid(firebaseUid);
        if (user && user.role === "admin") {
          isAuthorized = true;
        }
      }
      if (!isAuthorized) {
        const err = new Error("Forbidden. Access to unpublished episode restricted.");
        err.status = 403;
        throw err;
      }
    }

    return episode;
  }

  static async createEpisode(tvShowId, seasonNumber, episodeData, file) {
    let episode = await TvShowModel.createEpisode({
      ...episodeData,
      tvShowId,
      seasonNumber,
      transcodingStatus: file ? "UPLOADING" : "READY"
    });

    if (file) {
      try {
        const isR2Config = process.env.R2_ENDPOINT ? true : false;
        if (isR2Config) {
          const destinationPath = `tvshows/${tvShowId}/s${seasonNumber}/e${episode.episodeNumber}/video_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
          const publicUrl = await uploadToR2(file.buffer, destinationPath, file.mimetype);

          episode = await TvShowModel.updateEpisode(episode.id, {
            sourceVideoPath: publicUrl,
            transcodingStatus: "READY",
            hlsUrl: publicUrl
          });
        } else {
          const uploadDir = path.resolve(`uploads/tvshows/${tvShowId}/s${seasonNumber}`);
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const filename = `ep_${episode.id}_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
          const filepath = path.join(uploadDir, filename);
          fs.writeFileSync(filepath, file.buffer);

          const localUrl = `http://localhost:5000/uploads/tvshows/${tvShowId}/s${seasonNumber}/${filename}`;
          episode = await TvShowModel.updateEpisode(episode.id, {
            sourceVideoPath: filepath,
            transcodingStatus: "READY",
            hlsUrl: localUrl
          });
        }
      } catch (uploadError) {
        console.error("Episode file upload failed:", uploadError.message);
        await TvShowModel.updateEpisode(episode.id, { transcodingStatus: "FAILED" });
        throw uploadError;
      }
    }

    return episode;
  }

  static async updateEpisode(tvShowId, seasonNumber, episodeId, updateData, file) {
    const existing = await TvShowModel.getEpisodeById(episodeId);
    if (!existing) {
      const err = new Error("Episode not found.");
      err.status = 404;
      throw err;
    }

    let uploadResult = {};
    if (file) {
      await TvShowModel.updateEpisode(existing.id, { transcodingStatus: "UPLOADING" });

      const isR2Config = process.env.R2_ENDPOINT ? true : false;
      if (isR2Config) {
        const destinationPath = `tvshows/${tvShowId}/s${seasonNumber}/e${existing.episodeNumber}/video_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
        const publicUrl = await uploadToR2(file.buffer, destinationPath, file.mimetype);

        uploadResult = {
          sourceVideoPath: publicUrl,
          transcodingStatus: "READY",
          hlsUrl: publicUrl
        };
      } else {
        const uploadDir = path.resolve(`uploads/tvshows/${tvShowId}/s${seasonNumber}`);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `ep_${existing.id}_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);

        const localUrl = `http://localhost:5000/uploads/tvshows/${tvShowId}/s${seasonNumber}/${filename}`;
        uploadResult = {
          sourceVideoPath: filepath,
          transcodingStatus: "READY",
          hlsUrl: localUrl
        };
      }
    }

    const mergedUpdates = { ...updateData, ...uploadResult };
    return TvShowModel.updateEpisode(episodeId, mergedUpdates);
  }

  static async deleteEpisode(episodeId) {
    const existing = await TvShowModel.getEpisodeById(episodeId);
    if (!existing) {
      const err = new Error("Episode not found.");
      err.status = 404;
      throw err;
    }
    return TvShowModel.deleteEpisode(episodeId);
  }
}
