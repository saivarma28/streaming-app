// API Service to communicate with the Node.js/Express Backend
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// API Cache system
const apiCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache TTL

export function clearApiCache() {
  apiCache.clear();
  console.log("[Cache] Cleared API cache.");
}

async function cachedFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // Only cache GET requests
  if (method !== "GET") {
    // Clear cache on mutating operations (POST, PUT, DELETE)
    clearApiCache();
    return window.fetch(url, options);
  }

  const cacheKey = url;
  const now = Date.now();

  if (apiCache.has(cacheKey)) {
    const entry = apiCache.get(cacheKey);
    if (now - entry.timestamp < CACHE_TTL) {
      console.log(`[Cache Hit] returning cached response for: ${url}`);
      return entry.response.clone();
    } else {
      apiCache.delete(cacheKey);
    }
  }

  const response = await window.fetch(url, options);
  if (response.ok) {
    apiCache.set(cacheKey, {
      response: response.clone(),
      timestamp: now
    });
  }

  return response;
}

// Override global fetch in this module scope
const fetch = cachedFetch;


/**
 * Request a real 6-digit OTP code to be sent to the user's email address.
 * Hits POST /api/auth/send-email-otp
 * 
 * @param {string} email 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendEmailOtp(email) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/send-email-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to send email OTP code.");
    }
    return data;
  } catch (error) {
    console.error("sendEmailOtp API Error:", error.message);
    throw error;
  }
}

/**
 * Verify the 6-digit OTP code entered by the user.
 * Hits POST /api/auth/verify-email-otp
 * 
 * @param {string} email 
 * @param {string} otp 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyEmailOtp(email, otp) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-email-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, otp })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Invalid OTP code.");
    }
    return data;
  } catch (error) {
    console.error("verifyEmailOtp API Error:", error.message);
    throw error;
  }
}

/**
 * Check if a phone number is already registered in MongoDB.
 * Hits GET /api/auth/check-phone?phoneNumber=+91XXXXXXXXXX
 * 
 * @param {string} phoneNumber 
 * @returns {Promise<{success: boolean, exists: boolean}>}
 */
export async function checkPhoneExists(phoneNumber) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/check-phone?phoneNumber=${encodeURIComponent(phoneNumber)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to check phone number registration status.");
    }
    return data;
  } catch (error) {
    console.error("checkPhoneExists API Error:", error.message);
    throw error;
  }
}

/**
 * Synchronize Firebase user details with MongoDB.
 * Hits POST /api/users/sync
 * 
 * @param {string} token - Firebase ID token
 * @returns {Promise<{success: boolean, user: object}>}
 */
export async function syncUser(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/sync`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to synchronize user profile.");
    }
    return data;
  } catch (error) {
    console.error("syncUser API Error:", error.message);
    throw error;
  }
}

/**
 * Retrieve current user profile details from MongoDB.
 * Hits GET /api/users/me
 * 
 * @param {string} token - Firebase ID token
 * @returns {Promise<{success: boolean, user: object}>}
 */
export async function getUserMe(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch user profile.");
    }
    return data;
  } catch (error) {
    console.error("getUserMe API Error:", error.message);
    throw error;
  }
}

/**
 * Update current user profile details in MongoDB.
 * Hits PUT /api/users/me
 * 
 * @param {string} token - Firebase ID token
 * @param {object} profileData - Fields to update (name, photoURL, phoneNumber)
 * @returns {Promise<{success: boolean, user: object}>}
 */
export async function updateUserMe(token, profileData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update user profile.");
    }
    return data;
  } catch (error) {
    console.error("updateUserMe API Error:", error.message);
    throw error;
  }
}

/**
 * Fetch movies list.
 * GET /api/movies
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
 * Request a presigned S3/R2 PUT URL for direct large video uploads.
 * POST /api/movies/presigned-url
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
 * Request a presigned S3/R2 PUT URL for direct TV Show large video uploads.
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
 * Fetch a single movie by ID.
 * GET /api/movies/:id
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
 * Create a new movie. (Admin only)
 * POST /api/movies
 * 
 * @param {string} token 
 * @param {FormData} formData 
 */
export async function createMovie(token, formData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/movies`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
        // Do NOT set Content-Type header when sending FormData! The browser sets it automatically with the boundary.
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
 * Save or update watch progress.
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
 * Update watch progress for a movie.
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
 * Retrieve all registered users. (Admin only)
 * Hits GET /api/users
 * 
 * @param {string} token - Firebase ID token
 * @returns {Promise<{success: boolean, users: array}>}
 */
export async function getAllUsers(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to retrieve all users.");
    }
    return data;
  } catch (error) {
    console.error("getAllUsers API Error:", error.message);
    throw error;
  }
}

