import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlay, FiInfo, FiSearch, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getMovies, getGenres } from "../services/apiService";
import heroBannerFallback from "../assets/hero_banner.png";
import OptimizedImage from "../components/OptimizedImage";

export default function Movies() {
  const { currentUser } = useAuth();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCatalog() {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        
        const [moviesData, genresData] = await Promise.all([
          getMovies(token),
          getGenres(token)
        ]);

        setMovies(moviesData.movies || []);
        setGenres(genresData.genres || []);
      } catch (err) {
        console.error("Failed to load movies catalog:", err);
        setError("Could not load movies. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [currentUser]);

  // Filter movies based on search and genre selection
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = searchQuery.trim() === "" ||
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.language && movie.language.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre = !selectedGenreId ||
      movie.genres.some(g => g.id === selectedGenreId);

    return matchesSearch && matchesGenre;
  });

  // Select a featured movie for the main hero banner (first premium or first movie from filtered list)
  const featuredMovie = filteredMovies.find(m => m.isPremium) || filteredMovies[0];

  // Group movies by genre (respecting search and filters)
  const getMoviesByGenre = (genreId) => {
    return filteredMovies.filter(movie => 
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
    <div className="relative min-h-screen bg-[#0d0e12] pb-24 text-white overflow-x-hidden pt-16">
      {/* Hero Banner Section */}
      {featuredMovie ? (
        <div className="relative h-[450px] md:h-[550px] w-full overflow-hidden">
          {/* Background Image / Backdrop */}
          <div className="absolute inset-0">
            <OptimizedImage
              src={featuredMovie.backdropUrl || featuredMovie.thumbnailUrl || heroBannerFallback}
              alt={featuredMovie.title}
              className="h-full w-full object-cover object-center transform scale-105 transition-transform duration-1000"
            />
            {/* Gradient overlays to blend with background */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12] via-[#0d0e12]/35 to-transparent"></div>
          </div>

          {/* Hero Content */}
          <div className="absolute bottom-12 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
            <div className="max-w-2xl text-left">
              {featuredMovie.isPremium && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4 uppercase tracking-widest">
                  Premium
                </span>
              )}
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none mb-3">
                {featuredMovie.title}
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm mb-6 leading-relaxed font-light line-clamp-3">
                {featuredMovie.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/watch/${featuredMovie.id}`)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-[0_4px_20px_rgba(229,9,20,0.4)] hover:shadow-[0_4px_25px_rgba(229,9,20,0.6)] transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-xs"
                >
                  <FiPlay className="h-4 w-4 fill-current" />
                  Play Stream
                </button>
                <button
                  onClick={() => navigate(`/movie/${featuredMovie.id}`)}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold border border-white/10 backdrop-blur-md transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-xs"
                >
                  <FiInfo className="h-4.5 w-4.5" />
                  More Details
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-[30vh] w-full flex items-center justify-center bg-gradient-to-tr from-[#12131a] to-[#0d0e12] border-b border-white/5">
          <div className="text-center">
            <h1 className="text-2xl font-black uppercase text-white tracking-widest">MOVIES<span className="text-[#e50914]">CATALOG</span></h1>
            <p className="text-gray-400 text-xs mt-2">Welcome! Explore our premium movies below.</p>
          </div>
        </div>
      )}

      {/* Search & Genre Filtering Controls */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          {/* Genre Category Badges */}
          <div className="flex flex-wrap gap-2 justify-start items-center">
            <button
              onClick={() => setSelectedGenreId(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedGenreId === null
                  ? "bg-[#e50914] text-white shadow-md"
                  : "bg-white/5 hover:bg-white/10 text-gray-300"
              }`}
            >
              All Genres
            </button>
            {genres.map(genre => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenreId(genre.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGenreId === genre.id
                    ? "bg-[#e50914] text-white shadow-md"
                    : "bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>

          {/* Search Input Box */}
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white placeholder-gray-400 outline-none focus:border-red-500/40 focus:bg-white/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 space-y-12 pb-24">
        {movies.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white mb-2">No Movies Found</h3>
            <p className="text-gray-400 font-light text-sm">
              Our movies library is currently empty. Check back later for premium titles.
            </p>
          </div>
        ) : (searchQuery || selectedGenreId) ? (
          // Flat Grid View for Searched/Filtered Results
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-3 border-l-4 border-red-500 pl-3">
              <h3 className="text-xl font-bold tracking-tight text-white uppercase">Search Results ({filteredMovies.length})</h3>
            </div>

            {filteredMovies.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white mb-1">No Results</h3>
                <p className="text-gray-400 font-light text-xs">
                  We couldn't find any movies matching "{searchQuery}".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    className="group relative h-48 rounded-2xl overflow-hidden border border-white/5 cursor-pointer shadow-lg transform hover:scale-[1.03] transition-all duration-500 ease-out"
                  >
                    {movie.thumbnailUrl ? (
                      <OptimizedImage
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
                            ⭐ PREMIUM
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
            )}
          </div>
        ) : (
          // Default Rows View
          <div className="space-y-12 text-left">
            {genres.map((genre) => {
              const genreMovies = getMoviesByGenre(genre.id);
              if (genreMovies.length === 0) return null;

              return (
                <div key={genre.id} className="space-y-4">
                  <div className="flex items-center justify-between border-l-4 border-red-500 pl-3">
                    <h3 className="text-xl font-bold tracking-tight text-white">{genre.name}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {genreMovies.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => navigate(`/movie/${movie.id}`)}
                        className="group relative h-48 rounded-2xl overflow-hidden border border-white/5 cursor-pointer shadow-lg transform hover:scale-[1.03] transition-all duration-500 ease-out"
                      >
                        {movie.thumbnailUrl ? (
                          <OptimizedImage
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
                                ⭐ PREMIUM
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
              );
            })}

            {/* Uncategorized Titles Row */}
            {movies.filter(m => m.genres.length === 0).length > 0 && (
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
                        <OptimizedImage
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
                              ⭐ PREMIUM
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
        )}
      </div>
    </div>
  );
}
