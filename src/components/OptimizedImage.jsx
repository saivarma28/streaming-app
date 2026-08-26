import React, { useState, useEffect } from "react";
import heroBannerFallback from "../assets/hero_banner.png";

/**
 * Reusable image component that optimizes loading performance:
 * - Employs HTML5 lazy loading (loading="lazy").
 * - Displays a sleek loading skeleton state during image retrieval.
 * - Animates loaded image with a smooth fade-in effect.
 * - Safely handles image load errors using a fallback image.
 * - Automatically supports responsive sizing.
 */
export default function OptimizedImage({
  src,
  alt = "Image",
  className = "",
  fallback = heroBannerFallback,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setLoaded(false);
  }, [src]);

  const handleError = () => {
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {/* Loading Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-transparent animate-spin"></div>
        </div>
      )}
      
      <img
        src={imgSrc || fallback}
        alt={alt}
        loading="lazy"
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover transition-all duration-700 ease-out ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        }`}
        {...props}
      />
    </div>
  );
}