/**
 * Retrieve system-wide watch histories. (Admin only)
 * Hits GET /api/watch-history/all
 * 
 * @param {string} token - Firebase ID token
 * @returns {Promise<{success: boolean, history: array}>}
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

// ==========================================
// TMDB INTEGRATION SERVICES
// ==========================================

async function tmdbFetch(token, path) {
  const response = await fetch(`${BACKEND_URL}/api/tmdb${path}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch from TMDB proxy.");
  }
  return data;
}

export async function getTmdbPopularMovies(token, page = 1) {
  return tmdbFetch(token, `/movies/popular?page=${page}`);
}

export async function getTmdbTrendingMovies(token, page = 1) {
  return tmdbFetch(token, `/movies/trending?page=${page}`);
}

export async function getTmdbTopRatedMovies(token, page = 1) {
  return tmdbFetch(token, `/movies/top-rated?page=${page}`);
}

export async function getTmdbNowPlayingMovies(token, page = 1) {
  return tmdbFetch(token, `/movies/now-playing?page=${page}`);
}

export async function getTmdbPopularTv(token, page = 1) {
  return tmdbFetch(token, `/tv/popular?page=${page}`);
}

export async function getTmdbTrendingTv(token, page = 1) {
  return tmdbFetch(token, `/tv/trending?page=${page}`);
}

export async function searchTmdb(token, query, page = 1) {
  return tmdbFetch(token, `/search?query=${encodeURIComponent(query)}&page=${page}`);
}

export async function getTmdbMovieDetails(token, id) {
  return tmdbFetch(token, `/movie/${id}`);
}

export async function getTmdbTvDetails(token, id) {
  return tmdbFetch(token, `/tv/${id}`);
}

// ==========================================
// TV SHOW CATALOG SERVICES
// ==========================================

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
 * Creates a Razorpay order in backend.
 * POST /api/payment/create-order
 */
export async function createPaymentOrder(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ plan: "premium" })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create payment order.");
    return data;
  } catch (error) {
    console.error("createPaymentOrder API Error:", error.message);
    throw error;
  }
}

/**
 * Verifies Razorpay payment signature in backend.
 * POST /api/payment/verify
 */
export async function verifyPayment(token, paymentData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/verify`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Payment signature verification failed.");
    return data;
  } catch (error) {
    console.error("verifyPayment API Error:", error.message);
    throw error;
  }
}

/**
 * Retrieves the current subscription status of the user.
 * GET /api/payment/status
 */
export async function getSubscriptionStatus(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch subscription status.");
    return data;
  } catch (error) {
    console.error("getSubscriptionStatus API Error:", error.message);
    throw error;
  }
}

export async function adminCreateUser(token, userData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/admin-create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create user.");
    return data;
  } catch (error) {
    console.error("adminCreateUser API Error:", error.message);
    throw error;
  }
}

export async function adminUpdateUser(token, firebaseUid, updateData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${firebaseUid}/admin-update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update user.");
    return data;
  } catch (error) {
    console.error("adminUpdateUser API Error:", error.message);
    throw error;
  }
}

export async function adminResetPassword(token, firebaseUid, newPassword) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${firebaseUid}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to reset password.");
    return data;
  } catch (error) {
    console.error("adminResetPassword API Error:", error.message);
    throw error;
  }
}

export async function adminDeleteUser(token, firebaseUid) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${firebaseUid}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete user.");
    return data;
  } catch (error) {
    console.error("adminDeleteUser API Error:", error.message);
    throw error;
  }
}

export async function getAdminAuditLogs(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/audit-logs`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to retrieve audit logs.");
    return data;
  } catch (error) {
    console.error("getAdminAuditLogs API Error:", error.message);
    throw error;
  }
}





