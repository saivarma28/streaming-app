import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getMovieById, updateWatchHistory } from "../services/apiService";
import VideoPlayer from "../components/VideoPlayer";

export default function VideoPlayerPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const lastSavedTimeRef = useRef(0);
  const startPosition = location.state?.startPosition || 0;

  useEffect(() => {
    async function loadMovie() {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const movieData = await getMovieById(token, id);
        
        if (!movieData.movie.hlsUrl) {
          throw new Error("This movie has no streaming content associated.");
        }
        
        setMovie(movieData.movie);
      } catch (err) {
        console.error("Failed to load movie for watch session:", err);
        setError(err.message || "Failed to launch streaming playback.");
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [id, currentUser]);

  // Rate-limited progress logger to prevent server database overload
  const handleProgress = async (currentTime, duration, completed) => {
    // Save progress at least every 5 seconds, or immediately if completed
    if (completed || currentTime - lastSavedTimeRef.current >= 5) {
      lastSavedTimeRef.current = currentTime;
      try {
        const token = await currentUser.getIdToken();
        await updateWatchHistory(token, id, currentTime, completed);
        console.log(`Saved playback progress: ${currentTime}s / ${duration}s (Completed: ${completed})`);
      } catch (err) {
        console.warn("Failed to persist watch progress to backend:", err.message);
      }
    }
  };

  const handleComplete = async () => {
    try {
      const token = await currentUser.getIdToken();
      await updateWatchHistory(token, id, lastSavedTimeRef.current, true);
    } catch (err) {
      console.warn("Failed to mark movie as completed in watch history:", err.message);
    }
    // Navigate back to details screen
    navigate(`/movie/${id}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  // Handle errors or missing movie records
  if (error || !movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 text-center">
        <div className="max-w-md p-8 bg-[#12131a] rounded-2xl border border-white/5 shadow-2xl">
          <FiAlertCircle className="h-12 w-12 text-[#e50914] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wider">Player Error</h2>
          <p className="text-sm text-gray-400 font-light mb-6 leading-relaxed">
            {error || "Could not launch streaming session."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors cursor-pointer border border-white/10"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to Movie Details
          </button>
        </div>
      </div>
    );
  }

  // Handle transcoding status warnings
  if (movie.transcodingStatus !== "READY") {
    let statusMessage = "Your video is still being processed. Please check again shortly.";
    let isFailed = false;

    if (movie.transcodingStatus === "FAILED") {
      statusMessage = "Video processing failed.";
      isFailed = true;
    } else if (movie.transcodingStatus === "UPLOADING") {
      statusMessage = "Your video is currently uploading. Please check again shortly.";
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 text-center">
        <div className="max-w-md p-8 bg-[#12131a] rounded-2xl border border-white/5 shadow-2xl">
          <FiAlertCircle className={`h-12 w-12 mx-auto mb-4 ${isFailed ? "text-[#e50914]" : "text-amber-500 animate-pulse"}`} />
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wider">
            {isFailed ? "Processing Failed" : "Processing Video"}
          </h2>
          <p className="text-sm text-gray-400 font-light mb-6 leading-relaxed">
            {statusMessage}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors cursor-pointer border border-white/10"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to Movie Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none">
      {/* Floating Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-30 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => navigate(`/movie/${id}`)}
          className="p-3 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white hover:text-red-500 transition-all cursor-pointer"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-left">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Now Streaming</span>
          <h2 className="text-lg font-bold text-white leading-tight uppercase">{movie.title}</h2>
        </div>
      </div>

      {/* Responsive Video Player */}
      <div className="w-full h-full">
        <VideoPlayer
          hlsUrl={movie.hlsUrl}
          startPosition={startPosition}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
