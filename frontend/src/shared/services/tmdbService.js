import { cachedFetch as fetch, BACKEND_URL } from "./apiClient";

/**
 * Helper to perform authenticated calls to backend TMDB proxy endpoints
 */
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
