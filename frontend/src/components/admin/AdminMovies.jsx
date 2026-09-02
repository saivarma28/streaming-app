import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiCheck, FiX, FiVideo 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getMovies, deleteMovie, getGenres } from "../../services/apiService";

export default function AdminMovies() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Deletion modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    async function loadMovies() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const token = await currentUser.getIdToken();
        const [moviesData, genresData] = await Promise.all([
          getMovies(token, null, true),
          getGenres(token)
        ]);
        setMovies(moviesData.movies || []);
        setGenres(genresData.genres || []);
      } catch (err) {
        console.error("Failed to load movies page catalog:", err.message);
        setError("Failed to fetch catalog titles.");
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, [currentUser]);

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setError("");
    setSuccessMsg("");
    try {
      const token = await currentUser.getIdToken();
      await deleteMovie(token, deleteTargetId);
      setMovies(movies.filter(m => m.id !== deleteTargetId));
      setSuccessMsg("Movie title deleted successfully.");
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Error deleting movie:", err.message);
      setError(err.message || "Failed to delete movie.");
    }
  };

  // Filtering Logic
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = searchQuery.trim() === "" ||
      movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre = selectedGenre === "" ||
      movie.genreIds?.includes(parseInt(selectedGenre));

    const matchesStatus = statusFilter === "" ||
      (statusFilter === "published" && movie.isPublished) ||
      (statusFilter === "draft" && !movie.isPublished);

    return matchesSearch && matchesGenre && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-white">Movies Catalog</h1>
          <p className="text-sm text-gray-400 font-light mt-1">Manage local streaming movies and source video routes.</p>
        </div>
        <Link
          to="/admin/movies/add"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-[0_4px_15px_rgba(229,9,20,0.35)] transition-all cursor-pointer"
        >
          <FiPlus className="h-5 w-5" />
          <span>Add Movie</span>
        </Link>
      </div>

      {/* Notification Toast Alerts */}
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

      {/* Filters Box */}
      <div className="bg-[#12131a] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Search movie titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white placeholder-gray-400 outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
          />
        </div>

        {/* Categories / Genre Filter */}
        <div className="flex flex-wrap w-full md:w-auto gap-4 items-center justify-end">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/5 bg-[#12131a] text-xs text-gray-300 font-semibold focus:border-red-500/40 outline-none transition-all cursor-pointer"
          >
            <option value="">All Genres</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/5 bg-[#12131a] text-xs text-gray-300 font-semibold focus:border-red-500/40 outline-none transition-all cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft (Unpublished)</option>
          </select>
        </div>
      </div>

      {/* Movies Table Grid */}
      <div className="bg-[#12131a] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
        {filteredMovies.length === 0 ? (
          <div className="p-16 text-center text-gray-500 font-light text-sm">
            No movies match your filters. Click "Add Movie" to insert new records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-4 font-semibold w-24">Poster</th>
                  <th className="p-4 font-semibold">Title Details</th>
                  <th className="p-4 font-semibold">Year</th>
                  <th className="p-4 font-semibold">Genres</th>
                  <th className="p-4 font-semibold">Duration</th>
                  <th className="p-4 font-semibold">Quality Status</th>
                  <th className="p-4 font-semibold">Featured</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMovies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <div className="w-14 aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 border border-white/5 shadow-md shrink-0">
                        {movie.thumbnailUrl ? (
                          <img
                            src={movie.thumbnailUrl}
                            alt={movie.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#0d0e12]">
                            <FiVideo className="h-5 w-5 text-gray-700" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-white text-base leading-tight mb-0.5">{movie.title}</p>
                        <span className="text-[10px] text-gray-500 font-mono">ID: {movie.id} {movie.tmdbId ? `• TMDB: ${movie.tmdbId}` : ""}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300 font-semibold">{movie.releaseYear}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {movie.genres?.map(g => (
                          <span key={g.id} className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 text-[10px] font-semibold">
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-xs">{movie.duration}m</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                        movie.transcodingStatus === "READY"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : movie.transcodingStatus === "PROCESSING"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {movie.transcodingStatus || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="p-4">
                      {movie.isPremium ? (
                        <span className="px-2 py-0.5 text-[9px] font-bold text-black bg-amber-500 rounded uppercase tracking-wider">
                          Premium
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {movie.isPublished ? (
                        <span className="text-emerald-500 flex items-center gap-1 font-bold text-xs">
                          <FiCheck className="h-4 w-4" /> Published
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1 font-bold text-xs">
                          <FiX className="h-4 w-4" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/admin/movies/${movie.id}/edit`}
                          className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <FiEdit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(movie.id)}
                          className="p-2 rounded-lg bg-red-500/10 border border-red-500/10 text-red-400 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12131a] border border-white/5 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-red-500/10 text-red-500 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-red-500/20">
              <FiTrash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Delete Movie?</h3>
              <p className="text-sm text-gray-400 font-light mt-2 leading-relaxed">
                This action is irreversible. The movie record and associated transcoded URL routes will be permanently removed.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
