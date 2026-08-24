import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiPlay, FiArrowLeft, FiClock, FiCalendar, FiGlobe, FiAlertCircle, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getMovieById, getWatchHistory, getTmdbMovieDetails, getTmdbTvDetails, getTvShowById, getSeasons, getEpisodes } from "../services/apiService";
import heroBannerFallback from "../assets/hero_banner.png";

export default function MovieDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeProgress, setResumeProgress] = useState(0);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMovieDetails() {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        
        const isTmdb = id.startsWith("tmdb-");
        const isTv = id.startsWith("tmdb-tv-") || id.startsWith("tv-");
        const cleanId = isTmdb ? id.replace("tmdb-movie-", "").replace("tmdb-tv-", "") : id.replace("tv-", "");

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
        } else if (id.startsWith("tv-")) {
          // Local TV Show loading
          const [tvData, seasonsData] = await Promise.all([
            getTvShowById(token, cleanId),
            getSeasons(token, cleanId)
          ]);

          const tvShow = tvData.tvShow;
          setMovie({
            ...tvShow,
            isTv: true,
            duration: seasonsData.seasons?.length > 0 ? `${seasonsData.seasons.length} Seasons` : "TV Series"
          });
          setSeasons(seasonsData.seasons || []);
          if (seasonsData.seasons?.length > 0) {
            setSelectedSeason(seasonsData.seasons[0].seasonNumber);
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

  // Load episodes when active season changes
  useEffect(() => {
    async function loadEpisodes() {
      if (!id.startsWith("tv-") || !currentUser) return;
      try {
        setEpisodesLoading(true);
        const token = await currentUser.getIdToken();
        const cleanId = id.replace("tv-", "");
        const epsData = await getEpisodes(token, cleanId, selectedSeason);
        setEpisodes(epsData.episodes || []);
      } catch (err) {
        console.error("Failed to load episodes:", err);
      } finally {
        setEpisodesLoading(false);
      }
    }

    loadEpisodes();
  }, [id, selectedSeason, currentUser]);

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

            {/* Play/Episode Catalog Action Area */}
            {movie.isTv ? (
              <div className="mt-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Episodes</h3>
                  
                  {/* Season Dropdown Selector */}
                  {seasons.length > 0 && (
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none cursor-pointer hover:bg-white/10 transition-colors focus:border-red-500/40"
                    >
                      {seasons.map((s) => (
                        <option key={s.seasonNumber} value={s.seasonNumber} className="bg-[#12131a] text-white">
                          Season {s.seasonNumber} ({s.publishedCount} Episodes)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {episodesLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
                  </div>
                ) : episodes.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center max-w-md">
                    <p className="text-gray-400 text-sm font-light">No published episodes available for this season yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {episodes.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex flex-col md:flex-row gap-5 bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all duration-300 group"
                      >
                        {/* Episode Thumbnail */}
                        <div className="w-full md:w-56 shrink-0 aspect-video rounded-xl overflow-hidden relative bg-gray-900 border border-white/5 shadow-inner">
                          {ep.thumbnailUrl ? (
                            <img
                              src={ep.thumbnailUrl}
                              alt={ep.title}
                              className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-350"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-tr from-gray-950 to-red-950/20 flex items-center justify-center p-3 text-center">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Episode {ep.episodeNumber}</span>
                            </div>
                          )}

                          {/* Play Hover Overlay */}
                          {ep.hlsUrl && (
                            <button
                              onClick={() => navigate(`/watch/tv-${movie.id}-s${selectedSeason}-e${ep.episodeNumber}`)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                            >
                              <div className="p-3 bg-[#e50914] rounded-full text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                <FiPlay className="h-4 w-4 fill-current" />
                              </div>
                            </button>
                          )}
                        </div>

                        {/* Episode Info */}
                        <div className="flex-1 text-left flex flex-col justify-center">
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-white font-bold text-base md:text-lg group-hover:text-red-400 transition-colors">
                              {ep.episodeNumber}. {ep.title}
                            </h4>
                            <span className="text-xs text-gray-400 font-medium">{ep.duration}m</span>
                          </div>
                          <p className="text-gray-400 text-xs sm:text-sm font-light leading-relaxed mb-4 line-clamp-2">
                            {ep.description || "No episode overview available."}
                          </p>

                          {/* Play CTA for Episode */}
                          {ep.hlsUrl ? (
                            <button
                              onClick={() => navigate(`/watch/tv-${movie.id}-s${selectedSeason}-e${ep.episodeNumber}`)}
                              className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <FiPlay className="h-3.5 w-3.5 fill-current" /> Play Episode
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Processing Stream</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
