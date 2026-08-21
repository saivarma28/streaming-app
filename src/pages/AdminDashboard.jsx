import React, { useState, useEffect } from "react";
import { 
  FiPlus, FiEdit, FiTrash2, FiVideo, FiUpload, FiFolderPlus, 
  FiToggleLeft, FiToggleRight, FiLoader, FiAlertCircle, 
  FiGrid, FiUsers, FiClock, FiSettings, FiLogOut, FiMenu, FiX, 
  FiSearch, FiBell, FiEye, FiTv, FiInfo, FiActivity, FiCheckCircle
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import {
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
  createGenre,
  getAllUsers,
  getAllWatchHistories
} from "../services/apiService";

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();

  // Navigation & General States
  const [viewMode, setViewMode] = useState("dashboard"); // "dashboard" | "catalog" | "genres" | "users" | "watchHistory" | "settings" | "add" | "edit"
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data Lists
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [users, setUsers] = useState([]);
  const [watchHistories, setWatchHistories] = useState([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "published" | "draft"

  // Movie Form State
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
    selectedGenreIds: []
  });
  const [videoFile, setVideoFile] = useState(null);
  const [editingMovieId, setEditingMovieId] = useState(null);

  // Preview Modal Movie
  const [previewMovie, setPreviewMovie] = useState(null);

  // Genre Form State
  const [newGenreName, setNewGenreName] = useState("");

  // Load All Dashboard Data
  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      setLoading(true);
      setError("");
      
      let token;
      try {
        token = await currentUser.getIdToken();
      } catch (tokenErr) {
        console.error("Failed to fetch ID token:", tokenErr);
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      // Load movies
      try {
        const moviesData = await getMovies(token, null, true);
        setMovies(moviesData.movies || []);
      } catch (err) {
        console.error("Dashboard failed to retrieve movies:", err);
      }

      // Load genres
      try {
        const genresData = await getGenres(token);
        setGenres(genresData.genres || []);
      } catch (err) {
        console.error("Dashboard failed to retrieve genres:", err);
      }

      // Load users
      try {
        const usersData = await getAllUsers(token);
        setUsers(usersData.users || []);
      } catch (err) {
        console.error("Dashboard failed to retrieve users directory:", err);
        setError("Note: Directory access restricted or limited.");
      }

      // Load watch histories
      try {
        const watchHistoryData = await getAllWatchHistories(token);
        setWatchHistories(watchHistoryData.history || []);
      } catch (err) {
        console.error("Dashboard failed to retrieve watch histories:", err);
      }

      setLoading(false);
    }

    loadData();
  }, [currentUser, viewMode]);

  const refreshMovies = async () => {
    try {
      const token = await currentUser.getIdToken();
      const data = await getMovies(token, null, true);
      setMovies(data.movies || []);
    } catch (e) {
      console.error("Failed to refresh movie list:", e);
    }
  };

  const resetMovieForm = () => {
    setMovieForm({
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
      selectedGenreIds: []
    });
    setVideoFile(null);
    setEditingMovieId(null);
  };

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

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
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

      if (videoFile) {
        formData.append("video", videoFile);
      }

      if (viewMode === "add") {
        await createMovie(token, formData);
        setSuccessMsg("Movie title saved successfully!");
      } else {
        await updateMovie(token, editingMovieId, formData);
        setSuccessMsg("Movie metadata updated successfully!");
      }

      resetMovieForm();
      setViewMode("catalog");
      await refreshMovies();
    } catch (err) {
      console.error(err);
      setError(err.message || "Operation failed. Review console errors.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePublish = async (movie) => {
    setError("");
    setSuccessMsg("");
    try {
      const token = await currentUser.getIdToken();
      const updatedStatus = !movie.isPublished;
      
      const formData = new FormData();
      formData.append("isPublished", updatedStatus);

      await updateMovie(token, movie.id, formData);
      setSuccessMsg(`"${movie.title}" status updated successfully.`);
      await refreshMovies();
    } catch (err) {
      console.error(err);
      setError("Failed to alter publish state.");
    }
  };

  const handleEditClick = (movie) => {
    setMovieForm({
      title: movie.title,
      description: movie.description,
      thumbnailUrl: movie.thumbnailUrl || "",
      backdropUrl: movie.backdropUrl || "",
      trailerUrl: movie.trailerUrl || "",
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

  const handleDeleteClick = async (movieId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setError("");
    setSuccessMsg("");
    setActionLoading(true);
    try {
      const token = await currentUser.getIdToken();
      await deleteMovie(token, movieId);
      setSuccessMsg(`"${title}" successfully deleted.`);
      await refreshMovies();
    } catch (err) {
      console.error(err);
      setError("Failed to delete movie.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenreSubmit = async (e) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    setError("");
    setSuccessMsg("");
    setActionLoading(true);
    try {
      const token = await currentUser.getIdToken();
      await createGenre(token, newGenreName);
      setSuccessMsg(`Genre "${newGenreName}" added.`);
      setNewGenreName("");
      const genresData = await getGenres(token);
      setGenres(genresData.genres || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create genre.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Filter movies
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          movie.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = !genreFilter || movie.genres.some(g => g.id === parseInt(genreFilter));
    
    let matchesStatus = true;
    if (statusFilter === "published") matchesStatus = movie.isPublished;
    if (statusFilter === "draft") matchesStatus = !movie.isPublished;

    return matchesSearch && matchesGenre && matchesStatus;
  });

  // Calculate stats
  const statMoviesCount = movies.length;
  const statPublishedCount = movies.filter(m => m.isPublished).length;
  const statDraftCount = movies.filter(m => !m.isPublished).length;
  const statUsersCount = users.length;
  const statGenresCount = genres.length;
  const statSessionsCount = watchHistories.length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col md:flex-row relative font-sans overflow-x-hidden">
      
      {/* ========================================== */}
      {/* 1. SIDEBAR (Collapsible/Fixed) */}
      {/* ========================================== */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen bg-[#11131e] border-r border-white/5 transition-all duration-300 z-45 shrink-0 flex flex-col justify-between ${
        sidebarOpen ? "w-64" : "w-0 md:w-20 overflow-hidden"
      }`}>
        {/* Sidebar Header */}
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-[#e50914] flex items-center justify-center font-black text-white text-lg tracking-tighter">S</div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">StreamApp</h1>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Admin Control</span>
                </div>
              )}
            </div>
            {/* Mobile close sidebar trigger */}
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => { setViewMode("dashboard"); resetMovieForm(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "dashboard" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <FiGrid className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Dashboard Overview</span>}
            </button>

            <button 
              onClick={() => { setViewMode("catalog"); resetMovieForm(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "catalog" || viewMode === "add" || viewMode === "edit" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <FiTv className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Movies Catalog</span>}
            </button>

            <button 
              onClick={() => { setViewMode("genres"); resetMovieForm(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "genres" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <FiFolderPlus className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Genres Listing</span>}
            </button>

            <button 
              onClick={() => { setViewMode("users"); resetMovieForm(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "users" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <FiUsers className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Users Directory</span>}
            </button>

            <button 
              onClick={() => { setViewMode("watchHistory"); resetMovieForm(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "watchHistory" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <FiClock className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Watch History Logs</span>}
            </button>

            <button 
              onClick={() => { setViewMode("settings"); resetMovieForm(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "settings" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <FiSettings className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Global Settings</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer"
          >
            <FiLogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN CONTAINER */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ========================================== */}
        {/* 2. TOP NAVBAR */}
        {/* ========================================== */}
        <header className="h-20 bg-[#11131e]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 flex items-center justify-between px-6 sm:px-8">
          {/* Left info */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white capitalize hidden sm:block">
              {viewMode === "watchHistory" ? "Watch History" : viewMode} Mode
            </h2>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Search Input Box */}
            <div className="relative max-w-xs hidden md:block">
              <FiSearch className="absolute left-3.5 top-3.5 text-gray-500 h-4.5 w-4.5" />
              <input
                type="text"
                placeholder="Search metrics..."
                className="w-60 bg-white/5 border border-white/5 focus:border-red-500/40 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none transition-all placeholder-gray-500"
              />
            </div>

            {/* Notification trigger */}
            <button className="relative p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer">
              <FiBell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#e50914]"></span>
            </button>

            {/* Profile widget */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white uppercase">{currentUser?.displayName || currentUser?.email || "Admin User"}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Admin Account</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#e50914] to-red-950 flex items-center justify-center border border-white/10 text-white font-bold select-none text-sm shadow-md">
                {currentUser?.email ? currentUser.email[0].toUpperCase() : "A"}
              </div>
            </div>
          </div>
        </header>

        {/* ========================================== */}
        {/* MAIN BODY WINDOW */}
        {/* ========================================== */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">

          {/* Notifications Alerts */}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
              <FiAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wide text-xs">Operation Failed</p>
                <p className="font-light mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-400">
              <FiCheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wide text-xs">Success Notice</p>
                <p className="font-light mt-0.5 leading-relaxed">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Loading status */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <FiLoader className="h-10 w-10 animate-spin text-[#e50914]" />
              <p className="text-gray-400 text-sm tracking-wider font-semibold animate-pulse">Syncing platform metrics...</p>
            </div>
          ) : (
            <>
              {/* ==================================================== */}
              {/* VIEW 1: DASHBOARD OVERVIEW */}
              {/* ==================================================== */}
              {viewMode === "dashboard" && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                    {/* Movies count */}
                    <div className="bg-[#11131e] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden">
                      <div className="absolute -right-2 -bottom-2 opacity-5 text-white group-hover:scale-110 transition-transform"><FiTv className="h-20 w-20" /></div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Titles</span>
                      <p className="text-3xl font-black text-white mt-4">{statMoviesCount}</p>
                    </div>

                    {/* Published count */}
                    <div className="bg-[#11131e] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden">
                      <div className="absolute -right-2 -bottom-2 opacity-5 text-white group-hover:scale-110 transition-transform"><FiCheckCircle className="h-20 w-20" /></div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Published</span>
                      <p className="text-3xl font-black text-emerald-500 mt-4">{statPublishedCount}</p>
                    </div>

                    {/* Draft count */}
                    <div className="bg-[#11131e] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden">
                      <div className="absolute -right-2 -bottom-2 opacity-5 text-white group-hover:scale-110 transition-transform"><FiToggleLeft className="h-20 w-20" /></div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Drafts</span>
                      <p className="text-3xl font-black text-amber-500 mt-4">{statDraftCount}</p>
                    </div>

                    {/* Users count */}
                    <div className="bg-[#11131e] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden">
                      <div className="absolute -right-2 -bottom-2 opacity-5 text-white group-hover:scale-110 transition-transform"><FiUsers className="h-20 w-20" /></div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Users</span>
                      <p className="text-3xl font-black text-white mt-4">{statUsersCount}</p>
                    </div>

                    {/* Genres count */}
                    <div className="bg-[#11131e] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden">
                      <div className="absolute -right-2 -bottom-2 opacity-5 text-white group-hover:scale-110 transition-transform"><FiFolderPlus className="h-20 w-20" /></div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Genres</span>
                      <p className="text-3xl font-black text-white mt-4">{statGenresCount}</p>
                    </div>

                    {/* Watch sessions count */}
                    <div className="bg-[#11131e] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden">
                      <div className="absolute -right-2 -bottom-2 opacity-5 text-white group-hover:scale-110 transition-transform"><FiActivity className="h-20 w-20" /></div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sessions</span>
                      <p className="text-3xl font-black text-white mt-4">{statSessionsCount}</p>
                    </div>
                  </div>

                  {/* Overview layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Action center */}
                    <div className="lg:col-span-1 bg-[#11131e] border border-white/5 rounded-2xl p-6 space-y-6">
                      <div>
                        <h3 className="text-md font-bold uppercase tracking-wider text-white">Administrator Actions</h3>
                        <p className="text-gray-400 text-xs mt-1 font-light">Quick links to perform standard platform operations</p>
                      </div>
                      <div className="space-y-3">
                        <button 
                          onClick={() => setViewMode("add")}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all cursor-pointer text-sm shadow-md"
                        >
                          <FiPlus className="h-4 w-4" /> Add Movie Title
                        </button>
                        <button 
                          onClick={() => setViewMode("genres")}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-all cursor-pointer text-sm"
                        >
                          <FiFolderPlus className="h-4 w-4" /> Create Genre
                        </button>
                        <button 
                          onClick={() => setViewMode("catalog")}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-all cursor-pointer text-sm"
                        >
                          <FiTv className="h-4 w-4" /> Browse Catalog
                        </button>
                      </div>
                    </div>

                    {/* Recent Watch History logs */}
                    <div className="lg:col-span-2 bg-[#11131e] border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-md font-bold uppercase tracking-wider text-white">Recent Watch Sessions</h3>
                          <p className="text-gray-400 text-xs mt-1 font-light">Latest user viewing activity in real time</p>
                        </div>
                        <button 
                          onClick={() => setViewMode("watchHistory")} 
                          className="text-xs text-red-500 hover:underline font-bold uppercase tracking-wider cursor-pointer"
                        >
                          View Logs
                        </button>
                      </div>

                      <div className="space-y-4">
                        {watchHistories.length === 0 ? (
                          <div className="py-12 text-center text-gray-500 text-xs font-light">
                            No active watch logs found. Activity appears as users play video streams.
                          </div>
                        ) : (
                          watchHistories.slice(0, 4).map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs uppercase">
                                  {log.user?.name ? log.user.name[0] : "U"}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">{log.user?.name || log.user?.email || "Unknown User"}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">Watched <span className="text-white font-semibold">{log.movie?.title}</span></p>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                log.completed 
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                  : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                              }`}>
                                {log.completed ? "Finished" : "Watching"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* VIEW 2: MOVIES CATALOG TABLE */}
              {/* ==================================================== */}
              {viewMode === "catalog" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Actions Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-md font-bold uppercase tracking-wider text-white">Movie Collection</h3>
                      <p className="text-gray-400 text-xs mt-1 font-light">Browse, modify, or remove title records from the catalog</p>
                    </div>
                    <button 
                      onClick={() => setViewMode("add")}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      <FiPlus className="h-4 w-4" /> Add Movie Title
                    </button>
                  </div>

                  {/* Filters Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#11131e] border border-white/5 p-4 rounded-2xl">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-3 text-gray-500 h-4 w-4" />
                      <input 
                        type="text" 
                        placeholder="Search title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 focus:border-red-500/40 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none transition-all placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <select
                        value={genreFilter}
                        onChange={(e) => setGenreFilter(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 focus:border-red-500/40 rounded-xl px-4 py-2.5 text-xs text-gray-300 outline-none select-dark"
                      >
                        <option value="">All Genres</option>
                        {genres.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 focus:border-red-500/40 rounded-xl px-4 py-2.5 text-xs text-gray-300 outline-none select-dark"
                      >
                        <option value="">All Statuses</option>
                        <option value="published">Published Only</option>
                        <option value="draft">Drafts Only</option>
                      </select>
                    </div>
                    <div>
                      <button 
                        onClick={() => { setSearchQuery(""); setGenreFilter(""); setStatusFilter(""); }}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl border border-white/5 text-gray-300 transition-all cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>

                  {/* Table Box */}
                  <div className="bg-[#11131e] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                            <th className="py-4 px-6">Movie Metadata</th>
                            <th className="py-4 px-6 text-center">Release Year</th>
                            <th className="py-4 px-6 text-center">Runtime</th>
                            <th className="py-4 px-6 text-center">Catalog Type</th>
                            <th className="py-4 px-6 text-center">Publication Status</th>
                            <th className="py-4 px-6 text-center">Transcoding</th>
                            <th className="py-4 px-6 text-right">Controls</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium text-gray-200">
                          {filteredMovies.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-16 text-center text-gray-500 font-light text-sm">
                                No movies matched your selected filters. Create or update titles to fill catalog list.
                              </td>
                            </tr>
                          ) : (
                            filteredMovies.map((movie) => (
                              <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-4">
                                    <div className="h-14 w-10 shrink-0 rounded-lg bg-gray-900 border border-white/10 overflow-hidden shadow">
                                      {movie.thumbnailUrl && (
                                        <img src={movie.thumbnailUrl} alt={movie.title} className="h-full w-full object-cover" />
                                      )}
                                    </div>
                                    <div className="text-left">
                                      <h4 className="text-white font-bold text-sm uppercase">{movie.title}</h4>
                                      <p className="text-[10px] text-gray-400 font-light line-clamp-1 mt-0.5 max-w-sm">{movie.description}</p>
                                      <div className="flex gap-1.5 mt-2">
                                        {movie.genres.map(g => (
                                          <span key={g.id} className="text-[8px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">{g.name}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-center text-sm font-semibold">{movie.releaseYear}</td>
                                <td className="py-4 px-6 text-center text-sm font-semibold">{movie.duration}m</td>
                                <td className="py-4 px-6 text-center">
                                  {movie.isPremium ? (
                                    <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">Premium</span>
                                  ) : (
                                    <span className="text-[9px] font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">Free Mode</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <button
                                    onClick={() => handleTogglePublish(movie)}
                                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {movie.isPublished ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20"><FiToggleRight className="h-4 w-4" /> Published</span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20"><FiToggleLeft className="h-4 w-4" /> Draft Mode</span>
                                    )}
                                  </button>
                                </td>
                                <td className="py-4 px-6 text-center text-[9px] font-bold uppercase">
                                  {movie.transcodingStatus === "READY" && (
                                    <span className="inline-flex bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">Ready</span>
                                  )}
                                  {movie.transcodingStatus === "PROCESSING" && (
                                    <span className="inline-flex bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">Processing</span>
                                  )}
                                  {movie.transcodingStatus === "UPLOADING" && (
                                    <span className="inline-flex bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded border border-indigo-500/20">Uploading</span>
                                  )}
                                  {movie.transcodingStatus === "FAILED" && (
                                    <span className="inline-flex bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20">Failed</span>
                                  )}
                                  {!movie.transcodingStatus && (
                                    <span className="inline-flex bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded border border-white/5">No Video</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      onClick={() => setPreviewMovie(movie)}
                                      title="Preview Details"
                                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white border border-white/5 transition-all cursor-pointer"
                                    >
                                      <FiEye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(movie)}
                                      title="Edit Details"
                                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white border border-white/5 transition-all cursor-pointer"
                                    >
                                      <FiEdit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(movie.id, movie.title)}
                                      disabled={actionLoading}
                                      title="Delete Movie"
                                      className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 border border-red-500/10 transition-all cursor-pointer"
                                    >
                                      <FiTrash2 className="h-4 w-4" />
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
                </div>
              )}

              {/* ==================================================== */}
              {/* VIEW 3: ADD / EDIT MOVIE FORM */}
              {/* ==================================================== */}
              {(viewMode === "add" || viewMode === "edit") && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setViewMode("catalog"); resetMovieForm(); }}
                      className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                    >
                      Back to Catalog
                    </button>
                    <h3 className="text-md font-bold uppercase tracking-wider text-white">
                      {viewMode === "add" ? "Create Movie Title" : "Edit Movie Metadata"}
                    </h3>
                  </div>

                  <form onSubmit={handleMovieSubmit} className="bg-[#11131e] rounded-2xl border border-white/5 p-6 sm:p-8 shadow-2xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      {/* Title */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Movie Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Guardians of the Galaxy"
                          value={movieForm.title}
                          onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                          className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>

                      {/* Release Year */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Release Year</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 2014"
                          value={movieForm.releaseYear}
                          onChange={(e) => setMovieForm({ ...movieForm, releaseYear: e.target.value })}
                          className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>

                      {/* Thumbnail Url */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Poster Thumbnail URL</label>
                        <input
                          type="url"
                          placeholder="https://image.com/poster.jpg"
                          value={movieForm.thumbnailUrl}
                          onChange={(e) => setMovieForm({ ...movieForm, thumbnailUrl: e.target.value })}
                          className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>

                      {/* Backdrop Url */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Backdrop Cover URL</label>
                        <input
                          type="url"
                          placeholder="https://image.com/cover.jpg"
                          value={movieForm.backdropUrl}
                          onChange={(e) => setMovieForm({ ...movieForm, backdropUrl: e.target.value })}
                          className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>

                      {/* Trailer Url */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Trailer URL (Optional)</label>
                        <input
                          type="url"
                          placeholder="https://youtube.com/watch?v=..."
                          value={movieForm.trailerUrl}
                          onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                          className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Duration (Minutes)</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 121"
                          value={movieForm.duration}
                          onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                          className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>

                      {/* Maturity Rating */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Maturity Rating</label>
                        <select
                          value={movieForm.maturityRating}
                          onChange={(e) => setMovieForm({ ...movieForm, maturityRating: e.target.value })}
                          className="w-full rounded-xl border border-white/5 bg-[#11131e] py-3 px-4 text-xs text-white focus:border-red-500/40 focus:bg-white/10 outline-none select-dark transition-all"
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
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Language</label>
                        <input
                          type="text"
                          placeholder="e.g. English"
                          value={movieForm.language}
                          onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                          className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-left">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Synopsis / Description</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detail movie summary and key cast members..."
                        value={movieForm.description}
                        onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                        className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none transition-all"
                      ></textarea>
                    </div>

                    {/* Genres multiselect */}
                    <div className="text-left">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select Genres</label>
                      <div className="flex flex-wrap gap-3 bg-[#0d0e12] border border-white/5 p-4 rounded-xl">
                        {genres.map(genre => (
                          <label key={genre.id} className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={movieForm.selectedGenreIds.includes(genre.id)}
                              onChange={() => handleGenreCheckboxChange(genre.id)}
                              className="rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500 h-4 w-4"
                            />
                            <span>{genre.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="flex flex-wrap gap-8 items-center border-t border-white/5 pt-6 text-left">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={movieForm.isPremium}
                          onChange={(e) => setMovieForm({ ...movieForm, isPremium: e.target.checked })}
                          className="rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500 h-4.5 w-4.5"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">Premium Mode</p>
                          <p className="text-[10px] text-gray-500 font-light">Restrict viewing to premium tier accounts</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={movieForm.isPublished}
                          onChange={(e) => setMovieForm({ ...movieForm, isPublished: e.target.checked })}
                          className="rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500 h-4.5 w-4.5"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">Publish Immediately</p>
                          <p className="text-[10px] text-gray-500 font-light">Publish immediately to catalogs</p>
                        </div>
                      </label>
                    </div>

                    {/* Custom Video File upload area */}
                    <div className="border-t border-white/5 pt-6 text-left">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Video File (GCP Storage preparation)</label>
                      
                      {videoFile ? (
                        <div className="flex items-center justify-between p-4 bg-[#0d0e12] border border-white/5 rounded-xl">
                          <div className="flex items-center gap-3">
                            <FiVideo className="h-6 w-6 text-red-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-white truncate max-w-sm">{videoFile.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setVideoFile(null)}
                            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-6 bg-[#0d0e12]/60 hover:bg-white/5 transition-colors relative cursor-pointer group">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setVideoFile(e.target.files[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="text-center">
                            <FiUpload className="h-8 w-8 text-gray-500 mx-auto group-hover:text-red-500 transition-colors" />
                            <p className="text-xs font-bold text-gray-300 mt-2">Choose video file (MP4, MKV, WebM)</p>
                            <p className="text-[9px] text-gray-500 mt-1 font-light">Max size: 100MB for direct uploads</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3.5 border-t border-white/5 pt-6">
                      <button
                        type="button"
                        onClick={() => { setViewMode("catalog"); resetMovieForm(); }}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-600 rounded-xl text-xs font-bold text-white shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {actionLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiCheckCircle className="h-4 w-4" />}
                        {viewMode === "add" ? "Save Movie" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ==================================================== */}
              {/* VIEW 4: GENRES MANAGEMENT */}
              {/* ==================================================== */}
              {viewMode === "genres" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                  {/* Left form */}
                  <div className="bg-[#11131e] rounded-2xl border border-white/5 p-6 shadow-2xl h-fit text-left">
                    <h3 className="text-md font-bold uppercase tracking-wider text-white mb-4">Add Genre</h3>
                    <form onSubmit={handleGenreSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Genre Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sci-Fi"
                          value={newGenreName}
                          onChange={(e) => setNewGenreName(e.target.value)}
                          className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-xs text-white placeholder-gray-500 focus:border-red-500/40 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer text-xs"
                      >
                        {actionLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiFolderPlus className="h-4 w-4" />}
                        Save Genre
                      </button>
                    </form>
                  </div>

                  {/* Right listing */}
                  <div className="lg:col-span-2 bg-[#11131e] rounded-2xl border border-white/5 p-6 shadow-2xl text-left">
                    <h3 className="text-md font-bold uppercase tracking-wider text-white mb-4">Genre Directory</h3>
                    
                    {genres.length === 0 ? (
                      <div className="py-16 text-center text-gray-500 text-xs font-light">
                        No genres defined. Use input form to create one.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {genres.map(genre => {
                          const movieCount = movies.filter(m => m.genres.some(g => g.id === genre.id)).length;
                          return (
                            <div key={genre.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-white uppercase">{genre.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{movieCount} Titles Linked</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* VIEW 5: USERS DIRECTORY */}
              {/* ==================================================== */}
              {viewMode === "users" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="text-md font-bold uppercase tracking-wider text-white">Registered Users</h3>
                    <p className="text-gray-400 text-xs mt-1 font-light">Manage catalog user database and verify registration details</p>
                  </div>

                  <div className="bg-[#11131e] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                            <th className="py-4 px-6">User Profile</th>
                            <th className="py-4 px-6">Email Address</th>
                            <th className="py-4 px-6 text-center">Auth Role</th>
                            <th className="py-4 px-6 text-center">Verification</th>
                            <th className="py-4 px-6 text-right">Created Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium text-gray-200">
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-16 text-center text-gray-500 font-light text-sm">
                                No registered user records found.
                              </td>
                            </tr>
                          ) : (
                            users.map((user) => (
                              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 font-bold uppercase">
                                      {user.name ? user.name[0] : "U"}
                                    </div>
                                    <span className="text-white font-bold">{user.name || "User Account"}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-mono text-gray-300">{user.email}</td>
                                <td className="py-4 px-6 text-center">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                    user.role === "admin" 
                                      ? "bg-red-500/10 text-red-500 border-red-500/20" 
                                      : "bg-white/5 text-gray-400 border-white/5"
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  {user.isEmailVerified ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">Verified</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">Unverified</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-right text-gray-400 font-light">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* VIEW 6: WATCH HISTORY LOGS */}
              {/* ==================================================== */}
              {viewMode === "watchHistory" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="text-md font-bold uppercase tracking-wider text-white">Playback Logs</h3>
                    <p className="text-gray-400 text-xs mt-1 font-light">System-wide viewing records and stream completion percentages</p>
                  </div>

                  <div className="bg-[#11131e] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                            <th className="py-4 px-6">User Account</th>
                            <th className="py-4 px-6">Movie Title</th>
                            <th className="py-4 px-6 text-center">Progress Percentage</th>
                            <th className="py-4 px-6 text-center">Status</th>
                            <th className="py-4 px-6 text-right">Last Watched</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium text-gray-200">
                          {watchHistories.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-16 text-center text-gray-500 font-light text-sm">
                                No playback sessions logged. Activity lists after users stream movies.
                              </td>
                            </tr>
                          ) : (
                            watchHistories.map((log) => {
                              const progressPct = log.movie?.duration 
                                ? Math.min(Math.round((log.progress / (log.movie.duration * 60)) * 100), 100) 
                                : 0;
                              return (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-4 px-6">
                                    <div>
                                      <p className="text-white font-bold">{log.user?.name || "Unknown User"}</p>
                                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{log.user?.email}</p>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 font-bold text-white uppercase">{log.movie?.title || "Unknown Title"}</td>
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-3 justify-center">
                                      <div className="w-24 bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5 shrink-0">
                                        <div className="bg-[#e50914] h-full" style={{ width: `${progressPct}%` }}></div>
                                      </div>
                                      <span className="font-mono text-gray-300 font-bold">{progressPct}%</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    {log.completed ? (
                                      <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">Completed</span>
                                    ) : (
                                      <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">Active</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-6 text-right text-gray-400 font-light">
                                    {new Date(log.lastWatchedAt).toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* VIEW 7: GLOBAL SETTINGS PANEL */}
              {/* ==================================================== */}
              {viewMode === "settings" && (
                <div className="max-w-2xl mx-auto bg-[#11131e] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 text-left animate-fadeIn">
                  <div>
                    <h3 className="text-md font-bold uppercase tracking-wider text-white">System Settings</h3>
                    <p className="text-gray-400 text-xs mt-1 font-light">Manage platform controls, system metadata, and parameters</p>
                  </div>
                  
                  <div className="space-y-4 divide-y divide-white/5">
                    <div className="py-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-white">Database Integration</p>
                        <p className="text-[10px] text-gray-400 font-light mt-0.5">PostgreSQL + Prisma database connectivity status</p>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">Connected</span>
                    </div>

                    <div className="py-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-white">User Authentication</p>
                        <p className="text-[10px] text-gray-400 font-light mt-0.5">Firebase User SDK verification layer</p>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">Enabled</span>
                    </div>

                    <div className="py-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-white">Video CDN Storage</p>
                        <p className="text-[10px] text-gray-400 font-light mt-0.5">Google Cloud Storage bucket configurations</p>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">Setup Pending</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ==================================================== */}
      {/* 9. MOVIE DETAILS PREVIEW MODAL */}
      {/* ==================================================== */}
      {previewMovie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#11131e] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Backdrop header */}
            <div className="h-48 relative overflow-hidden bg-gray-950">
              {previewMovie.backdropUrl ? (
                <img src={previewMovie.backdropUrl} alt={previewMovie.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-tr from-red-950 to-gray-950 flex items-center justify-center text-xs text-gray-500 font-bold uppercase tracking-wider">No Backdrop Banner</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#11131e] to-transparent"></div>
              <button 
                onClick={() => setPreviewMovie(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 space-y-6 text-left">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-red-500">Previewing Details</span>
                <h3 className="text-2xl font-black text-white uppercase mt-1">{previewMovie.title}</h3>
                
                <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 font-bold uppercase mt-3 items-center">
                  <span>{previewMovie.releaseYear}</span>
                  <span>{previewMovie.duration} Mins</span>
                  {previewMovie.maturityRating && (
                    <span className="px-1.5 py-0.5 border border-white/10 rounded">{previewMovie.maturityRating}</span>
                  )}
                  {previewMovie.isPremium ? (
                    <span className="text-amber-500">Premium Tier</span>
                  ) : (
                    <span className="text-green-500">Free Tier</span>
                  )}
                </div>
              </div>

              <p className="text-gray-300 text-xs font-light leading-relaxed">{previewMovie.description}</p>

              {/* Genre badges */}
              {previewMovie.genres?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {previewMovie.genres.map(g => (
                      <span key={g.id} className="text-[10px] bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-lg text-gray-300 font-semibold">{g.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Status Box */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-500">
                <FiInfo className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wide text-[10px]">Video Upload Status</p>
                  <p className="font-light mt-0.5">Video upload integration pending. (GCP Storage & Transcoder configuration required)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
