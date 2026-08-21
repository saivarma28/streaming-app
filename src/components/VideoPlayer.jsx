import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { FiLoader, FiAlertCircle } from "react-icons/fi";

/**
 * Reusable premium Video Player wrapping an HLS stream.
 * Plays HLS .m3u8 files using hls.js (or native Safari fallback).
 * Tracks progress and triggers updates for watch history logs.
 * 
 * @param {string} hlsUrl - GCS public HLS master playlist URL
 * @param {number} startPosition - Time in seconds to resume playback
 * @param {function} onProgress - Callback triggered on playback time update: (currentTime, duration, completed)
 * @param {function} onComplete - Callback triggered when movie finishes playing
 */
export default function VideoPlayer({ hlsUrl, startPosition = 0, onProgress, onComplete }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    setLoading(true);
    setError(false);

    // Clean up previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handleCanPlay = () => {
      setLoading(false);
    };

    const handlePlay = () => {
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;

      if (duration > 0 && onProgress) {
        const completed = currentTime >= duration - 5; // Mark complete within last 5 seconds
        onProgress(Math.floor(currentTime), Math.floor(duration), completed);
      }
    };

    const handleEnded = () => {
      if (onComplete) onComplete();
    };

    const handleError = (e) => {
      console.error("HTML5 video error:", e);
      if (video.error) {
        setError(true);
        setLoading(false);
      }
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    // Load HLS source
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (startPosition > 0) {
          video.currentTime = startPosition;
        }
        video.play().catch((err) => {
          console.warn("Autoplay blocked by browser policy:", err.message);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("hls.js error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("Fatal network error. Attempting to recover...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("Fatal media error. Attempting to recover...");
              hls.recoverMediaError();
              break;
            default:
              console.error("Unrecoverable HLS playback error");
              setError(true);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Fallback for native Safari HLS playback
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        if (startPosition > 0) {
          video.currentTime = startPosition;
        }
        video.play().catch((err) => {
          console.warn("Autoplay blocked by native browser policy:", err.message);
        });
      });
    } else {
      console.error("HLS streaming is not supported in this browser.");
      setError(true);
      setLoading(false);
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, startPosition]);

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black p-8 text-center text-white">
        <FiAlertCircle className="h-12 w-12 text-[#e50914] mb-4" />
        <h3 className="text-xl font-bold mb-2">Playback Error</h3>
        <p className="text-sm text-gray-400 max-w-md font-light">
          We are unable to play this video. This might be due to incorrect storage permissions, CORS block, or network connection problems.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0d0e12]">
          <div className="flex flex-col items-center gap-3">
            <FiLoader className="h-10 w-10 animate-spin text-[#e50914]" />
            <span className="text-sm font-semibold text-gray-400 tracking-wider">Optimizing Stream...</span>
          </div>
        </div>
      )}

      {/* HTML5 Native Video Tag */}
      <video
        ref={videoRef}
        className="w-full h-full z-10 object-contain"
        controls
        playsInline
      />
    </div>
  );
}
