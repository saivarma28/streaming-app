import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
  FiUpload, FiChevronLeft, FiLoader, FiAlertCircle 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { 
  getMovieById, createMovie, updateMovie, getGenres, getMoviePresignedUrl 
} from "../../services/apiService";

export default function AdminMovieForm() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // populated if editing
  const isEditMode = !!id;

  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    backdropUrl: "",
    trailerUrl: "",
    duration: "120",
    releaseYear: new Date().getFullYear().toString(),
    maturityRating: "PG-13",
    language: "English",
    isPremium: false,
    isPublished: false,
    selectedGenreIds: [],
    tmdbId: ""
  });
  const [videoFile, setVideoFile] = useState(null);
  const [videoSourceType, setVideoSourceType] = useState("file");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(""); // "", "uploading", "success", "failed"
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");

  useEffect(() => {
    async function loadFormContext() {
      if (!currentUser) return;
      setLoading(true);
      setError("");

      try {
        const token = await currentUser.getIdToken();
        const genresData = await getGenres(token);
        setGenres(genresData.genres || []);

        if (isEditMode) {
          const movieData = await getMovieById(token, id);
          const m = movieData.movie;
          if (m) {
            setMovieForm({
              title: m.title || "",
              description: m.description || "",
              thumbnailUrl: m.thumbnailUrl || "",
              backdropUrl: m.backdropUrl || "",
              trailerUrl: m.trailerUrl || "",
              duration: String(m.duration || "120"),
              releaseYear: String(m.releaseYear || new Date().getFullYear()),
              maturityRating: m.maturityRating || "PG-13",
              language: m.language || "English",
              isPremium: !!m.isPremium,
              isPublished: !!m.isPublished,
              selectedGenreIds: m.genreIds || [],
              tmdbId: m.tmdbId ? String(m.tmdbId) : ""
            });
            if (m.hlsUrl) {
              setVideoUrlInput(m.hlsUrl);
              setVideoSourceType("url");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load movie form data:", err.message);
        setError("Failed to fetch initial data for form context.");
      } finally {
        setLoading(false);
      }
    }

    loadFormContext();
  }, [id, currentUser, isEditMode]);

  const handleGenreCheckboxChange = (genreId) => {
    const isChecked = movieForm.selectedGenreIds.includes(genreId);
    if (isChecked) {
      setMovieForm({
        ...movieForm,
        selectedGenreIds: movieForm.selectedGenreIds.filter(gid => gid !== genreId)
      });
    } else {
      setMovieForm({
        ...movieForm,
        selectedGenreIds: [...movieForm.selectedGenreIds, genreId]
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file format (e.g., .mp4, .mkv, .mov).");
      return;
    }
    setVideoFile(file);
    setUploadStatus("");
    setUploadedVideoUrl("");
    setUploadProgress(0);
  };

  const handleDirectUpload = async () => {
    if (!videoFile) return;
    setError("");
    setUploadProgress(0);
    setUploadStatus("uploading");

    try {
      const token = await currentUser.getIdToken();
      // Get PUT presigned URL from backend
      const { uploadUrl, videoUrl } = await getMoviePresignedUrl(token, videoFile.name, videoFile.type);

      // Perform direct upload to Cloudflare R2 using XMLHttpRequest (required for upload progress)
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", videoFile.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadedVideoUrl(videoUrl);
          setUploadStatus("success");
        } else {
          setUploadStatus("failed");
          setError(`Direct upload failed with status code ${xhr.status}.`);
        }
      };

      xhr.onerror = () => {
        setUploadStatus("failed");
        setError("Network error occurred during video file upload.");
      };

      xhr.send(videoFile);
    } catch (err) {
      console.error("Direct upload initialization failed:", err);
      setUploadStatus("failed");
      setError(err.message || "Failed to initialize video upload.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setActionLoading(true);

    try {
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append("title", movieForm.title);
      formData.append("description", movieForm.description);
      formData.append("thumbnailUrl", movieForm.thumbnailUrl);
      formData.append("backdropUrl", movieForm.backdropUrl);
      formData.append("trailerUrl", movieForm.trailerUrl);
      formData.append("duration", movieForm.duration);
      formData.append("releaseYear", movieForm.releaseYear);
      formData.append("maturityRating", movieForm.maturityRating);
      formData.append("language", movieForm.language);
      formData.append("isPremium", movieForm.isPremium);
      formData.append("isPublished", movieForm.isPublished);
      formData.append("genreIds", JSON.stringify(movieForm.selectedGenreIds));
      if (movieForm.tmdbId) {
        formData.append("tmdbId", movieForm.tmdbId);
      }

      if (videoSourceType === "file") {
        if (uploadedVideoUrl) {
          formData.append("videoUrl", uploadedVideoUrl);
        } else if (videoFile) {
          setError("Please click the 'Upload Video' button to upload the selected file before saving.");
          setActionLoading(false);
          return;
        }
      } else {
        if (videoUrlInput) {
          formData.append("videoUrl", videoUrlInput);
        }
      }

      if (isEditMode) {
        await updateMovie(token, id, formData);
      } else {
        await createMovie(token, formData);
      }

      navigate("/admin/movies");
    } catch (err) {
      console.error("Error submitting movie form:", err.message);
      setError(err.message || "Failed to save movie details.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/admin/movies"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors mb-3"
        >
          <FiChevronLeft className="h-4 w-4" /> Back to Movies
        </Link>
        <h1 className="text-3xl font-black uppercase text-white">
          {isEditMode ? "Edit Movie Details" : "Add New Movie Title"}
        </h1>
        <p className="text-sm text-gray-400 font-light mt-1">
          {isEditMode ? "Modify existing metadata fields and replace streaming sources." : "Register a new streaming movie record in the system."}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <FiAlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleFormSubmit} className="space-y-6 bg-[#12131a] border border-white/5 p-6 rounded-2xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Movie Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Inception"
                value={movieForm.title}
                onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description / Synopsis</label>
              <textarea
                required
                rows="4"
                placeholder="Provide movie description plot details..."
                value={movieForm.description}
                onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Release Year</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2026"
                  value={movieForm.releaseYear}
                  onChange={(e) => setMovieForm({ ...movieForm, releaseYear: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Duration (mins)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 148"
                  value={movieForm.duration}
                  onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Maturity Rating</label>
                <select
                  value={movieForm.maturityRating}
                  onChange={(e) => setMovieForm({ ...movieForm, maturityRating: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#12131a] text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/5 transition-all font-semibold cursor-pointer"
                >
                  <option value="G">G</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                  <option value="18+">18+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Audio Language</label>
                <input
                  type="text"
                  placeholder="e.g. English"
                  value={movieForm.language}
                  onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Associated TMDB ID</label>
              <input
                type="number"
                placeholder="e.g. 27205 (Optional)"
                value={movieForm.tmdbId}
                onChange={(e) => setMovieForm({ ...movieForm, tmdbId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Right Column Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Poster Thumbnail URL</label>
              <input
                type="text"
                placeholder="https://image.tmdb.org/t/p/... or custom"
                value={movieForm.thumbnailUrl}
                onChange={(e) => setMovieForm({ ...movieForm, thumbnailUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Backdrop Banner URL</label>
              <input
                type="text"
                placeholder="https://image.tmdb.org/t/p/... or custom"
                value={movieForm.backdropUrl}
                onChange={(e) => setMovieForm({ ...movieForm, backdropUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Trailer URL (YouTube / Video)</label>
              <input
                type="text"
                placeholder="e.g. https://www.youtube.com/watch?v=..."
                value={movieForm.trailerUrl}
                onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>

            {/* Video Source Option */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                Video Source
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 select-none cursor-pointer">
                  <input
                    type="radio"
                    name="videoSourceType"
                    value="file"
                    checked={videoSourceType === "file"}
                    onChange={() => setVideoSourceType("file")}
                    className="text-red-600 focus:ring-0 focus:ring-offset-0 bg-white/5 border-white/10"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Upload Video File</span>
                </label>
                <label className="flex items-center gap-2 select-none cursor-pointer">
                  <input
                    type="radio"
                    name="videoSourceType"
                    value="url"
                    checked={videoSourceType === "url"}
                    onChange={() => setVideoSourceType("url")}
                    className="text-red-600 focus:ring-0 focus:ring-offset-0 bg-white/5 border-white/10"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Video URL</span>
                </label>
              </div>

              {videoSourceType === "file" ? (
                <div className="space-y-4">
                  <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 bg-white/2 hover:bg-white/5 transition-all text-center flex flex-col items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FiUpload className="h-8 w-8 text-[#e50914] mb-3" />
                    <p className="text-sm font-bold text-gray-300">
                      {videoFile ? videoFile.name : isEditMode ? "Click to upload a new video file replacement" : "Select video file"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Supports raw video formats (MP4, MKV, etc.) uploaded directly to R2.</p>
                  </div>

                  {videoFile && (
                    <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-xl border border-white/5 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-semibold truncate max-w-[200px]">Selected: {videoFile.name}</span>
                        {uploadStatus === "uploading" && (
                          <span className="text-red-500 font-bold animate-pulse">Uploading {uploadProgress}%</span>
                        )}
                        {uploadStatus === "success" && (
                          <span className="text-emerald-500 font-bold">✓ Video uploaded successfully</span>
                        )}
                        {uploadStatus === "failed" && (
                          <span className="text-red-500 font-bold">✗ Upload failed</span>
                        )}
                      </div>

                      {uploadStatus === "uploading" && (
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      )}

                      {uploadStatus !== "success" && (
                        <button
                          type="button"
                          disabled={uploadStatus === "uploading"}
                          onClick={handleDirectUpload}
                          className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          {uploadStatus === "uploading" ? "Uploading to Cloudflare R2..." : "Upload Video"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="e.g. https://my-bucket.r2.dev/movies/movie.mp4"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold animate-fadeIn"
                  />
                </div>
              )}
            </div>

            {/* Genres Multiple Choices checkboxes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Genres Selection</label>
              <div className="grid grid-cols-2 gap-3 max-h-36 overflow-y-auto border border-white/5 p-3 rounded-xl bg-[#0d0e12]">
                {genres.map(genre => (
                  <label key={genre.id} className="flex items-center gap-2 text-xs font-semibold text-gray-300 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={movieForm.selectedGenreIds.includes(genre.id)}
                      onChange={() => handleGenreCheckboxChange(genre.id)}
                      className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-white/5"
                    />
                    <span>{genre.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2.5 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={movieForm.isPremium}
                  onChange={(e) => setMovieForm({ ...movieForm, isPremium: e.target.checked })}
                  className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-white/5"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Premium Title</span>
              </label>

              <label className="flex items-center gap-2.5 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={movieForm.isPublished}
                  onChange={(e) => setMovieForm({ ...movieForm, isPublished: e.target.checked })}
                  className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-white/5"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Publish Immediately</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-white/5 flex justify-end gap-4">
          <Link
            to="/admin/movies"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={actionLoading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-[0_4px_15px_rgba(229,9,20,0.35)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <>
                <FiLoader className="h-4.5 w-4.5 animate-spin" />
                <span>Saving details...</span>
              </>
            ) : (
              <span>Save Movie</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
