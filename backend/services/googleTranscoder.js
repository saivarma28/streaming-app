import { TranscoderServiceClient } from "@google-cloud/video-transcoder";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

const clientOptions = {};
if (projectId) {
  clientOptions.projectId = projectId;
}
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  clientOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const client = new TranscoderServiceClient(clientOptions);

/**
 * Creates a transcoding job to convert input video to HLS format.
 * 
 * @param {string} inputUri - GCS input video URI (gs://bucket/path/video.mp4)
 * @param {string} outputUri - GCS output folder URI (gs://bucket/folder/)
 * @returns {Promise<{jobName: string, state: string}>}
 */
export async function createTranscodingJob(inputUri, outputUri) {
  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID environment variable is not defined.");
  }
  const parent = client.locationPath(projectId, location);

  const request = {
    parent,
    job: {
      inputUri,
      outputUri,
      config: {
        elementaryStreams: [
          {
            key: "video-720p",
            videoStream: {
              h264: {
                heightPixels: 720,
                widthPixels: 1280,
                bitrateBps: 2500000,
                frameRate: 30,
              },
            },
          },
          {
            key: "audio-aac",
            audioStream: {
              codec: "aac",
              bitrateBps: 128000,
            },
          },
        ],
        muxStreams: [
          {
            key: "hls-720p",
            container: "ts",
            elementaryStreams: ["video-720p", "audio-aac"],
          },
        ],
        manifests: [
          {
            fileName: "master.m3u8",
            type: "HLS",
            muxStreams: ["hls-720p"],
          },
        ],
      },
    },
  };

  try {
    const [response] = await client.createJob(request);
    return {
      jobName: response.name, // Format: projects/PROJECT_ID/locations/LOCATION/jobs/JOB_ID
      state: response.state,
    };
  } catch (error) {
    console.error("Transcoder Service Create Job Failure:", error.message);
    throw error;
  }
}

/**
 * Gets the status of an active transcoding job.
 * 
 * @param {string} jobName - projects/PROJECT_ID/locations/LOCATION/jobs/JOB_ID
 * @returns {Promise<{state: string, error: object}>}
 */
export async function getTranscodingJobStatus(jobName) {
  try {
    const [job] = await client.getJob({ name: jobName });
    return {
      state: job.state, // PENDING, RUNNING, SUCCEEDED, FAILED
      error: job.error || null,
    };
  } catch (error) {
    console.error("Transcoder Service Get Job Failure:", error.message);
    throw error;
  }
}
