import { cachedFetch as fetch, BACKEND_URL } from "./apiClient";

/**
 * Fetch movies list.
 * GET /api/movies
 * 
 * @param {string} token 
 * @param {string|number|null} [genreId=null] 
 * @param {boolean} [adminView=false] 
 * @returns {Promise<{success: boolean, movies: Array}>}
 */
export async function getMovies(token, genreId = null, adminView = false) {
  try {
    let url = `${BACKEND_URL}/api/movies?adminView=${adminView}`;
    if (genreId) {
      url += `&genreId=${genreId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch movies.");
    }
    return data;
  } catch (error) {
    console.error("getMovies API Error:", error.message);
    throw error;
  }
}

/**
 * Fetch a single movie by ID.
 * GET /api/movies/:id
 * 
 * @param {string} token 
 * @param {string|number} id 
 * @returns {Promise<{success: boolean, movie: object}>}
 */
export async function getMovieById(token, id) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/movies/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || "Failed to fetch movie details.");
      error.status = response.status;
      error.code = data.code || null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error("getMovieById API Error:", error.message);
    throw error;
  }
}

/**
 * Request a presigned S3/R2 PUT URL for direct large video uploads.
 * POST /api/movies/presigned-url
 * 
 * @param {string} token 
 * @param {string} filename 
 * @param {string} contentType 
 * @returns {Promise<{success: boolean, uploadUrl: string, videoUrl: string}>}
 */
export async function getMoviePresignedUrl(token, filename, contentType) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/movies/presigned-url`, {
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
    console.error("getMoviePresignedUrl API Error:", error.message);
    throw error;
  }
}

/**
 * Create a new movie. (Admin only)
 * POST /api/movies
 * 
 * @param {string} token 
 * @param {FormData} formData 
 * @returns {Promise<{success: boolean, movie: object}>}
 */
export async function createMovie(token, formData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/movies`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to create movie.");
    }
    return data;
  } catch (error) {
    console.error("createMovie API Error:", error.message);
    throw error;
  }
}

/**
 * Update an existing movie. (Admin only)
 * PUT /api/movies/:id
 * 
 * @param {string} token 
 * @param {number|string} id 
 * @param {FormData} formData 
 * @returns {Promise<{success: boolean, movie: object}>}
 */
export async function updateMovie(token, id, formData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/movies/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update movie.");
    }
    return data;
  } catch (error) {
    console.error("updateMovie API Error:", error.message);
    throw error;
  }
}

/**
 * Delete a movie. (Admin only)
 * DELETE /api/movies/:id
 * 
 * @param {string} token 
 * @param {number|string} id 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteMovie(token, id) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/movies/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete movie.");
    }
    return data;
  } catch (error) {
    console.error("deleteMovie API Error:", error.message);
    throw error;
  }
}
