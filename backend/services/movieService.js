import fs from "fs";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MovieModel } from "../models/Movie.js";
import { UserModel } from "../models/User.js";
import { uploadToR2, s3, isR2Configured, bucketNameExport } from "./cloudflareR2.js";
import { uploadToGCS } from "./googleCloudStorage.js";
import { createTranscodingJob, getTranscodingJobStatus } from "./googleTranscoder.js";

/**
 * Service managing movies catalog, direct and backend uploads, and transcoding status
 */
export class MovieService {
  /**
   * Retrieves list of movies with permission and genre filtering.
   */
  static async getMovies({ adminView, genreId, firebaseUid }) {
    let whereClause = { isPublished: true };

    if (adminView === "true" && firebaseUid) {
      const user = await UserModel.findByFirebaseUid(firebaseUid);
      if (user && user.role === "admin") {
        whereClause = {}; // Admins see both published and unpublished
      }
    }

    if (genreId) {
      whereClause.genreIds = parseInt(genreId);
    }

    return MovieModel.find(whereClause);
  }

  /**
   * Retrieves a single movie by ID with authorization and premium check.
   */
  static async getMovieById(id, firebaseUid) {
    const movie = await MovieModel.findById(id);
    if (!movie) {
      const err = new Error("Movie not found.");
      err.status = 404;
      throw err;
    }

    // Check permissions if movie is unpublished
    if (!movie.isPublished) {
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

    // Check Premium Access restriction
    if (movie.isPremium) {
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

    return movie;
  }

  /**
   * Generates a presigned PUT URL for direct R2 uploads.
   */
  static async generatePresignedUploadUrl(filename, contentType) {
    if (!isR2Configured) {
      throw new Error("Cloudflare R2 is not configured in the environment.");
    }

    const cleanFilename = filename.replace(/\s+/g, "_");
    const destinationPath = `movies/uploads/video_${Date.now()}_${cleanFilename}`;

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

  /**
   * Creates a new movie record and handles optional file upload (R2, GCS, or Local).
   */
  static async createMovie(movieData, file) {
    let movie = await MovieModel.create({
      ...movieData,
      transcodingStatus: file ? "UPLOADING" : "READY"
    });

    if (file) {
      try {
        const isR2Config = process.env.R2_ENDPOINT ? true : false;
        const isGcpConfig = process.env.GOOGLE_CLOUD_BUCKET_NAME ? true : false;

        if (isR2Config) {
          const destinationPath = `movies/${movie.id}/video_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
          const publicUrl = await uploadToR2(file.buffer, destinationPath, file.mimetype);

          movie = await MovieModel.updateById(movie.id, {
            sourceVideoPath: publicUrl,
            transcodingStatus: "READY",
            hlsUrl: publicUrl
          });
        } else if (isGcpConfig) {
          const destinationPath = `movies/${movie.id}/source_${Date.now()}_${file.originalname}`;
          const inputUri = await uploadToGCS(file.buffer, destinationPath, file.mimetype);

          const outputFolder = `movies/${movie.id}/transcoded/`;
          const outputUri = `gs://${process.env.GOOGLE_CLOUD_OUTPUT_BUCKET_NAME}/${outputFolder}`;

          const jobInfo = await createTranscodingJob(inputUri, outputUri);
          const hlsUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_OUTPUT_BUCKET_NAME}/${outputFolder}master.m3u8`;

          movie = await MovieModel.updateById(movie.id, {
            sourceVideoPath: inputUri,
            transcoderJobName: jobInfo.jobName,
            transcodingStatus: "PROCESSING",
            hlsUrl: hlsUrl
          });
        } else {
          // Local fallback
          const uploadDir = path.resolve("uploads/movies");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const filename = `movie_${movie.id}_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
          const filepath = path.join(uploadDir, filename);
          fs.writeFileSync(filepath, file.buffer);

          const localUrl = `http://localhost:5000/uploads/movies/${filename}`;

          movie = await MovieModel.updateById(movie.id, {
            sourceVideoPath: filepath,
            transcodingStatus: "READY",
            hlsUrl: localUrl
          });
        }
      } catch (uploadError) {
        console.error("Movie file upload/transcode failed:", uploadError.message);
        await MovieModel.updateById(movie.id, { transcodingStatus: "FAILED" });
        throw uploadError;
      }
    }

    return movie;
  }

  /**
   * Updates an existing movie and handles optional video replacement.
   */
  static async updateMovie(id, updateData, file) {
    const existingMovie = await MovieModel.findById(id);
    if (!existingMovie) {
      const err = new Error("Movie not found.");
      err.status = 404;
      throw err;
    }

    let uploadResult = {};
    if (file) {
      await MovieModel.updateById(existingMovie.id, { transcodingStatus: "UPLOADING" });

      const isR2Config = process.env.R2_ENDPOINT ? true : false;
      const isGcpConfig = process.env.GOOGLE_CLOUD_BUCKET_NAME ? true : false;

      if (isR2Config) {
        const destinationPath = `movies/${existingMovie.id}/video_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
        const publicUrl = await uploadToR2(file.buffer, destinationPath, file.mimetype);

        uploadResult = {
          sourceVideoPath: publicUrl,
          transcodingStatus: "READY",
          hlsUrl: publicUrl
        };
      } else if (isGcpConfig) {
        const destinationPath = `movies/${existingMovie.id}/source_${Date.now()}_${file.originalname}`;
        const inputUri = await uploadToGCS(file.buffer, destinationPath, file.mimetype);

        const outputFolder = `movies/${existingMovie.id}/transcoded/`;
        const outputUri = `gs://${process.env.GOOGLE_CLOUD_OUTPUT_BUCKET_NAME}/${outputFolder}`;

        const jobInfo = await createTranscodingJob(inputUri, outputUri);
        const hlsUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_OUTPUT_BUCKET_NAME}/${outputFolder}master.m3u8`;

        uploadResult = {
          sourceVideoPath: inputUri,
          transcoderJobName: jobInfo.jobName,
          transcodingStatus: "PROCESSING",
          hlsUrl: hlsUrl
        };
      } else {
        const uploadDir = path.resolve("uploads/movies");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `movie_${existingMovie.id}_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);

        const localUrl = `http://localhost:5000/uploads/movies/${filename}`;

        uploadResult = {
          sourceVideoPath: filepath,
          transcodingStatus: "READY",
          hlsUrl: localUrl
        };
      }
    }

    const mergedUpdates = { ...updateData, ...uploadResult };
    return MovieModel.updateById(id, mergedUpdates);
  }

