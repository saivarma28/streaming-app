import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPlay, FiInfo, FiPlus, FiChevronRight } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getMovies, getGenres } from "../services/apiService";
import heroBannerFallback from "../assets/hero_banner.png";

export default function Home() {
  const { currentUser } = useAuth();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCatalog() {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        
        // Fetch movies and genres in parallel
        const [moviesData, genresData] = await Promise.all([
          getMovies(token),
          getGenres(token)
        ]);

        setMovies(moviesData.movies || []);
        setGenres(genresData.genres || []);
      } catch (err) {
        console.error("Failed to load catalog:", err);
        setError("Could not load catalog. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [currentUser]);

  // Select a featured movie for the main hero banner (first premium or first published movie)
  const featuredMovie = movies.find(m => m.isPremium) || movies[0];

  // Group movies by genre
  const getMoviesByGenre = (genreId) => {
    return movies.filter(movie => 
      movie.genres.some(genre => genre.id === genreId)
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0e12]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0d0e12] pb-24 text-white overflow-x-hidden">
      {/* Hero Banner Section */}
      {featuredMovie ? (
        <div className="relative h-[85vh] w-full overflow-hidden">
          {/* Background Image / Backdrop */}
          <div className="absolute inset-0">
            <img
              src={featuredMovie.backdropUrl || featuredMovie.thumbnailUrl || heroBannerFallback}
              alt={featuredMovie.title}
              className="h-full w-full object-cover object-center transform scale-105 transition-transform duration-1000"
            />
            {/* Gradient overlays to blend with background */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12] via-[#0d0e12]/35 to-transparent"></div>
          </div>

          {/* Hero Content */}
          <div className="absolute bottom-16 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
            <div className="max-w-2xl text-left">
              {featuredMovie.isPremium && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4 uppercase tracking-widest">
                  Premium
                </span>
              )}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-none mb-4">
                {featuredMovie.title}
              </h1>
              <p className="text-gray-300 text-sm sm:text-base mb-8 leading-relaxed font-light line-clamp-3">
                {featuredMovie.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate(`/watch/${featuredMovie.id}`)}
                  className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-[0_4px_20px_rgba(229,9,20,0.4)] hover:shadow-[0_4px_25px_rgba(229,9,20,0.6)] transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-sm"
                >
                  <FiPlay className="h-4.5 w-4.5 fill-current" />
                  Play Stream
                </button>
                <button
                  onClick={() => navigate(`/movie/${featuredMovie.id}`)}
                  className="flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold border border-white/10 backdrop-blur-md transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-sm"
                >
                  <FiInfo className="h-5 w-5" />
                  More Details
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-[40vh] w-full flex items-center justify-center bg-gradient-to-tr from-[#12131a] to-[#0d0e12] border-b border-white/5">
          <div className="text-center">
            <h1 className="text-3xl font-black uppercase text-white tracking-widest">STREAM<span className="text-[#e50914]">APP</span></h1>
            <p className="text-gray-400 text-sm mt-2">Welcome! Explore our premium catalog below.</p>
          </div>
        </div>
      )}

      {/* Catalog Grid (Netflix-style Rows) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {/* If no movies in database */}
        {movies.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white mb-2">No Movies Found</h3>
            <p className="text-gray-400 font-light text-sm">
              Our library is currently empty. Ask the administrator to add premium titles to start streaming.
            </p>
          </div>
        )}

        {/* Display Movies by Genre */}
        {genres.map((genre) => {
          const genreMovies = getMoviesByGenre(genre.id);
          if (genreMovies.length === 0) return null; // Hide empty genres

          return (
            <div key={genre.id} className="space-y-4">
              <div className="flex items-center justify-between border-l-4 border-red-500 pl-3">
                <h3 className="text-xl font-bold tracking-tight text-white">{genre.name}</h3>
                <span className="text-xs font-semibold text-gray-500 hover:text-red-400 cursor-pointer inline-flex items-center gap-0.5 transition-colors">
                  View All <FiChevronRight />
                </span>
              </div>

              {/* Grid of cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {genreMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    className="group relative h-48 rounded-2xl overflow-hidden border border-white/5 cursor-pointer shadow-lg transform hover:scale-[1.03] transition-all duration-500 ease-out"
                  >
                    {/* Thumbnail Image */}
                    {movie.thumbnailUrl ? (
                      <img
                        src={movie.thumbnailUrl}
                        alt={movie.title}
                        className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-gray-950 to-red-950/40 opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{movie.title.substring(0, 15)}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500/30 rounded-2xl transition-all duration-300"></div>

                    {/* Gradient Overlay & Metadata */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 z-10">
                      <div className="flex items-center justify-between mb-1.5">
                        {movie.isPremium && (
                          <span className="text-[9px] font-extrabold bg-amber-500 text-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Premium
                          </span>
                        )}
                        <span className="text-xs font-medium text-gray-400 ml-auto">{movie.releaseYear} • {movie.duration}m</span>
                      </div>
                      <h4 className="text-white font-bold text-base leading-tight group-hover:text-red-400 transition-colors duration-300">
                        {movie.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1 truncate">{movie.genres.map(g => g.name).join(" • ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Catch-all row for movies without genres */}
        {movies.length > 0 && movies.filter(m => m.genres.length === 0).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-l-4 border-red-500 pl-3">
              <h3 className="text-xl font-bold tracking-tight text-white">Uncategorized Titles</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.filter(m => m.genres.length === 0).map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className="group relative h-48 rounded-2xl overflow-hidden border border-white/5 cursor-pointer shadow-lg transform hover:scale-[1.03] transition-all duration-500 ease-out"
                >
                  {movie.thumbnailUrl ? (
                    <img
                      src={movie.thumbnailUrl}
                      alt={movie.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-950 to-red-950/40 opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{movie.title.substring(0, 15)}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500/30 rounded-2xl transition-all duration-300"></div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 z-10">
                    <div className="flex items-center justify-between mb-1.5">
                      {movie.isPremium && (
                        <span className="text-[9px] font-extrabold bg-amber-500 text-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          Premium
                        </span>
                      )}
                      <span className="text-xs font-medium text-gray-400 ml-auto">{movie.releaseYear} • {movie.duration}m</span>
                    </div>
                    <h4 className="text-white font-bold text-base leading-tight group-hover:text-red-400 transition-colors duration-300">
                      {movie.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
