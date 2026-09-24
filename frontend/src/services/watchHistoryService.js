import { cachedFetch as fetch, BACKEND_URL } from "./apiClient";

/**
 * Fetch watch history list for logged-in user.
 * GET /api/watch-history
 */
export async function getWatchHistory(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/watch-history`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch watch history.");
    }
    return data;
  } catch (error) {
    console.error("getWatchHistory API Error:", error.message);
    throw error;
  }
}

/**
 * Save or create watch progress.
 * POST /api/watch-history
 */
export async function saveWatchHistory(token, movieId, progress, completed = false) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/watch-history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ movieId, progress, completed })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to save watch progress.");
    }
    return data;
  } catch (error) {
    console.error("saveWatchHistory API Error:", error.message);
    throw error;
  }
}

/**
 * Update watch progress for a specific movie.
 * PUT /api/watch-history/:movieId
 */
export async function updateWatchHistory(token, movieId, progress, completed = false) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/watch-history/${movieId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ progress, completed })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update watch progress.");
    }
    return data;
  } catch (error) {
    console.error("updateWatchHistory API Error:", error.message);
    throw error;
  }
}

/**
 * Retrieve system-wide watch histories. (Admin only)
 * GET /api/watch-history/all
 */
export async function getAllWatchHistories(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/watch-history/all`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to retrieve watch histories.");
    }
    return data;
  } catch (error) {
    console.error("getAllWatchHistories API Error:", error.message);
    throw error;
  }
}
