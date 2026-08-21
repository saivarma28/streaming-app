import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;

const storageOptions = {};
if (projectId) {
  storageOptions.projectId = projectId;
}
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  storageOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const storage = new Storage(storageOptions);

/**
 * Uploads a file buffer to Google Cloud Storage bucket.
 * 
 * @param {Buffer} fileBuffer - Video file binary content
 * @param {string} destinationPath - Path within the bucket
 * @param {string} mimeType - Video mimetype (e.g. video/mp4)
 * @returns {Promise<string>} - The GCS URI (gs://bucket/path)
 */
export async function uploadToGCS(fileBuffer, destinationPath, mimeType) {
  if (!bucketName) {
    throw new Error("GOOGLE_CLOUD_BUCKET_NAME environment variable is not defined.");
  }
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(destinationPath);

  await file.save(fileBuffer, {
    metadata: { contentType: mimeType },
    resumable: false,
  });

  return `gs://${bucketName}/${destinationPath}`;
}
