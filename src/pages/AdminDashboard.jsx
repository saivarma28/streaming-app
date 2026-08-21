import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiVideo, FiUpload, FiFolderPlus, FiToggleLeft, FiToggleRight, FiLoader, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import {
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
  createGenre
} from "../services/apiService";

export default function AdminDashboard() {
  const { currentUser } = useAuth();

  // Catalog State
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Mode Selection: "catalog" | "genres" | "add" | "edit"
  const [viewMode, setViewMode] = useState("catalog");
  const [editingMovieId, setEditingMovieId] = useState(null);

  // Movie Form State
  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    backdropUrl: "",
    trailerUrl: "",
    videoStreamId: "",
    duration: "120",
    releaseYear: new Date().getFullYear().toString(),
    maturityRating: "PG-13",
    language: "English",
    isPremium: false,
    isPublished: false,
    selectedGenreIds: []
  });

  const [videoFile, setVideoFile] = useState(null);

  // Genre Form State
  const [newGenreName, setNewGenreName] = useState("");

  // Load Catalog Data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        
        // Fetch genres and all movies (including unpublished ones)
        const [moviesData, genresData] = await Promise.all([
          getMovies(token, null, true),
          getGenres(token)
        ]);

        setMovies(moviesData.movies || []);
        setGenres(genresData.genres || []);
      } catch (err) {
        console.error("Dashboard failed to load:", err);
        setError("Error loading admin dashboard catalog data. Check API.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [currentUser, viewMode]);

  const refreshMovies = async () => {
    try {
      const token = await currentUser.getIdToken();
      const data = await getMovies(token, null, true);
      setMovies(data.movies || []);
    } catch (e) {
      console.error(e);
    }
  };

  const resetMovieForm = () => {
    setMovieForm({
      title: "",
      description: "",
      thumbnailUrl: "",
      backdropUrl: "",
      trailerUrl: "",
      videoStreamId: "",
      duration: "120",
      releaseYear: new Date().getFullYear().toString(),
      maturityRating: "PG-13",
      language: "English",
      isPremium: false,
      isPublished: false,
      selectedGenreIds: []
    });
    setVideoFile(null);
    setEditingMovieId(null);
  };

  // Handle Genre selection changes
  const handleGenreCheckboxChange = (genreId) => {
    const isChecked = movieForm.selectedGenreIds.includes(genreId);
    if (isChecked) {
      setMovieForm({
        ...movieForm,
        selectedGenreIds: movieForm.selectedGenreIds.filter(id => id !== genreId)
      });
    } else {
      setMovieForm({
        ...movieForm,
        selectedGenreIds: [...movieForm.selectedGenreIds, genreId]
      });
    }
  };

  // Add Movie Submit
  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      const token = await currentUser.getIdToken();
      
      // Use FormData to support binary file upload parameters
      const formData = new FormData();
      formData.append("title", movieForm.title);
      formData.append("description", movieForm.description);
      formData.append("thumbnailUrl", movieForm.thumbnailUrl);
      formData.append("backdropUrl", movieForm.backdropUrl);
      formData.append("trailerUrl", movieForm.trailerUrl);
      formData.append("videoStreamId", movieForm.videoStreamId);
      formData.append("duration", movieForm.duration);
      formData.append("releaseYear", movieForm.releaseYear);
      formData.append("maturityRating", movieForm.maturityRating);
      formData.append("language", movieForm.language);
      formData.append("isPremium", movieForm.isPremium);
      formData.append("isPublished", movieForm.isPublished);
      
      // Send genre IDs as JSON string
      formData.append("genreIds", JSON.stringify(movieForm.selectedGenreIds));

      if (videoFile) {
        formData.append("video", videoFile);
      }

      if (viewMode === "add") {
        await createMovie(token, formData);
        setSuccessMsg("New movie created successfully!");
      } else {
        await updateMovie(token, editingMovieId, formData);
        setSuccessMsg("Movie details updated successfully!");
      }

      resetMovieForm();
      setViewMode("catalog");
      await refreshMovies();
    } catch (err) {
      console.error(err);
      setError(err.message || "Operation failed. Check configurations.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle publish status instantly
  const handleTogglePublish = async (movie) => {
    setError("");
    setSuccessMsg("");

    try {
      const token = await currentUser.getIdToken();
      const updatedStatus = !movie.isPublished;
      
      const formData = new FormData();
      formData.append("isPublished", updatedStatus);

      await updateMovie(token, movie.id, formData);
      setSuccessMsg(`"${movie.title}" is now ${updatedStatus ? "Published" : "Unpublished"}!`);
      await refreshMovies();
    } catch (err) {
      console.error(err);
      setError("Failed to change publish state.");
    }
  };

  // Trigger Edit Form
  const handleEditClick = (movie) => {
    setMovieForm({
      title: movie.title,
      description: movie.description,
      thumbnailUrl: movie.thumbnailUrl || "",
      backdropUrl: movie.backdropUrl || "",
      trailerUrl: movie.trailerUrl || "",
      videoStreamId: movie.videoStreamId || "",
      duration: movie.duration.toString(),
      releaseYear: movie.releaseYear.toString(),
      maturityRating: movie.maturityRating || "PG-13",
      language: movie.language || "English",
      isPremium: movie.isPremium,
      isPublished: movie.isPublished,
      selectedGenreIds: movie.genres.map(g => g.id)
    });
    setEditingMovieId(movie.id);
    setViewMode("edit");
  };

  // Delete Movie
  const handleDeleteClick = async (movieId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setError("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      const token = await currentUser.getIdToken();
      await deleteMovie(token, movieId);
      setSuccessMsg(`"${title}" deleted successfully.`);
      await refreshMovies();
    } catch (err) {
      console.error(err);
      setError("Failed to delete movie.");
    } finally {
      setActionLoading(false);
    }
  };

  // Add Genre Submit
  const handleGenreSubmit = async (e) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;

    setError("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      const token = await currentUser.getIdToken();
      await createGenre(token, newGenreName);
      setSuccessMsg(`Genre "${newGenreName}" created!`);
      setNewGenreName("");
      
      // Reload genres list
      const genresData = await getGenres(token);
      setGenres(genresData.genres || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create genre.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0e12]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0d0e12] pt-28 pb-20 text-white text-left px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider">Admin Dashboard</h1>
            <p className="text-gray-400 text-xs mt-1.5 font-light">Manage streaming media catalog, upload videos and control genres</p>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { setViewMode("catalog"); resetMovieForm(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "catalog" ? "bg-[#e50914] text-white" : "bg-white/5 hover:bg-white/10 text-gray-400"
              }`}
            >
              Movie Catalog
            </button>
            <button
              onClick={() => setViewMode("genres")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "genres" ? "bg-[#e50914] text-white" : "bg-white/5 hover:bg-white/10 text-gray-400"
              }`}
            >
              Manage Genres
            </button>
            <button
              onClick={() => { setViewMode("add"); resetMovieForm(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer"
            >
              <FiPlus className="h-4 w-4" /> Add Movie
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 max-w-4xl">
            <FiAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400 max-w-4xl">
            <FiLoader className="h-5 w-5 shrink-0 mt-0.5 animate-spin" />
            <span className="leading-relaxed font-semibold">{successMsg}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 1: MOVIE CATALOG LISTING */}
        {/* ==================================================== */}
        {viewMode === "catalog" && (
          <div className="bg-[#12131a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase text-xs tracking-wider">
                    <th className="py-4 px-6 font-bold">Movie Details</th>
                    <th className="py-4 px-6 font-bold text-center">Release Year</th>
                    <th className="py-4 px-6 font-bold text-center">Duration</th>
                    <th className="py-4 px-6 font-bold text-center">Type</th>
                    <th className="py-4 px-6 font-bold text-center">Published</th>
                    <th className="py-4 px-6 font-bold text-center">Cloudflare ID</th>
                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-gray-200">
                  {movies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 px-6 text-center text-gray-500 font-light text-base">
                        No titles available in catalog. Click "Add Movie" to insert the first item.
                      </td>
                    </tr>
                  ) : (
                    movies.map((movie) => (
                      <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-10 shrink-0 rounded-lg bg-gray-900 border border-white/10 overflow-hidden">
                              {movie.thumbnailUrl && (
                                <img src={movie.thumbnailUrl} alt={movie.title} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-white font-bold">{movie.title}</h4>
                              <p className="text-xs text-gray-400 font-light line-clamp-1 mt-0.5">{movie.description}</p>
                              <div className="flex gap-1.5 mt-1.5">
                                {movie.genres.map(g => (
                                  <span key={g.id} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/5">{g.name}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">{movie.releaseYear}</td>
                        <td className="py-4 px-6 text-center">{movie.duration}m</td>
                        <td className="py-4 px-6 text-center">
                          {movie.isPremium ? (
                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">Premium</span>
                          ) : (
                            <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">Free</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleTogglePublish(movie)}
                            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {movie.isPublished ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full border border-emerald-500/20"><FiToggleRight className="h-4.5 w-4.5" /> Published</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-500/10 text-red-500 px-2.5 py-0.5 rounded-full border border-red-500/20"><FiToggleLeft className="h-4.5 w-4.5" /> Draft</span>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-center text-xs font-mono text-gray-400 max-w-[120px] truncate">
                          {movie.videoStreamId ? (
                            <span className="bg-white/5 px-2 py-1 rounded select-all">{movie.videoStreamId}</span>
                          ) : (
                            <span className="text-gray-500 italic">None Linked</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(movie)}
                              title="Edit Details"
                              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white border border-white/5 transition-all cursor-pointer"
                            >
                              <FiEdit className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(movie.id, movie.title)}
                              disabled={actionLoading}
                              title="Delete Movie"
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 border border-red-500/10 transition-all cursor-pointer"
                            >
                              <FiTrash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: ADD / EDIT MOVIE FORM */}
        {/* ==================================================== */}
        {(viewMode === "add" || viewMode === "edit") && (
          <form onSubmit={handleMovieSubmit} className="bg-[#12131a] rounded-2xl border border-white/5 p-8 shadow-2xl space-y-6 max-w-4xl">
            <h2 className="text-xl font-bold uppercase tracking-wider text-white">
              {viewMode === "add" ? "Add New Movie Title" : "Edit Movie Details"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Movie Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inception"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
                />
              </div>

              {/* Release Year */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Release Year</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2010"
                  value={movieForm.releaseYear}
                  onChange={(e) => setMovieForm({ ...movieForm, releaseYear: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
                />
              </div>

              {/* Thumbnail Url */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Poster / Thumbnail Image URL</label>
                <input
                  type="url"
                  placeholder="https://image-host.com/poster.jpg"
                  value={movieForm.thumbnailUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, thumbnailUrl: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
                />
              </div>

              {/* Backdrop Url */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Backdrop Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://image-host.com/backdrop.jpg"
                  value={movieForm.backdropUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, backdropUrl: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
                />
              </div>

              {/* Trailer Url */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trailer Video Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={movieForm.trailerUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
                />
              </div>

              {/* Video Stream Id */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cloudflare Stream ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste direct CF UID or upload below"
                  value={movieForm.videoStreamId}
                  onChange={(e) => setMovieForm({ ...movieForm, videoStreamId: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 148"
                  value={movieForm.duration}
                  onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
                />
              </div>

              {/* Maturity Rating */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Maturity / Rating</label>
                <select
                  value={movieForm.maturityRating}
                  onChange={(e) => setMovieForm({ ...movieForm, maturityRating: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-[#12131a] py-3 px-4 text-sm text-white focus:border-red-500/40 focus:bg-white/10 outline-none w-full"
                >
                  <option value="G">G (General)</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R (Restricted)</option>
                  <option value="NC-17">NC-17</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Audio Language</label>
                <input
                  type="text"
                  placeholder="e.g. English"
                  value={movieForm.language}
                  onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Synopsis / Description</label>
              <textarea
                required
                rows={3}
                placeholder="Describe the movie plot..."
                value={movieForm.description}
                onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
              ></textarea>
            </div>

            {/* Genres Multiselect */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assign Genres</label>
              <div className="flex flex-wrap gap-3.5 bg-white/5 border border-white/5 p-4 rounded-xl">
                {genres.length === 0 ? (
                  <span className="text-gray-500 text-xs">No genres created yet. Set genres first.</span>
                ) : (
                  genres.map(genre => (
                    <label key={genre.id} className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={movieForm.selectedGenreIds.includes(genre.id)}
                        onChange={() => handleGenreCheckboxChange(genre.id)}
                        className="rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500 h-4 w-4"
                      />
                      <span>{genre.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Flags Row */}
            <div className="flex flex-wrap gap-8 items-center border-t border-white/5 pt-6">
              <label className="flex items-center gap-3.5 cursor-pointer text-sm font-semibold text-gray-300 select-none">
                <input
                  type="checkbox"
                  checked={movieForm.isPremium}
                  onChange={(e) => setMovieForm({ ...movieForm, isPremium: e.target.checked })}
                  className="rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500 h-4.5 w-4.5"
                />
                <div>
                  <p className="text-white">Premium Content</p>
                  <p className="text-xs text-gray-500 font-light mt-0.5">Restrict viewing to active premium subscribers</p>
                </div>
              </label>

              <label className="flex items-center gap-3.5 cursor-pointer text-sm font-semibold text-gray-300 select-none">
                <input
                  type="checkbox"
                  checked={movieForm.isPublished}
                  onChange={(e) => setMovieForm({ ...movieForm, isPublished: e.target.checked })}
                  className="rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500 h-4.5 w-4.5"
                />
                <div>
                  <p className="text-white">Publish Immediately</p>
                  <p className="text-xs text-gray-500 font-light mt-0.5">Make this title visible in the public catalog immediately</p>
                </div>
              </label>
            </div>

            {/* Video File Upload */}
            <div className="border-t border-white/5 pt-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Direct Video File Upload (Cloudflare Stream)</label>
              <div className="flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-6 bg-white/5 hover:bg-white/10 transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="text-center">
                  <FiUpload className="h-8 w-8 text-gray-400 mx-auto group-hover:text-red-500 transition-colors" />
                  <p className="text-sm font-semibold text-gray-300 mt-2">
                    {videoFile ? videoFile.name : "Click to select a video file or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-light">MP4, WebM, MOV (Max 100MB direct upload)</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3.5 border-t border-white/5 pt-6">
              <button
                type="button"
                onClick={() => { setViewMode("catalog"); resetMovieForm(); }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-600 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {actionLoading ? (
                  <FiLoader className="h-5 w-5 animate-spin" />
                ) : (
                  <FiVideo className="h-5 w-5" />
                )}
                {viewMode === "add" ? "Create Title" : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* VIEW 3: MANAGE GENRES */}
        {/* ==================================================== */}
        {viewMode === "genres" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Genre Form */}
            <div className="bg-[#12131a] rounded-2xl border border-white/5 p-6 shadow-2xl h-fit">
              <h3 className="text-lg font-bold uppercase tracking-wider text-white mb-4">Add Genre</h3>
              <form onSubmit={handleGenreSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Genre Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Comedy"
                    value={newGenreName}
                    onChange={(e) => setNewGenreName(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer text-sm"
                >
                  {actionLoading ? (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  ) : (
                    <FiFolderPlus className="h-4 w-4" />
                  )}
                  Save Genre
                </button>
              </form>
            </div>

            {/* List Genres */}
            <div className="lg:col-span-2 bg-[#12131a] rounded-2xl border border-white/5 p-6 shadow-2xl">
              <h3 className="text-lg font-bold uppercase tracking-wider text-white mb-4">Current Catalog Genres</h3>
              <div className="flex flex-wrap gap-3.5">
                {genres.length === 0 ? (
                  <span className="text-gray-500 text-sm font-light">No genres present in database. Use form to create.</span>
                ) : (
                  genres.map(genre => (
                    <span
                      key={genre.id}
                      className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm font-semibold text-gray-300"
                    >
                      {genre.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
