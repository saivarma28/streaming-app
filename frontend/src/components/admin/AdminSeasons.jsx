import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  FiChevronLeft, FiPlus, FiFolder, FiTv, FiArrowRight 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getTvShowById, getSeasons } from "../../services/apiService";

export default function AdminSeasons() {
  const { currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [tvShow, setTvShow] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newSeasonNumber, setNewSeasonNumber] = useState("");

  useEffect(() => {
    async function loadSeasonsData() {
      if (!currentUser) return;
      setLoading(true);
      setError("");
      try {
        const token = await currentUser.getIdToken();
        const [tvData, seasonsData] = await Promise.all([
          getTvShowById(token, id),
          getSeasons(token, id)
        ]);

        setTvShow(tvData.tvShow);
        setSeasons(seasonsData.seasons || []);
      } catch (err) {
        console.error("Failed to load seasons info:", err.message);
        setError("Failed to fetch seasons listing.");
      } finally {
        setLoading(false);
      }
    }

    loadSeasonsData();
  }, [id, currentUser]);

  const handleAddSeason = (e) => {
    e.preventDefault();
    if (!newSeasonNumber || isNaN(newSeasonNumber)) return;
    const sNum = parseInt(newSeasonNumber);
    if (sNum <= 0) return;

    // Check if season already in list
    if (seasons.some(s => s.seasonNumber === sNum)) {
      setError(`Season ${sNum} already exists in the list.`);
      return;
    }

    // Since seasons are derived from episodes, we can just navigate to the episodes view of this new season to add episodes!
    // No explicit "season" record exists; it's dynamically populated based on episodes.
    // So adding a season simply points to the episodes creation router.
    setNewSeasonNumber("");
    setError("");
    navigate(`/admin/tv-shows/${id}/seasons/${sNum}/episodes`);
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
      {/* Breadcrumbs */}
      <div>
        <Link
          to="/admin/tv-shows"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors mb-3"
        >
          <FiChevronLeft className="h-4 w-4" /> Back to TV Shows
        </Link>
        <h1 className="text-3xl font-black uppercase text-white">
          {tvShow?.title} — Seasons
        </h1>
        <p className="text-sm text-gray-400 font-light mt-1">
          Manage season entries. TV seasons are dynamically compiled based on episode numbers.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Row Split: Add Season vs List Seasons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Create season helper */}
        <div className="md:col-span-1 bg-[#12131a] border border-white/5 p-6 rounded-2xl shadow-xl h-fit space-y-4">
          <h2 className="text-sm font-bold uppercase text-white tracking-wider">Initialize Season</h2>
          <p className="text-xs text-gray-400 font-light leading-relaxed">
            Seasons are dynamically generated. Enter a season number below to configure its episodes catalog.
          </p>
          <form onSubmit={handleAddSeason} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Season Number</label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 1"
                value={newSeasonNumber}
                onChange={(e) => setNewSeasonNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-xs text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <FiPlus className="h-4 w-4" />
              <span>Configure Season</span>
            </button>
          </form>
        </div>

        {/* Right Side: Seasons List */}
        <div className="md:col-span-2 space-y-4">
          {seasons.length === 0 ? (
            <div className="bg-[#12131a] border border-white/5 rounded-2xl p-12 text-center text-gray-500 font-light text-sm shadow-xl">
              <FiTv className="h-10 w-10 text-gray-700 mx-auto mb-4" />
              <p className="font-bold text-gray-400">No Seasons Configured</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                No episode files are uploaded for this show. Enter a season number on the left to add episodes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {seasons.map((season) => (
                <div 
                  key={season.seasonNumber}
                  className="bg-[#12131a] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between hover:border-white/10 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#e50914]/10 text-[#e50914] rounded-xl border border-[#e50914]/20">
                      <FiFolder className="h-6 w-6" />
                    </div>
                    <div className="text-left space-y-0.5">
                      <h3 className="font-bold text-white text-lg">Season {season.seasonNumber}</h3>
                      <p className="text-xs text-gray-400 font-light">
                        {season.episodeCount} Episodes ({season.publishedCount} Published)
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/admin/tv-shows/${id}/seasons/${season.seasonNumber}/episodes`}
                    className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <FiArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
