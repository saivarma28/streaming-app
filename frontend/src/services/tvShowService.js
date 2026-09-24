import { cachedFetch as fetch, BACKEND_URL } from "./apiClient";

/**
 * Fetch TV shows catalog.
 * GET /api/tvshows
 */
export async function getTvShows(token, genreId = null, adminView = false) {
  try {
    let url = `${BACKEND_URL}/api/tvshows?adminView=${adminView}`;
    if (genreId) url += `&genreId=${genreId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch TV shows.");
    return data;
  } catch (error) {
    console.error("getTvShows API Error:", error.message);
    throw error;
  }
}

/**
 * Fetch single TV show details by ID.
 * GET /api/tvshows/:id
 */
export async function getTvShowById(token, id) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/${id}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || "Failed to fetch TV show details.");
      error.status = response.status;
      error.code = data.code || null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error("getTvShowById API Error:", error.message);
    throw error;
  }
}

/**
 * Create a new TV show. (Admin only)
 * POST /api/tvshows
 */
export async function createTvShow(token, tvShowData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(tvShowData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create TV show.");
    return data;
  } catch (error) {
    console.error("createTvShow API Error:", error.message);
    throw error;
  }
}

/**
 * Update an existing TV show. (Admin only)
 * PUT /api/tvshows/:id
 */
export async function updateTvShow(token, id, tvShowData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(tvShowData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update TV show.");
    return data;
  } catch (error) {
    console.error("updateTvShow API Error:", error.message);
    throw error;
  }
}

/**
 * Delete a TV show. (Admin only)
 * DELETE /api/tvshows/:id
 */
export async function deleteTvShow(token, id) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete TV show.");
    return data;
  } catch (error) {
    console.error("deleteTvShow API Error:", error.message);
    throw error;
  }
}

/**
 * Request a presigned S3/R2 PUT URL for direct TV Show episode uploads.
 * POST /api/tvshows/presigned-url
 */
export async function getTvShowPresignedUrl(token, filename, contentType) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ filename, contentType })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to generate presigned upload URL.");
    }
    return data;
  } catch (error) {
    console.error("getTvShowPresignedUrl API Error:", error.message);
    throw error;
  }
}

/**
 * Fetch all seasons for a TV Show.
 * GET /api/tvshows/:tvShowId/seasons
 */
export async function getSeasons(token, tvShowId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/${tvShowId}/seasons`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || "Failed to fetch seasons.");
      error.status = response.status;
      error.code = data.code || null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error("getSeasons API Error:", error.message);
    throw error;
  }
}

/**
 * Fetch episodes for a season.
 * GET /api/tvshows/:tvShowId/seasons/:seasonNumber/episodes
 */
export async function getEpisodes(token, tvShowId, seasonNumber, adminView = false) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/${tvShowId}/seasons/${seasonNumber}/episodes?adminView=${adminView}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || "Failed to fetch episodes.");
      error.status = response.status;
      error.code = data.code || null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error("getEpisodes API Error:", error.message);
    throw error;
  }
}

/**
 * Fetch a single episode by season & episode number.
 * GET /api/tvshows/:tvShowId/seasons/:seasonNumber/episodes/:episodeNumber
 */
export async function getEpisodeById(token, tvShowId, seasonNumber, episodeNumber) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/${tvShowId}/seasons/${seasonNumber}/episodes/${episodeNumber}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch episode details.");
    return data;
  } catch (error) {
    console.error("getEpisodeById API Error:", error.message);
    throw error;
  }
}

/**
 * Create a new episode. (Admin only)
 * POST /api/tvshows/:tvShowId/seasons/:seasonNumber/episodes
 */
export async function createEpisode(token, tvShowId, seasonNumber, formData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/${tvShowId}/seasons/${seasonNumber}/episodes`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create episode.");
    return data;
  } catch (error) {
    console.error("createEpisode API Error:", error.message);
    throw error;
  }
}

/**
 * Update an existing episode. (Admin only)
 * PUT /api/tvshows/:tvShowId/seasons/:seasonNumber/episodes/:episodeId
 */
export async function updateEpisode(token, tvShowId, seasonNumber, episodeId, formData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/${tvShowId}/seasons/${seasonNumber}/episodes/${episodeId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update episode.");
    return data;
  } catch (error) {
    console.error("updateEpisode API Error:", error.message);
    throw error;
  }
}

/**
 * Delete an episode. (Admin only)
 * DELETE /api/tvshows/:tvShowId/seasons/:seasonNumber/episodes/:episodeId
 */
export async function deleteEpisode(token, tvShowId, seasonNumber, episodeId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tvshows/${tvShowId}/seasons/${seasonNumber}/episodes/${episodeId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete episode.");
    return data;
  } catch (error) {
    console.error("deleteEpisode API Error:", error.message);
    throw error;
  }
}
