import { cachedFetch as fetch, BACKEND_URL } from "./apiClient";

/**
 * Fetch all genres.
 * GET /api/genres
 */
export async function getGenres(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/genres`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch genres.");
    }
    return data;
  } catch (error) {
    console.error("getGenres API Error:", error.message);
    throw error;
  }
}

/**
 * Create a new genre. (Admin only)
 * POST /api/genres
 */
export async function createGenre(token, name) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/genres`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to create genre.");
    }
    return data;
  } catch (error) {
    console.error("createGenre API Error:", error.message);
    throw error;
  }
}

/**
 * Update an existing genre's name. (Admin only)
 * PUT /api/genres/:id
 */
export async function updateGenre(token, id, name) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/genres/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update genre.");
    }
    return data;
  } catch (error) {
    console.error("updateGenre API Error:", error.message);
    throw error;
  }
}

/**
 * Delete a genre. (Admin only)
 * DELETE /api/genres/:id
 */
export async function deleteGenre(token, id) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/genres/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete genre.");
    }
    return data;
  } catch (error) {
    console.error("deleteGenre API Error:", error.message);
    throw error;
  }
}
