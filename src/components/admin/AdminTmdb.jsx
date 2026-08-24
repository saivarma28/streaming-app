import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiSearch, FiDownload, FiVideo, FiTv, FiLoader, FiAlertCircle, FiCheckCircle 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { 
  searchTmdb, 
  getTmdbMovieDetails, 
  getTmdbTvDetails, 
  getGenres, 
  createGenre,
  createMovie, 
  createTvShow 
} from "../../services/apiService";

export default function AdminTmdb() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [searchType, setSearchType] = useState("movie"); // "movie" | "tv"
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const token = await currentUser.getIdToken();
      // Hits the TMDB search proxy
      const data = await searchTmdb(token, query);
      // Filter results by media type if necessary
      const filtered = (data.results || []).filter(item => {
        if (searchType === "movie") {
          return item.media_type === "movie" || (!item.media_type && item.title);
        } else {
          return item.media_type === "tv" || (!item.media_type && item.name);
        }
      });
      setResults(filtered);
    } catch (err) {
      console.error("TMDB search fail:", err.message);
      setError("Failed to fetch search results from TMDB.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (item) => {
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const token = await currentUser.getIdToken();
      
      // Fetch local genres to match names
      const localGenresData = await getGenres(token);
      const localGenres = localGenresData.genres || [];

      if (searchType === "movie") {
        // Fetch full TMDB movie details including credits
        const detailData = await getTmdbMovieDetails(token, item.id);
        const movie = detailData.movie;

        // Resolve genre IDs in local database
        const genreIds = [];
        for (const tmdbGenre of movie.genres || []) {
          let match = localGenres.find(lg => lg.name.toLowerCase() === tmdbGenre.name.toLowerCase());
          if (!match) {
            // Dynamically create the missing genre in the system
            const created = await createGenre(token, tmdbGenre.name);
            match = created.genre;
            localGenres.push(match);
          }
          genreIds.push(match.id);
        }

        // Build FormData exactly as expected by POST /api/movies
        const formData = new FormData();
        formData.append("title", movie.title);
        formData.append("description", movie.overview || "");
        formData.append("thumbnailUrl", movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "");
        formData.append("backdropUrl", movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : "");
        
        // Find trailer URL
        const trailerVideo = movie.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
        const trailerUrl = trailerVideo ? `https://www.youtube.com/watch?v=${trailerVideo.key}` : "";
        formData.append("trailerUrl", trailerUrl);
        
        formData.append("duration", String(movie.runtime || 120));
        formData.append("releaseYear", String((movie.release_date || "").split("-")[0] || new Date().getFullYear()));
        formData.append("maturityRating", movie.adult ? "18+" : "PG-13");
        formData.append("language", movie.original_language || "English");
        formData.append("isPremium", "false");
        formData.append("isPublished", "false"); // Imported as draft
        formData.append("genreIds", JSON.stringify(genreIds));
        formData.append("tmdbId", String(movie.id));

        // Save movie record (no video file attached yet)
        await createMovie(token, formData);
        setSuccessMsg(`Successfully imported "${movie.title}" as a draft! Link it to a video source under Movies.`);
      } else {
        // TV Show details
        const detailData = await getTmdbTvDetails(token, item.id);
        const tv = detailData.tv;

        // Resolve genres
        const genreIds = [];
        for (const tmdbGenre of tv.genres || []) {
          let match = localGenres.find(lg => lg.name.toLowerCase() === tmdbGenre.name.toLowerCase());
          if (!match) {
            const created = await createGenre(token, tmdbGenre.name);
            match = created.genre;
            localGenres.push(match);
          }
          genreIds.push(match.id);
        }

        const payload = {
          title: tv.name,
          description: tv.overview || "",
          thumbnailUrl: tv.poster_path ? `https://image.tmdb.org/t/p/w500${tv.poster_path}` : "",
          backdropUrl: tv.backdrop_path ? `https://image.tmdb.org/t/p/original${tv.backdrop_path}` : "",
          releaseYear: parseInt((tv.first_air_date || "").split("-")[0] || new Date().getFullYear()),
          language: tv.original_language || "English",
          isPublished: false, // draft
          genreIds,
          tmdbId: tv.id
        };

        await createTvShow(token, payload);
        setSuccessMsg(`Successfully imported "${tv.name}" as a draft TV series! Configure seasons and episodes under TV Shows.`);
      }
    } catch (err) {
      console.error("Import fail:", err.message);
      setError(err.message || "Failed to import details from TMDB proxy.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black uppercase text-white">TMDB Global Import</h1>
        <p className="text-sm text-gray-400 font-light mt-1">
          Search movies/shows on TMDB and import their complete metadata as drafts.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <FiAlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <FiCheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs & Search Box */}
      <div className="bg-[#12131a] border border-white/5 p-6 rounded-2xl shadow-xl space-y-4">
        {/* Toggle tabs */}
        <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl w-fit">
          <button
            onClick={() => { setSearchType("movie"); setResults([]); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              searchType === "movie" ? "bg-[#e50914] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <FiVideo className="h-4 w-4" />
            <span>Search Movies</span>
          </button>
          <button
            onClick={() => { setSearchType("tv"); setResults([]); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              searchType === "tv" ? "bg-[#e50914] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <FiTv className="h-4 w-4" />
            <span>Search TV Shows</span>
          </button>
        </div>

        {/* Input form */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4.5 w-4.5" />
            <input
              type="text"
              required
              placeholder={`Search ${searchType === 'movie' ? 'movies' : 'TV shows'} by title...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/5 bg-white/5 text-xs text-white placeholder-gray-400 outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((item) => {
            const title = item.title || item.name;
            const date = item.release_date || item.first_air_date || "";
            const year = date.split("-")[0] || "N/A";
            const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";

            return (
              <div 
                key={item.id}
                className="bg-[#12131a] border border-white/5 p-4 rounded-2xl flex gap-4 shadow-xl hover:border-white/10 transition-all"
              >
                {/* Poster */}
                <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 border border-white/5 shadow-md shrink-0">
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[#0d0e12]">
                      {searchType === "movie" ? <FiVideo className="h-6 w-6 text-gray-700" /> : <FiTv className="h-6 w-6 text-gray-700" />}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                        TMDB {item.id}
                      </span>
                      <span className="text-xs text-gray-500 font-semibold">{year}</span>
                      <span className="text-amber-500 text-xs font-bold">⭐ {rating}</span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-tight line-clamp-1">{title}</h3>
                    <p className="text-gray-400 text-xs font-light line-clamp-3 leading-relaxed">
                      {item.overview || "No overview available."}
                    </p>
                  </div>

                  <button
                    onClick={() => handleImport(item)}
                    disabled={actionLoading}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-[#e50914] text-white border border-white/5 rounded-xl text-xs font-bold transition-all w-fit cursor-pointer disabled:opacity-50"
                  >
                    <FiDownload className="h-4 w-4" />
                    <span>Import Metadata</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : query && (
        <div className="p-12 bg-[#12131a] border border-white/5 rounded-2xl text-center text-gray-500 text-sm">
          No matches found on TMDB for your query. Try a different search.
        </div>
      )}
    </div>
  );
}
