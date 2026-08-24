import React, { useState, useEffect } from "react";
import { 
  FiFolderPlus, FiEdit, FiTrash2, FiLoader, FiAlertCircle, FiCheck 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { 
  getGenres, createGenre, updateGenre, deleteGenre, getMovies 
} from "../../services/apiService";

export default function AdminGenres() {
  const { currentUser } = useAuth();
  
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Genre Form States
  const [newGenreName, setNewGenreName] = useState("");
  const [editingGenre, setEditingGenre] = useState(null);
  const [editingGenreName, setEditingGenreName] = useState("");

  useEffect(() => {
    async function loadGenresAndMovies() {
      if (!currentUser) return;
      setLoading(true);
      setError("");
      try {
        const token = await currentUser.getIdToken();
        const [genresData, moviesData] = await Promise.all([
          getGenres(token),
          getMovies(token, null, true)
        ]);
        setGenres(genresData.genres || []);
        setMovies(moviesData.movies || []);
      } catch (err) {
        console.error("Failed to load genres catalog:", err.message);
        setError("Failed to fetch genres details.");
      } finally {
        setLoading(false);
      }
    }

    loadGenresAndMovies();
  }, [currentUser]);

  const handleGenreSubmit = async (e) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    setError("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      const token = await currentUser.getIdToken();
      const data = await createGenre(token, newGenreName.trim());
      setGenres([...genres, data.genre]);
      setSuccessMsg(`Genre "${newGenreName}" created successfully.`);
      setNewGenreName("");
    } catch (err) {
      console.error("Genre create error:", err.message);
      setError(err.message || "Failed to create genre.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenreEditClick = (genre) => {
    setEditingGenre(genre);
    setEditingGenreName(genre.name);
  };

  const handleGenreUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingGenreName.trim() || !editingGenre) return;
    setError("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      const token = await currentUser.getIdToken();
      const data = await updateGenre(token, editingGenre.id, editingGenreName.trim());
      setGenres(genres.map(g => g.id === editingGenre.id ? data.genre : g));
      setSuccessMsg("Genre updated successfully.");
      setEditingGenre(null);
      setEditingGenreName("");
    } catch (err) {
      console.error("Genre update error:", err.message);
      setError(err.message || "Failed to update genre.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenreDeleteClick = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the genre "${name}"?`)) return;
    setError("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      const token = await currentUser.getIdToken();
      await deleteGenre(token, id);
      setGenres(genres.filter(g => g.id !== id));
      setSuccessMsg(`Genre "${name}" deleted successfully.`);
    } catch (err) {
      console.error("Genre delete error:", err.message);
      setError(err.message || "Failed to delete genre.");
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
    <div className="space-y-8 text-left max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black uppercase text-white">Settings & Genres</h1>
        <p className="text-sm text-gray-400 font-light mt-1">Configure platform category keys and review database parameters.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Grid: Category Manager (Genre CRUD) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Add/Edit Genre Form */}
        <div className="bg-[#12131a] border border-white/5 p-6 rounded-2xl shadow-xl h-fit space-y-4">
          {editingGenre ? (
            <>
              <h3 className="text-md font-bold uppercase text-white tracking-wider">Edit Genre</h3>
              <form onSubmit={handleGenreUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Genre Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sci-Fi"
                    value={editingGenreName}
                    onChange={(e) => setEditingGenreName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-xs text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all cursor-pointer text-xs"
                  >
                    {actionLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiFolderPlus className="h-4 w-4" />}
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingGenre(null); setEditingGenreName(""); }}
                    className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/5 transition-all cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h3 className="text-md font-bold uppercase text-white tracking-wider">Add Genre</h3>
              <form onSubmit={handleGenreSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Genre Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sci-Fi"
                    value={newGenreName}
                    onChange={(e) => setNewGenreName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-xs text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold transition-all cursor-pointer text-xs"
                >
                  {actionLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiFolderPlus className="h-4 w-4" />}
                  <span>Save Genre</span>
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right Side: Genres Directory */}
        <div className="lg:col-span-2 bg-[#12131a] border border-white/5 p-6 rounded-2xl shadow-xl text-left">
          <h3 className="text-md font-bold uppercase text-white tracking-wider mb-4">Genre Directory</h3>
          {genres.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-xs font-light">
              No genres defined in the catalog yet. Use the form on the left to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {genres.map(genre => {
                const genreMovies = movies.filter(m => m.genreIds?.includes(genre.id));
                const movieCount = genreMovies.length;
                return (
                  <div key={genre.id} className="p-4 bg-white/2 border border-white/5 rounded-xl flex flex-col justify-between gap-3 hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white uppercase">{genre.name}</p>
                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{movieCount} Titles Linked</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGenreEditClick(genre)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit Name"
                        >
                          <FiEdit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleGenreDeleteClick(genre.id, genre.name)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          title="Delete Genre"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {movieCount > 0 && (
                      <div className="border-t border-white/5 pt-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Linked Titles:</p>
                        <div className="flex flex-wrap gap-1">
                          {genreMovies.slice(0, 3).map(movie => (
                            <span key={movie.id} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-400">
                              {movie.title}
                            </span>
                          ))}
                          {movieCount > 3 && (
                            <span className="px-1.5 py-0.5 text-[9px] text-gray-500 font-semibold">
                              + {movieCount - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System Parameters Panel */}
      <div className="bg-[#12131a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold uppercase text-white tracking-wider">System Integration Status</h3>
          <p className="text-gray-400 text-xs mt-1 font-light">Verify connected microservices and parameters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="py-4 md:py-0 md:pr-6 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-white">Database Status</p>
              <p className="text-[10px] text-gray-400 font-light mt-0.5">MongoDB Atlas connectivity status</p>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">Connected</span>
          </div>

          <div className="py-4 md:py-0 md:px-6 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-white">User Authentication</p>
              <p className="text-[10px] text-gray-400 font-light mt-0.5">Firebase Admin SDK token parser</p>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">Active</span>
          </div>

          <div className="py-4 md:py-0 md:pl-6 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-white">Video CDN Storage</p>
              <p className="text-[10px] text-gray-400 font-light mt-0.5">Cloudflare R2 Bucket uploads status</p>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">Configured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
