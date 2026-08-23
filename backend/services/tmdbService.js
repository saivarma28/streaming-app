import dotenv from "dotenv";
dotenv.config();

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Helper to build headers and URL params for TMDB request
 */
function getRequestConfig(params = {}) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  const headers = {
    "Content-Type": "application/json",
  };

  const queryParams = new URLSearchParams(params);

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (apiKey) {
    queryParams.append("api_key", apiKey);
  } else {
    console.warn("WARNING: TMDB credentials are not configured in environment variables.");
  }

  return { headers, queryParams };
}

/**
 * Make a fetch request to TMDB API
 */
async function tmdbFetch(endpoint, params = {}) {
  const { headers, queryParams } = getRequestConfig(params);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const url = `${TMDB_BASE_URL}${endpoint}${queryString}`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.status_message || `TMDB responded with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`TMDB Service Error calling ${endpoint}:`, err.message);
    throw err;
  }
}

export async function getPopularMovies(page = 1) {
  return tmdbFetch("/movie/popular", { page });
}

export async function getTrendingMovies(timeWindow = "day", page = 1) {
  return tmdbFetch(`/trending/movie/${timeWindow}`, { page });
}

export async function getTopRatedMovies(page = 1) {
  return tmdbFetch("/movie/top_rated", { page });
}

export async function getNowPlayingMovies(page = 1) {
  return tmdbFetch("/movie/now_playing", { page });
}

export async function getPopularTv(page = 1) {
  return tmdbFetch("/tv/popular", { page });
}

export async function getTrendingTv(timeWindow = "day", page = 1) {
  return tmdbFetch(`/trending/tv/${timeWindow}`, { page });
}

export async function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`, { append_to_response: "credits,videos" });
}

export async function getTvDetails(id) {
  return tmdbFetch(`/tv/${id}`, { append_to_response: "credits,videos" });
}

export async function searchMulti(query, page = 1) {
  return tmdbFetch("/search/multi", { query, page });
}

export async function getMovieGenres() {
  return tmdbFetch("/genre/movie/list");
}

export async function getTvGenres() {
  return tmdbFetch("/genre/tv/list");
}
