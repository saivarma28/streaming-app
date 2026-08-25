import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { 
  FiLoader, 
  FiAlertCircle, 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX, 
  FiVolume1, 
  FiMaximize, 
  FiMinimize, 
  FiRotateCcw, 
  FiRotateCw,
  FiSettings,
  FiTv
} from "react-icons/fi";

/**
 * Reusable premium Video Player wrapping an HLS stream.
 * Plays HLS .m3u8 files using hls.js (or native Safari fallback).
 * Tracks progress and triggers updates for watch history logs.
 * Includes custom controls, speeds, skips, and gestures.
 * 
 * @param {string} hlsUrl - GCS public HLS master playlist URL
 * @param {number} startPosition - Time in seconds to resume playback
 * @param {function} onProgress - Callback triggered on playback time update: (currentTime, duration, completed)
 * @param {function} onComplete - Callback triggered when movie finishes playing
 */
export default function VideoPlayer({ hlsUrl, startPosition = 0, onProgress, onComplete }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerContainerRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const showControlsTimerRef = useRef(null);
  const seekFeedbackTimeoutRef = useRef(null);

  // Loading, buffering, and error states
  const [loading, setLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(false);

  // Custom playback controller states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [aspectRatio, setAspectRatio] = useState("contain");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [seekFeedback, setSeekFeedback] = useState(null);
  const [doubleTapSide, setDoubleTapSide] = useState(null);

  // Speeds options array
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5];

  // Helper: Format seconds to time string (H:MM:SS or M:SS)
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const padZero = (num) => String(num).padStart(2, "0");

    if (hours > 0) {
      return `${hours}:${padZero(minutes)}:${padZero(seconds)}`;
    }
    return `${minutes}:${padZero(seconds)}`;
  };

  // Play/Pause Action Toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch((err) => console.warn("Play blocked:", err.message));
      setIsPlaying(true);
    }
    resetControlsTimer();
  };

  // 5s Skips
  const rewind = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 5);
    setCurrentTime(video.currentTime);
    triggerSeekFeedback("-5 seconds", "left");
    resetControlsTimer();
  };

  const forward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
    setCurrentTime(video.currentTime);
    triggerSeekFeedback("+5 seconds", "right");
    resetControlsTimer();
  };

  // Volume Slider
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      video.muted = newVolume === 0;
    }
    resetControlsTimer();
  };

  // Mute Toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = volume > 0 ? volume : 0.5;
      setVolume(video.volume);
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
    resetControlsTimer();
  };

  // Aspect Ratio Fit (Contain / Cover)
  const toggleAspectRatio = () => {
    setAspectRatio((prev) => (prev === "contain" ? "cover" : "contain"));
    resetControlsTimer();
  };

  // Playback Rate
  const changePlaybackRate = (rate) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
    }
    setShowSpeedMenu(false);
    resetControlsTimer();
  };

  // Fullscreen toggle via Element Parent API
  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Failed to enter fullscreen:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
    resetControlsTimer();
  };

  // Seek bar event
  const handleSeekChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    resetControlsTimer();
  };

  // Seek feedback animation triggers
  const triggerSeekFeedback = (text, side) => {
    setSeekFeedback(text);
    setDoubleTapSide(side);
    if (seekFeedbackTimeoutRef.current) {
      clearTimeout(seekFeedbackTimeoutRef.current);
    }
    seekFeedbackTimeoutRef.current = setTimeout(() => {
      setSeekFeedback(null);
      setDoubleTapSide(null);
    }, 800);
  };

  // Click handler on background for single play/pause and double-tap skips
  const handleBackgroundClick = (e) => {
    // Prevent trigger if clicking on interactive controls
    if (e.target !== e.currentTarget) return;

    setShowSpeedMenu(false); // Close dropdown menu if active
    resetControlsTimer();

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeft = clickX < rect.width / 2;

    if (e.detail === 2) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      if (isLeft) {
        rewind();
      } else {
        forward();
      }
    } else if (e.detail === 1) {
      clickTimeoutRef.current = setTimeout(() => {
        togglePlay();
        clickTimeoutRef.current = null;
      }, 220);
    }
  };

  // Controls Visibility loop
  const resetControlsTimer = () => {
    setShowControls(true);
    if (showControlsTimerRef.current) {
      clearTimeout(showControlsTimerRef.current);
    }
    if (videoRef.current && !videoRef.current.paused) {
      showControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  // Track Fullscreen Change events natively
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Controls overlay visibility bindings
  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (showControlsTimerRef.current) {
        clearTimeout(showControlsTimerRef.current);
      }
      if (seekFeedbackTimeoutRef.current) {
        clearTimeout(seekFeedbackTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          rewind();
          break;
        case "arrowright":
          e.preventDefault();
          forward();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying, volume, isMuted, isFullscreen]);

  // Setup core HTML5 Video element and Hls stream listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    setLoading(true);
    setError(false);
    setIsBuffering(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handleCanPlay = () => {
      setLoading(false);
      setIsBuffering(false);
    };

    const handlePlay = () => {
      setLoading(false);
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    const handleSeeking = () => {
      setIsBuffering(true);
    };

    const handleSeeked = () => {
      setIsBuffering(false);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    const handleTimeUpdate = () => {
      const curTime = video.currentTime;
      const dur = video.duration;
      setCurrentTime(curTime);

      if (dur > 0 && onProgress) {
        const completed = curTime >= dur - 5;
        onProgress(Math.floor(curTime), Math.floor(dur), completed);
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
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    // Initial load configurations
    video.playbackRate = playbackRate;

    const isHls = hlsUrl.toLowerCase().includes(".m3u8") || hlsUrl.toLowerCase().includes("manifest");
    if (isHls && Hls.isSupported()) {
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
    } else {
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        setDuration(video.duration);
        if (startPosition > 0) {
          video.currentTime = startPosition;
        }
        video.play().catch((err) => {
          console.warn("Autoplay blocked by native browser policy:", err.message);
        });
      });
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("volumechange", handleVolumeChange);
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
        <FiAlertCircle className="h-12 w-12 text-[#e50914] mb-4 animate-bounce" />
        <h3 className="text-xl font-bold mb-2">Playback Error</h3>
        <p className="text-sm text-gray-400 max-w-md font-light leading-relaxed">
          We are unable to play this video. This might be due to incorrect storage permissions, CORS block, or network connection problems.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={playerContainerRef}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      className="relative w-full h-full bg-black overflow-hidden select-none group"
    >
      {/* 1. Loader Overlays */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0d0e12]">
          <div className="flex flex-col items-center gap-3">
            <FiLoader className="h-10 w-10 animate-spin text-[#e50914]" />
            <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase animate-pulse">Optimizing Stream...</span>
          </div>
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && !loading && (
        <div className="absolute inset-0 z-45 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent shadow-xl"></div>
        </div>
      )}

      {/* 2. Visual Double-Click Seek feedback animation overlay */}
      {seekFeedback && (
        <div className={`absolute top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 animate-pulse
          ${doubleTapSide === "left" ? "left-[15%]" : "right-[15%]"}`}
        >
          <div className="h-14 w-14 sm:h-16 sm:w-16 bg-black/60 rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg mb-2">
            {doubleTapSide === "left" ? <FiRotateCcw className="h-6 w-6" /> : <FiRotateCw className="h-6 w-6" />}
          </div>
          <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/5">{seekFeedback}</span>
        </div>
      )}

      {/* 3. HTML5 Native Video Tag */}
      <video
        ref={videoRef}
        className="w-full h-full z-10"
        style={{ objectFit: aspectRatio }}
        playsInline
      />

      {/* 4. Custom Controls Interface Layer */}
      <div 
        onClick={handleBackgroundClick}
        className={`absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-300 select-none
          ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)" }}
      >
        {/* Spacer top to prevent header overlap */}
        <div className="h-20 w-full pointer-events-none"></div>

        {/* Center Control Panel */}
        <div className="flex items-center justify-center gap-10 sm:gap-16 md:gap-24 pointer-events-auto">
          {/* Seek 5s Backwards */}
          <button 
            onClick={(e) => { e.stopPropagation(); rewind(); }}
            className="flex flex-col items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer p-3.5 rounded-full hover:bg-white/5 active:scale-90"
            aria-label="Rewind 5 seconds"
          >
            <FiRotateCcw className="h-8 w-8 sm:h-10 sm:w-10" />
            <span className="text-[9px] sm:text-[10px] font-bold mt-1 uppercase tracking-wider">5s</span>
          </button>

          {/* Core Play / Pause */}
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="flex items-center justify-center text-white bg-[#e50914] hover:bg-red-700 h-16 w-16 sm:h-20 sm:w-20 rounded-full transition-all shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:shadow-[0_4px_30px_rgba(229,9,20,0.6)] transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <FiPause className="h-7 w-7 sm:h-9 sm:w-9 fill-current" />
            ) : (
              <FiPlay className="h-7 w-7 sm:h-9 sm:w-9 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Seek 5s Forwards */}
          <button 
            onClick={(e) => { e.stopPropagation(); forward(); }}
            className="flex flex-col items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer p-3.5 rounded-full hover:bg-white/5 active:scale-90"
            aria-label="Forward 5 seconds"
          >
            <FiRotateCw className="h-8 w-8 sm:h-10 sm:w-10" />
            <span className="text-[9px] sm:text-[10px] font-bold mt-1 uppercase tracking-wider">5s</span>
          </button>
        </div>

        {/* Bottom control panel */}
        <div className="w-full px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 pointer-events-auto">
          
          {/* Progress Timeline Slider Bar */}
          <div className="flex items-center gap-3 group/progress">
            <span className="text-xs font-semibold text-white/90 tabular-nums">{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center">
              <input 
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full h-1 sm:h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer outline-none accent-[#e50914] focus:ring-0 transition-all group-hover/progress:h-2"
                style={{
                  background: `linear-gradient(to right, #e50914 0%, #e50914 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
            <span className="text-xs font-semibold text-white/90 tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* Control Options Row */}
          <div className="flex items-center justify-between">
            {/* Left Side: Play/Pause Mini Toggle */}
            <div className="flex items-center gap-2">
              <button 
                onClick={togglePlay}
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-white/5 active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <FiPause className="h-5 w-5" /> : <FiPlay className="h-5 w-5" />}
              </button>
            </div>

            {/* Right Side: Settings & View Options */}
            <div className="flex items-center gap-3 sm:gap-5 relative">
              
              {/* Volume Mixer with slide hover slider */}
              <div className="flex items-center gap-1 group/volume">
                <button 
                  onClick={toggleMute}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-white/5 active:scale-95"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <FiVolumeX className="h-5 w-5" />
                  ) : volume < 0.5 ? (
                    <FiVolume1 className="h-5 w-5" />
                  ) : (
                    <FiVolume2 className="h-5 w-5" />
                  )}
                </button>
                <input 
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 overflow-hidden opacity-0 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer outline-none accent-white transition-all duration-300 group-hover/volume:w-16 group-hover/volume:opacity-100 focus:w-16 focus:opacity-100 sm:group-hover/volume:w-20"
                />
              </div>

              {/* View/Fit scaling controls */}
              <button 
                onClick={toggleAspectRatio}
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-white/5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider active:scale-95"
                aria-label="Toggle Aspect Ratio"
              >
                <FiTv className="h-4.5 w-4.5" />
                <span className="hidden md:inline">{aspectRatio === "contain" ? "Fit" : "Fill"}</span>
              </button>

              {/* Playback speed popup */}
              <div className="relative">
                <button 
                  onClick={() => { setShowSpeedMenu(!showSpeedMenu); resetControlsTimer(); }}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-white/5 flex items-center gap-1 text-[10px] font-bold active:scale-95"
                  aria-label="Playback Speed"
                >
                  <FiSettings className="h-4.5 w-4.5 animate-spin-hover" />
                  <span>{playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-11 right-0 z-40 bg-[#12131a]/95 border border-white/5 rounded-xl py-2 px-1 shadow-2xl min-w-[100px] max-h-[220px] overflow-y-auto flex flex-col gap-0.5 backdrop-blur-xl">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest text-center py-1 border-b border-white/5 mb-1">Speed</p>
                    {speeds.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`w-full text-left py-1.5 px-4.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer
                          ${playbackRate === rate ? "bg-[#e50914] text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button 
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-white/5 active:scale-95"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <FiMinimize className="h-5 w-5" /> : <FiMaximize className="h-5 w-5" />}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
