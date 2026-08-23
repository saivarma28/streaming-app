import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiPlay, FiArrowLeft, FiClock, FiCalendar, FiGlobe, FiAlertCircle, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getMovieById, getWatchHistory, getTmdbMovieDetails, getTmdbTvDetails } from "../services/apiService";
import heroBannerFallback from "../assets/hero_banner.png";

export default function MovieDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeProgress, setResumeProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMovieDetails() {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        
        const isTmdb = id.startsWith("tmdb-");
        const isTv = id.startsWith("tmdb-tv-");
        const cleanId = isTmdb ? id.replace("tmdb-movie-", "").replace("tmdb-tv-", "") : id;

        if (isTmdb) {
          // Fetch from TMDB proxy backend details
          const data = isTv 
            ? await getTmdbTvDetails(token, cleanId)
            : await getTmdbMovieDetails(token, cleanId);

          const tmdbItem = isTv ? data.tv : data.movie;
          
          // Get trailer URL
          const trailerVideo = tmdbItem.videos?.results?.find(
            (v) => v.type === "Trailer" && v.site === "YouTube"
          );
          const trailerUrl = trailerVideo ? `https://www.youtube.com/watch?v=${trailerVideo.key}` : "";

          // Get cast and director
          const cast = tmdbItem.credits?.cast?.slice(0, 8) || [];
          const director = tmdbItem.credits?.crew?.find((c) => c.job === "Director")?.name || "";

          // Build a normalized metadata object matching our existing layout
          const normalizedMovie = {
            id: id, // TMDB prefixed ID
            localId: data.localMovie?.id || null, // local DB match if any
            hlsUrl: data.localMovie?.hlsUrl || null,
            isPremium: data.localMovie?.isPremium || false,
            title: tmdbItem.title || tmdbItem.name,
            description: tmdbItem.overview,
            backdropUrl: tmdbItem.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbItem.backdrop_path}` : "",
            thumbnailUrl: tmdbItem.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}` : "",
            releaseYear: (tmdbItem.release_date || tmdbItem.first_air_date || "").split("-")[0] || "N/A",
            duration: isTv 
              ? `${tmdbItem.number_of_seasons} Seasons (${tmdbItem.number_of_episodes} eps)` 
              : `${tmdbItem.runtime || "N/A"}`,
            language: tmdbItem.original_language,
            maturityRating: tmdbItem.adult ? "18+" : "PG-13",
            genres: tmdbItem.genres || [],
            cast,
            director,
            trailerUrl
          };

          setMovie(normalizedMovie);

          // Find if user has watch progress for this TMDB movie in local DB
          if (data.localMovie) {
            const historyData = await getWatchHistory(token);
            const savedProgress = historyData.history?.find(
              (item) => item.movieId === data.localMovie.id
            );
            if (savedProgress && !savedProgress.completed) {
              setResumeProgress(savedProgress.progress);
            }
          }
        } else {
          // Fetch movie details and watch history parallelly to find resume positions
          const [movieData, historyData] = await Promise.all([
            getMovieById(token, id),
            getWatchHistory(token)
          ]);

          setMovie(movieData.movie);

          // Find if user has a saved watch progress for this movie
          const savedProgress = historyData.history?.find(
            (item) => item.movieId === parseInt(id)
          );
          if (savedProgress && !savedProgress.completed) {
            setResumeProgress(savedProgress.progress);
          }
        }
      } catch (err) {
        console.error("Failed to load movie details:", err);
        setError(err.message || "Failed to retrieve movie details.");
      } finally {
        setLoading(false);
      }
    }

    loadMovieDetails();
  }, [id, currentUser]);

  const handlePlayClick = () => {
    if (!movie) return;
    const playId = movie.localId || movie.id;
    const streamUrl = movie.hlsUrl;
    
    if (!streamUrl) {
      alert("This global title is not linked to an active Cloudflare R2 streaming resource yet.");
      return;
    }
    // Navigate to player page, passing the start position as a state parameter
    navigate(`/watch/${playId}`, { state: { startPosition: resumeProgress } });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0e12]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 text-center">
        <div className="max-w-md p-8 bg-[#12131a] rounded-2xl border border-white/5 shadow-2xl">
          <FiAlertCircle className="h-12 w-12 text-[#e50914] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wider">Error Loading Movie</h2>
          <p className="text-sm text-gray-400 font-light mb-6 leading-relaxed">
            {error || "The requested movie could not be found."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors cursor-pointer border border-white/10"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0d0e12] pb-24 text-white">
      {/* Backdrop Section */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={movie.backdropUrl || movie.thumbnailUrl || heroBannerFallback}
            alt={movie.title}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12] via-[#0d0e12]/30 to-transparent"></div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-28 left-6 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white hover:text-red-400 transition-all cursor-pointer"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Main Details Panel */}
      <div className="relative -mt-40 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex flex-col md:flex-row gap-10">
          
          {/* Left: Thumbnail/Poster Card */}
          <div className="w-64 shrink-0 mx-auto md:mx-0">
            <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900/40">
              {movie.thumbnailUrl ? (
                <img
                  src={movie.thumbnailUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-tr from-gray-950 to-red-950/30 flex items-center justify-center p-6 text-center">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{movie.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Info Card */}
          <div className="flex-1 text-left pt-6 md:pt-24">
            <div className="flex flex-wrap items-center gap-3.5 mb-4">
              {movie.isPremium && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                  Premium
                </span>
              )}
              {movie.maturityRating && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/10 border border-white/10 text-gray-300">
                  {movie.maturityRating}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
              {movie.title}
            </h1>

            {/* Quick Metadata Row */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-medium mb-6">
              <div className="flex items-center gap-1.5">
                <FiCalendar className="h-4.5 w-4.5 text-red-500" />
                <span>{movie.releaseYear}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiClock className="h-4.5 w-4.5 text-red-500" />
                <span>{typeof movie.duration === 'string' && movie.duration.includes("Season") ? movie.duration : `${movie.duration} min`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiGlobe className="h-4.5 w-4.5 text-red-500" />
                <span className="capitalize">{movie.language || "English"}</span>
              </div>
            </div>

            <p className="text-gray-300 text-base leading-relaxed font-light mb-8 max-w-3xl">
              {movie.description}
            </p>

            {/* Director and Cast */}
            {movie.director && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Director</h4>
                <p className="text-gray-300 text-sm font-medium">{movie.director}</p>
              </div>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cast</h4>
                <div className="flex flex-wrap gap-3">
                  {movie.cast.map((actor) => (
                    <div key={actor.id} className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-xs text-gray-300 font-medium">
                      <FiUser className="h-3.5 w-3.5 text-gray-400" />
                      <span>{actor.name}</span>
                      <span className="text-[10px] text-gray-500">as {actor.character}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Genres Tag List */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Genres</h4>
                <div className="flex flex-wrap gap-2.5">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-xl text-xs text-gray-300 font-semibold transition-all cursor-pointer"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Play CTA Button */}
            <div className="flex flex-wrap gap-4 items-center">
              {movie.hlsUrl ? (
                <button
                  onClick={handlePlayClick}
                  className="flex items-center gap-2.5 px-10 py-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-[0_4px_25px_rgba(229,9,20,0.4)] hover:shadow-[0_4px_30px_rgba(229,9,20,0.65)] transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-base uppercase tracking-wider"
                >
                  <FiPlay className="h-5 w-5 fill-current" />
                  {resumeProgress > 0 ? `Resume at ${Math.floor(resumeProgress / 60)}m` : "Play Stream"}
                </button>
              ) : (
                <div className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold max-w-md">
                  Currently Unavailable: Streaming source has not been linked to this title.
                </div>
              )}

              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-10 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold border border-white/10 backdrop-blur-md transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-base uppercase tracking-wider"
                >
                  Watch Trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
