import React, { useState, useEffect, useRef } from "react";
import heroBannerFallback from "../assets/hero_banner.png";

/**
 * Reusable image component that optimizes loading performance:
 * - Employs HTML5 lazy loading (loading="lazy").
 * - Displays a sleek loading skeleton state during image retrieval.
 * - Animates loaded image with a smooth fade-in effect.
 * - Safely handles image load errors using a fallback image.
 * - Automatically supports responsive sizing.
 * - Prevents infinite loading loops and handles cached images.
 */
export default function OptimizedImage({
  src,
  alt = "Image",
  className = "",
  fallback = heroBannerFallback,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [loaded, setLoaded] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const imgElementRef = useRef(null);
  const timeoutRef = useRef(null);

  // Sync state if src changes
  useEffect(() => {
    setLoaded(false);
    setErrorCount(0);

    if (!src) {
      setImgSrc(fallback);
      setLoaded(true);
      return;
    }

    setImgSrc(src);
  }, [src]);

  // Set timeout and check complete state
  useEffect(() => {
    if (imgSrc === fallback && src) {
      // If we are currently showing the fallback but a valid src is present, we shouldn't block
      return;
    }

    // Check complete state immediately
    if (imgElementRef.current && imgElementRef.current.complete) {
      setLoaded(true);
      return;
    }

    // Interval to actively check if the image has completed loading (handles fast cached loads)
    const checkInterval = setInterval(() => {
      if (imgElementRef.current && imgElementRef.current.complete) {
        setLoaded(true);
        clearInterval(checkInterval);
      }
    }, 100);

    // Timeout of 5 seconds to prevent infinite spinning
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      clearInterval(checkInterval);
      if (!loaded && imgElementRef.current && !imgElementRef.current.complete) {
        console.warn(`Image loading timed out for: ${imgSrc}`);
        handleError();
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [imgSrc]);

  const handleError = () => {
    if (fallback && imgSrc !== fallback && errorCount < 2) {
      setErrorCount((prev) => prev + 1);
      setImgSrc(fallback);
      setLoaded(true); // Stop spinner
    } else {
      setLoaded(true); // Stop spinner even if fallback fails
    }
  };

  const handleLoad = () => {
    setLoaded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Ref callback to check complete state immediately when node is attached
  const setRef = (el) => {
    imgElementRef.current = el;
    if (el && el.complete && !loaded) {
      // Set state asynchronously to avoid React warnings during render phase
      setTimeout(() => {
        setLoaded(true);
      }, 0);
    }
  };

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {/* Loading Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-transparent animate-spin"></div>
        </div>
      )}

      <img
        ref={setRef}
        src={imgSrc}
        alt={alt}
        loading="lazy"
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-all duration-700 ease-out ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        }`}
        {...props}
      />
    </div>
  );
}
