import dotenv from "dotenv";

dotenv.config();

/**
 * Secures communication with Cloudflare Stream API to upload video content.
 * Throws a clear configuration error if the required environment credentials are missing.
 * 
 * @param {Buffer} fileBuffer - File contents in binary buffer
 * @param {string} originalName - Original video filename
 * @param {string} mimeType - Video mimetype (e.g. video/mp4)
 * @returns {Promise<{success: boolean, videoStreamId: string, previewUrl: string}>}
 */
export async function uploadToCloudflareStream(fileBuffer, originalName, mimeType) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;

  if (!accountId || !apiToken || accountId.trim() === "" || apiToken.trim() === "") {
    throw new Error(
      "Cloudflare configuration error: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN must be configured in your backend/.env file."
    );
  }

  // Create a Blob from buffer to transmit via FormData
  const fileBlob = new Blob([fileBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append("file", fileBlob, originalName);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`
        },
        body: formData
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      const detail = responseData.errors?.[0]?.message || "Cloudflare API request failed.";
      throw new Error(`Cloudflare API Error: ${detail}`);
    }

    return {
      success: true,
      videoStreamId: responseData.result.uid,
      previewUrl: responseData.result.preview,
      playbackUrl: responseData.result.playback?.hls || null
    };
  } catch (error) {
    console.error("Cloudflare Stream Service Request Failure:", error.message);
    throw error;
  }
}
