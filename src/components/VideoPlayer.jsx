import React, { useEffect, useRef, useState } from "react";
import { FiPlay, FiLoader, FiAlertCircle } from "react-icons/fi";

/**
 * Reusable premium Video Player wrapping Cloudflare Stream Player.
 * Tracks progress and triggers updates for watch history logs.
 * 
 * @param {string} videoStreamId - Cloudflare Stream video ID (UID)
 * @param {number} startPosition - Time in seconds to resume playback
 * @param {function} onProgress - Callback triggered on playback time update: (currentTime, duration, completed)
 * @param {function} onComplete - Callback triggered when movie finishes playing
 */
export default function VideoPlayer({ videoStreamId, startPosition = 0, onProgress, onComplete }) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const playerRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Load the Cloudflare Stream Player SDK
  useEffect(() => {
    let scriptLoaded = false;
    const scriptId = "cloudflare-stream-sdk";

    const initPlayer = () => {
      if (!window.Stream || !iframeRef.current) return;
      try {
        // Instantiate the Stream SDK wrapper for the iframe
        const player = window.Stream(iframeRef.current);
        playerRef.current = player;

        player.addEventListener("ready", () => {
          setLoading(false);
          // Seek to starting position if provided
          if (startPosition > 0) {
            player.currentTime = startPosition;
          }
        });

        // Set up events
        player.addEventListener("play", () => {
          setLoading(false);
        });

        player.addEventListener("timeupdate", () => {
          const currentTime = player.currentTime;
          const duration = player.duration;

          if (duration > 0 && onProgress) {
            const completed = currentTime >= duration - 5; // Mark complete within last 5 seconds
            onProgress(Math.floor(currentTime), Math.floor(duration), completed);
          }
        });

        player.addEventListener("ended", () => {
          if (onComplete) onComplete();
        });

        player.addEventListener("error", (err) => {
          console.error("Cloudflare Stream player error:", err);
          setError(true);
          setLoading(false);
        });
      } catch (err) {
        console.error("Failed to initialize Cloudflare Stream SDK:", err);
        setError(true);
      }
    };

    // If script already exists in doc, initialize directly
    if (document.getElementById(scriptId)) {
      initPlayer();
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://embed.videodelivery.net/embed/sdk.latest.js";
      script.async = true;
      script.onload = () => {
        initPlayer();
      };
      script.onerror = () => {
        console.error("Failed to load Cloudflare Stream SDK script.");
        setError(true);
        setLoading(false);
      };
      document.body.appendChild(script);
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [videoStreamId, startPosition]);

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black p-8 text-center text-white">
        <FiAlertCircle className="h-12 w-12 text-[#e50914] mb-4" />
        <h3 className="text-xl font-bold mb-2">Playback Error</h3>
        <p className="text-sm text-gray-400 max-w-md font-light">
          We are unable to play this video. This might be due to an invalid stream ID or network connection problems.
        </p>
      </div>
    );
  }

  // Construct Cloudflare Stream direct playback embed URL
  const embedUrl = `https://iframe.videodelivery.net/${videoStreamId}?autoplay=true&letterbox=false&preload=auto`;

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

      {/* Cloudflare Stream embed iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-0 absolute inset-0 z-10"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Streaming Media Player"
      ></iframe>
    </div>
  );
}