  /**
   * Deletes a movie and associated relations.
   */
  static async deleteMovie(id) {
    const existing = await MovieModel.findById(id);
    if (!existing) {
      const err = new Error("Movie not found.");
      err.status = 404;
      throw err;
    }
    return MovieModel.deleteById(id);
  }

  /**
   * Checks GCP transcoding status for processing movies.
   */
  static async getTranscodingStatus(id) {
    const movie = await MovieModel.findById(id);
    if (!movie) {
      const err = new Error("Movie not found.");
      err.status = 404;
      throw err;
    }

    if (movie.transcodingStatus === "PROCESSING" && movie.transcoderJobName) {
      try {
        const jobStatus = await getTranscodingJobStatus(movie.transcoderJobName);
        let newStatus = movie.transcodingStatus;

        if (jobStatus.state === "SUCCEEDED") {
          newStatus = "READY";
        } else if (jobStatus.state === "FAILED") {
          newStatus = "FAILED";
        }

        if (newStatus !== movie.transcodingStatus) {
          await MovieModel.updateById(id, { transcodingStatus: newStatus });
          movie.transcodingStatus = newStatus;
        }
      } catch (err) {
        console.warn("Failed to check Google Transcoding job status:", err.message);
      }
    }

    return movie.transcodingStatus;
  }
}
