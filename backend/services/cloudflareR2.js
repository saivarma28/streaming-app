import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
export const isR2Configured = endpoint && accessKeyId && secretAccessKey && bucketName;
export const bucketNameExport = bucketName;

export let s3 = null;
if (isR2Configured) {
  s3 = new S3Client({
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    region: "auto",
  });
} else {
  console.warn("WARNING: Cloudflare R2 is not fully configured in environment variables.");
}
/**
 * Uploads a file buffer to Cloudflare R2.
 * 
 * @param {Buffer} fileBuffer - File binary content
 * @param {string} destinationPath - Path within the bucket
 * @param {string} mimeType - File mimetype (e.g. video/mp4)
 * @returns {Promise<string>} - The public or endpoint-based URL of the uploaded file
 */
export async function uploadToR2(fileBuffer, destinationPath, mimeType) {
  if (!isR2Configured) {
    throw new Error("Cloudflare R2 is not configured. Please set R2 environment variables.");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: destinationPath,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  // If a public URL prefix is configured, use it (e.g. https://pub-xxx.r2.dev or custom domain)
  if (process.env.R2_PUBLIC_URL_PREFIX) {
    const prefix = process.env.R2_PUBLIC_URL_PREFIX.replace(/\/$/, "");
    return `${prefix}/${destinationPath}`;
  }

  // Fallback: format standard R2 URL structure
  return `${endpoint}/${bucketName}/${destinationPath}`;
}
