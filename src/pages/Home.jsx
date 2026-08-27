import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPlay, FiInfo, FiPlus, FiChevronRight, FiChevronLeft, FiSearch, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { 
  getMovies, 
  getGenres, 
  getWatchHistory,
  getTmdbPopularMovies,
  getTmdbTrendingMovies,
  getTmdbTopRatedMovies,
  getTmdbPopularTv,
  searchTmdb
} from "../services/apiService";
import heroBannerFallback from "../assets/hero_banner.png";
import OptimizedImage from "../components/OptimizedImage";
import InstallAppButton from "../components/InstallAppButton";

// Static mapping of TMDB genre IDs to human-readable names
const TMDB_GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

export default function Home() {
  const { currentUser } = useAuth();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleOpenSearch = () => {
      setIsSearchOpen(true);
    };
    window.addEventListener("open-search-overlay", handleOpenSearch);
    return () => window.removeEventListener("open-search-overlay", handleOpenSearch);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCloseSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSelectedGenreId(null);
  };

  // TMDB integration states
  const [tmdbTrending, setTmdbTrending] = useState([]);
  const [tmdbPopularMovies, setTmdbPopularMovies] = useState([]);
  const [tmdbTopRated, setTmdbTopRated] = useState([]);
  const [tmdbPopularTv, setTmdbPopularTv] = useState([]);
  const [tmdbError, setTmdbError] = useState(false);
  const [tmdbSearchResults, setTmdbSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tmdbLoading, setTmdbLoading] = useState(true);

  // TMDB Hero carousel states
  const [heroIndex, setHeroIndex] = useState(0);

  // Automatic rotation for TMDB hero banner (resets on manual changes)
  useEffect(() => {
    if (tmdbTrending.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prevIndex) => (prevIndex + 1) % Math.min(tmdbTrending.length, 6));
    }, 6000); // 6 seconds auto-rotation
    return () => clearInterval(interval);
  }, [tmdbTrending, heroIndex]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        
        // Fetch movies, genres, and watch history in parallel
        const [moviesData, genresData, historyData] = await Promise.all([
          getMovies(token),
          getGenres(token),
          getWatchHistory(token).catch((e) => {
            console.warn("Failed to load watch history for homepage:", e.message);
            return { history: [] };
          })
        ]);

        setMovies(moviesData.movies || []);
        setGenres(genresData.genres || []);
        setWatchHistory(historyData.history || []);

        // Load TMDB catalog blocks in parallel (fail-safe error isolation)
        try {
          let hasTmdbError = false;
          const [trendingData, popularData, topRatedData, popularTvData] = await Promise.all([
            getTmdbTrendingMovies(token).catch(e => { console.warn("TMDB trending load error:", e.message); hasTmdbError = true; return { results: [] }; }),
            getTmdbPopularMovies(token).catch(e => { console.warn("TMDB popular load error:", e.message); hasTmdbError = true; return { results: [] }; }),
            getTmdbTopRatedMovies(token).catch(e => { console.warn("TMDB top rated load error:", e.message); hasTmdbError = true; return { results: [] }; }),
            getTmdbPopularTv(token).catch(e => { console.warn("TMDB popular TV load error:", e.message); hasTmdbError = true; return { results: [] }; })
          ]);
          
          setTmdbTrending(trendingData.results || []);
          setTmdbPopularMovies(popularData.results || []);
          setTmdbTopRated(topRatedData.results || []);
          setTmdbPopularTv(popularTvData.results || []);
          
          if (hasTmdbError || (!trendingData.results && !popularData.results && !topRatedData.results && !popularTvData.results)) {
            setTmdbError(true);
          }
        } catch (tmdbErr) {
          console.warn("Failed to retrieve TMDB sections:", tmdbErr.message);
          setTmdbError(true);
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
        setError("Could not load catalog. Please check your connection.");
      } finally {
        setLoading(false);
        setTmdbLoading(false);
      }
    }

    loadCatalog();
  }, [currentUser]);

  // Debounced TMDB search integration
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTmdbSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setSearching(true);
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const data = await searchTmdb(token, searchQuery);
        setTmdbSearchResults(data.results || []);
      } catch (err) {
        console.error("TMDB Search Error:", err.message);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentUser]);

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

  // Filter active continue watching items
  const continueWatchingList = watchHistory.filter(item => !item.completed && item.movie);

  // Select a featured movie for the main hero banner (first premium or first published movie from filtered list)
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
    <div className="relative min-h-screen bg-[#0d0e12] pb-24 text-white overflow-x-hidden">
      {/* Hero Banner Section */}
      {tmdbLoading ? (
        <div className="relative h-[500px] md:h-[600px] w-full bg-gradient-to-tr from-[#12131a] to-[#0d0e12] animate-pulse flex flex-col justify-end p-8 md:p-16">
          <div className="max-w-2xl space-y-4 text-left">
            <div className="h-4 w-24 bg-white/10 rounded"></div>
            <div className="h-12 w-3/4 bg-white/10 rounded"></div>
            <div className="h-6 w-1/2 bg-white/10 rounded"></div>
            <div className="h-20 w-full bg-white/10 rounded"></div>
            <div className="flex gap-4">
              <div className="h-12 w-32 bg-white/10 rounded-xl"></div>
              <div className="h-12 w-32 bg-white/10 rounded-xl"></div>
            </div>
          </div>
        </div>
      ) : tmdbTrending.length > 0 ? (
        (() => {
          const heroMovies = tmdbTrending.slice(0, 6);
          const activeMovie = heroMovies[heroIndex] || heroMovies[0];
          return (
            <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden group">
              {/* Background Image / Backdrop */}
              <div className="absolute inset-0 transition-transform duration-1000 transform scale-100 group-hover:scale-102">
                <img
                  src={`https://image.tmdb.org/t/p/original${activeMovie.backdrop_path || activeMovie.poster_path}`}
                  alt={activeMovie.title || activeMovie.name}
                  className="h-full w-full object-cover object-center"
                />
                {/* Gradient overlays to blend with background */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12] via-[#0d0e12]/40 to-transparent"></div>
                <div className="absolute inset-0 bg-black/20"></div>
              </div>

              {/* Slider Navigation Arrows */}
              <button
                onClick={() => setHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/80 border border-white/5 text-white hover:text-[#e50914] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
              >
                <FiChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setHeroIndex((prev) => (prev + 1) % heroMovies.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/80 border border-white/5 text-white hover:text-[#e50914] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
              >
                <FiChevronRight className="h-6 w-6" />
              </button>

              {/* Hero Content */}
              <div className="absolute bottom-16 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10 text-left">
                <div className="max-w-2xl">
                  {/* Badge & Meta Row */}
                  <div className="flex flex-wrap items-center gap-3 mb-3 text-xs md:text-sm font-semibold">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#e50914] text-white font-extrabold text-[10px] uppercase tracking-widest">
                      Trending
                    </span>
                    <span className="text-gray-300">
                      {(activeMovie.release_date || activeMovie.first_air_date || "").split("-")[0]}
                    </span>
                    <span className="text-amber-500 flex items-center gap-1 font-bold">
                      ⭐ {activeMovie.vote_average ? activeMovie.vote_average.toFixed(1) : "N/A"}
                    </span>
                    {activeMovie.genre_ids && activeMovie.genre_ids.length > 0 && (
                      <span className="text-gray-400 font-light border-l border-white/10 pl-3">
                        {activeMovie.genre_ids.slice(0, 3).map(id => TMDB_GENRES[id]).filter(Boolean).join(" • ")}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase leading-tight mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {activeMovie.title || activeMovie.name}
                  </h1>
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base mb-8 leading-relaxed font-light line-clamp-3 md:line-clamp-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                    {activeMovie.overview}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => {
                        const localMatch = movies.find(m => m.tmdbId === activeMovie.id || m.title?.toLowerCase() === (activeMovie.title || activeMovie.name)?.toLowerCase());
                        if (localMatch) {
                          navigate(`/watch/${localMatch.id}`);
                        } else {
                          navigate(`/movie/tmdb-movie-${activeMovie.id}`);
                        }
                      }}
                      className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-[0_4px_20px_rgba(229,9,20,0.4)] hover:shadow-[0_4px_25px_rgba(229,9,20,0.6)] transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-sm"
                    >
                      <FiPlay className="h-4.5 w-4.5 fill-current" />
                      Watch Now
                    </button>
                    <button
                      onClick={() => navigate(`/movie/tmdb-movie-${activeMovie.id}`)}
                      className="flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold border border-white/10 backdrop-blur-md transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-sm"
                    >
                      <FiInfo className="h-5 w-5" />
                      More Info
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Dot Indicators */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-25">
                {heroMovies.map((_, idx) => (
                  <button
                    key={`indicator-${idx}`}
                    onClick={() => setHeroIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      heroIndex === idx ? "w-6 bg-[#e50914]" : "w-1.5 bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })()
      ) : featuredMovie ? (
        <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
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

      {/* PWA Install Banner */}
      {!searchQuery && !selectedGenreId && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
          <InstallAppButton />
        </div>
      )}

      {/* Continue Watching Section */}
      {continueWatchingList.length > 0 && !searchQuery && !selectedGenreId && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-3">
              <h3 className="text-xl font-bold tracking-tight text-white uppercase">Continue Watching</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {continueWatchingList.map((item) => {
                const progressPct = item.movie.duration 
                  ? Math.min(Math.round((item.progress / (item.movie.duration * 60)) * 100), 100) 
                  : 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/watch/${item.movie.id}`, { state: { startPosition: item.progress } })}
                    className="group relative h-48 rounded-2xl overflow-hidden border border-white/5 cursor-pointer shadow-lg transform hover:scale-[1.03] transition-all duration-500 ease-out"
                  >
                    {item.movie.thumbnailUrl ? (
                      <OptimizedImage
                        src={item.movie.thumbnailUrl}
                        alt={item.movie.title}
                        className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-all duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-gray-950 to-amber-950/40 opacity-70 group-hover:opacity-90 transition-all duration-300 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{item.movie.title}</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-500/30 rounded-2xl transition-all duration-300"></div>

                    {/* Play Hover Indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 z-10">
                      <div className="p-3 bg-amber-500 rounded-full text-black">
                        <FiPlay className="h-5 w-5 fill-current" />
                      </div>
                    </div>

                    {/* Details and Progress Bar */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 z-15">
                      <h4 className="text-white font-bold text-base leading-tight group-hover:text-amber-400 transition-colors duration-300">
                        {item.movie.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Resume at {Math.floor(item.progress / 60)}m</p>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-white/10 rounded-full h-1 mt-3 overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 space-y-12 pb-24">
        {movies.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white mb-2">No Movies Found</h3>
            <p className="text-gray-400 font-light text-sm">
              Our library is currently empty. Ask the administrator to add premium titles to start streaming.
            </p>
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
                    <span className="text-xs font-semibold text-gray-500 hover:text-red-400 cursor-pointer inline-flex items-center gap-0.5 transition-colors">
                      View All <FiChevronRight />
                    </span>
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
                          <p className="text-[10px] text-gray-400 mt-1 truncate">{movie.genres.map(g => g.name).join(" • ")}</p>
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
        )}
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div 
          onClick={handleCloseSearch}
          className="fixed inset-0 z-50 bg-[#090a0f]/98 backdrop-blur-xl overflow-y-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-all duration-300"
        >
          {/* Close Button */}
          <button 
            onClick={handleCloseSearch}
            className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/5 z-55"
          >
            <FiX className="h-6 w-6" />
          </button>

          {/* Search Content Wrapper */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-7xl mx-auto w-full flex flex-col items-center"
          >
            {/* Search Input Box */}
            <div className="relative w-full max-w-3xl mb-6">
              <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                autoFocus
                placeholder="Search titles, descriptions, languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-12 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-400 outline-none focus:border-red-500/40 focus:bg-white/10 transition-all shadow-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Genre Category Badges */}
            <div className="flex flex-wrap gap-2 justify-center items-center max-w-4xl mb-10 bg-white/5 border border-white/5 p-3 rounded-2xl">
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

            {/* Search Results Inside Overlay */}
            <div className="w-full text-left space-y-12">
              {/* Local Library Results */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-red-500 pl-3">
                  <h3 className="text-xl font-bold tracking-tight text-white uppercase">
                    Local Library Results ({filteredMovies.length})
                  </h3>
                </div>

                {filteredMovies.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center max-w-md mx-auto">
                    <h3 className="text-sm font-bold text-white mb-1">No Matching Local Titles</h3>
                    <p className="text-gray-400 font-light text-xs">
                      We couldn't find any titles matching your search term or genre choice in the local database.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMovies.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => {
                          handleCloseSearch();
                          navigate(`/movie/${movie.id}`);
                        }}
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
                          <p className="text-[10px] text-gray-400 mt-1 truncate">{movie.genres.map(g => g.name).join(" • ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TMDB Global Search Results */}
              {searchQuery.trim() !== "" && (
                <div className="space-y-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-3">
                    <h3 className="text-xl font-bold tracking-tight text-white uppercase">Global Search Results ({tmdbSearchResults.length})</h3>
                  </div>

                  {searching ? (
                    <div className="flex justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                    </div>
                  ) : tmdbSearchResults.length === 0 ? (
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center max-w-md mx-auto">
                      <h3 className="text-lg font-bold text-white mb-1">No Global Results</h3>
                      <p className="text-gray-400 font-light text-xs">
                        We couldn't find any global titles matching "{searchQuery}" on TMDB.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {tmdbSearchResults.map((item) => {
                        const isTv = item.media_type === "tv" || (!item.title && item.name);
                        const releaseDate = item.release_date || item.first_air_date || "";
                        const releaseYear = releaseDate.split("-")[0] || "N/A";
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
                        
                        return (
                          <div
                            key={`tmdb-${item.id}`}
                            onClick={() => {
                              handleCloseSearch();
                              navigate(`/movie/tmdb-${isTv ? "tv" : "movie"}-${item.id}`);
                            }}
                            className="group relative h-48 rounded-2xl overflow-hidden border border-white/5 cursor-pointer shadow-lg transform hover:scale-[1.03] transition-all duration-500 ease-out"
                          >
                            {item.backdrop_path || item.poster_path ? (
                              <OptimizedImage
                                src={`https://image.tmdb.org/t/p/w500${item.backdrop_path || item.poster_path}`}
                                alt={item.title || item.name}
                                className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-tr from-gray-950 to-amber-950/40 opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 text-center">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{item.title || item.name}</span>
                              </div>
                            )}

                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-500/30 rounded-2xl transition-all duration-300"></div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 z-10">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-extrabold bg-amber-500 text-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                  {isTv ? "TV Show" : "Movie"}
                                </span>
                                <span className="text-xs font-medium text-gray-400 ml-auto">{releaseYear} • ⭐ {rating}</span>
                              </div>
                              <h4 className="text-white font-bold text-base leading-tight group-hover:text-amber-400 transition-colors duration-300">
                                {item.title || item.name}
                              </h4>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
