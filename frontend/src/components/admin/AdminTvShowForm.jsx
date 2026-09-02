import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
  FiChevronLeft, FiLoader, FiAlertCircle 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { 
  getTvShowById, createTvShow, updateTvShow, getGenres 
} from "../../services/apiService";

export default function AdminTvShowForm() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    backdropUrl: "",
    releaseYear: new Date().getFullYear().toString(),
    language: "English",
    isPublished: false,
    isPremium: false,
    selectedGenreIds: [],
    tmdbId: ""
  });

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
          const tvData = await getTvShowById(token, id);
          const t = tvData.tvShow;
          if (t) {
            setShowForm({
              title: t.title || "",
              description: t.description || "",
              thumbnailUrl: t.thumbnailUrl || "",
              backdropUrl: t.backdropUrl || "",
              releaseYear: String(t.releaseYear || new Date().getFullYear()),
              language: t.language || "English",
              isPublished: !!t.isPublished,
              isPremium: !!t.isPremium,
              selectedGenreIds: t.genreIds || [],
              tmdbId: t.tmdbId ? String(t.tmdbId) : ""
            });
          }
        }
      } catch (err) {
        console.error("Failed to load TV show form:", err.message);
        setError("Failed to fetch initial data for form context.");
      } finally {
        setLoading(false);
      }
    }

    loadFormContext();
  }, [id, currentUser, isEditMode]);

  const handleGenreCheckboxChange = (genreId) => {
    const isChecked = showForm.selectedGenreIds.includes(genreId);
    if (isChecked) {
      setShowForm({
        ...showForm,
        selectedGenreIds: showForm.selectedGenreIds.filter(gid => gid !== genreId)
      });
    } else {
      setShowForm({
        ...showForm,
        selectedGenreIds: [...showForm.selectedGenreIds, genreId]
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setActionLoading(true);

    try {
      const token = await currentUser.getIdToken();
      const payload = {
        title: showForm.title,
        description: showForm.description,
        thumbnailUrl: showForm.thumbnailUrl,
        backdropUrl: showForm.backdropUrl,
        releaseYear: parseInt(showForm.releaseYear),
        language: showForm.language,
        isPublished: showForm.isPublished,
        isPremium: showForm.isPremium,
        genreIds: showForm.selectedGenreIds,
        tmdbId: showForm.tmdbId ? parseInt(showForm.tmdbId) : null
      };

      if (isEditMode) {
        await updateTvShow(token, id, payload);
      } else {
        await createTvShow(token, payload);
      }

      navigate("/admin/tv-shows");
    } catch (err) {
      console.error("Error submitting TV show form:", err.message);
      setError(err.message || "Failed to save TV series details.");
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
          to="/admin/tv-shows"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors mb-3"
        >
          <FiChevronLeft className="h-4 w-4" /> Back to TV Shows
        </Link>
        <h1 className="text-3xl font-black uppercase text-white">
          {isEditMode ? "Edit TV Show Details" : "Add New TV Show"}
        </h1>
        <p className="text-sm text-gray-400 font-light mt-1">
          {isEditMode ? "Modify TV show metadata details." : "Register a new TV Series in the local database."}
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
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Series Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Breaking Bad"
                value={showForm.title}
                onChange={(e) => setShowForm({ ...showForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description / Synopsis</label>
              <textarea
                required
                rows="5"
                placeholder="Provide plot details of the show..."
                value={showForm.description}
                onChange={(e) => setShowForm({ ...showForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Release Year</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2008"
                  value={showForm.releaseYear}
                  onChange={(e) => setShowForm({ ...showForm, releaseYear: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Language</label>
                <input
                  type="text"
                  placeholder="e.g. English"
                  value={showForm.language}
                  onChange={(e) => setShowForm({ ...showForm, language: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Associated TMDB ID</label>
              <input
                type="number"
                placeholder="e.g. 1396 (Optional)"
                value={showForm.tmdbId}
                onChange={(e) => setShowForm({ ...showForm, tmdbId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Right Column Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Poster Image URL</label>
              <input
                type="text"
                placeholder="https://image.tmdb.org/t/p/... or custom"
                value={showForm.thumbnailUrl}
                onChange={(e) => setShowForm({ ...showForm, thumbnailUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Backdrop Banner URL</label>
              <input
                type="text"
                placeholder="https://image.tmdb.org/t/p/... or custom"
                value={showForm.backdropUrl}
                onChange={(e) => setShowForm({ ...showForm, backdropUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
              />
            </div>

            {/* Genres checkbox selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Genres Selection</label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-white/5 p-3 rounded-xl bg-[#0d0e12]">
                {genres.map(genre => (
                  <label key={genre.id} className="flex items-center gap-2 text-xs font-semibold text-gray-300 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showForm.selectedGenreIds.includes(genre.id)}
                      onChange={() => handleGenreCheckboxChange(genre.id)}
                      className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-white/5"
                    />
                    <span>{genre.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Content Type & Publish */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Content Type</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 select-none cursor-pointer text-xs font-semibold text-gray-300">
                    <input
                      type="radio"
                      name="contentType"
                      checked={!showForm.isPremium}
                      onChange={() => setShowForm({ ...showForm, isPremium: false })}
                      className="border-white/10 text-[#e50914] focus:ring-0 focus:ring-offset-0 bg-white/5"
                    />
                    <span>Normal</span>
                  </label>

                  <label className="flex items-center gap-2 select-none cursor-pointer text-xs font-semibold text-gray-300">
                    <input
                      type="radio"
                      name="contentType"
                      checked={showForm.isPremium}
                      onChange={() => setShowForm({ ...showForm, isPremium: true })}
                      className="border-white/10 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-white/5"
                    />
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">Premium ⭐</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2.5 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showForm.isPublished}
                    onChange={(e) => setShowForm({ ...showForm, isPublished: e.target.checked })}
                    className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-white/5"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Publish Immediately</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-white/5 flex justify-end gap-4">
          <Link
            to="/admin/tv-shows"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={actionLoading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-[0_4px_15px_rgba(229,9,20,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? (
              <>
                <FiLoader className="h-4.5 w-4.5 animate-spin" />
                <span>Saving details...</span>
              </>
            ) : (
              <span>Save TV Show</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
