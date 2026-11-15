/**
 * Parses and extracts an 11-character YouTube video ID from various link structures.
 * 
 * @param {string} url - YouTube URL
 * @returns {string|null} - Extracted 11-character ID or null
 */
export function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Formats seconds into HH:MM:SS or MM:SS format.
 * 
 * @param {number} totalSeconds 
 * @returns {string} Formatted duration string
 */
export function formatDuration(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
