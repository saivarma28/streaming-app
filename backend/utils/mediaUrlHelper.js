import dotenv from "dotenv";
dotenv.config();

/**
 * Normalizes private or internal Cloudflare R2 bucket URLs to the configured public URL prefix.
 * 
 * @param {object} item - Movie or Episode object containing hlsUrl / videoUrl
 * @returns {object} - The item with normalized public media URLs
 */
export function normalizeMediaUrl(item) {
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

// Backward compatibility alias for movieController & tvShowController
export const normalizeMovieUrls = normalizeMediaUrl;
export const normalizeTvUrls = normalizeMediaUrl;
