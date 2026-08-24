import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FiChevronLeft, FiPlus, FiEdit, FiTrash2, FiVideo, FiUpload, FiCheck, FiX, FiLoader, FiAlertCircle 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { 
  getTvShowById, getEpisodes, createEpisode, updateEpisode, deleteEpisode 
} from "../../services/apiService";

export default function AdminEpisodes() {
  const { currentUser } = useAuth();
  const { id, seasonNumber } = useParams();

  const [tvShow, setTvShow] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add/Edit Episode Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null); // null if adding
  const [episodeForm, setEpisodeForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    episodeNumber: "",
    duration: "45",
    releaseDate: new Date().toISOString().split("T")[0],
    isPublished: false
  });
  const [episodeVideoFile, setEpisodeVideoFile] = useState(null);

  // Deletion state
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    async function loadEpisodesData() {
      if (!currentUser) return;
      setLoading(true);
      setError("");
      try {
        const token = await currentUser.getIdToken();
        const [tvData, epData] = await Promise.all([
          getTvShowById(token, id),
          getEpisodes(token, id, seasonNumber, true)
        ]);

        setTvShow(tvData.tvShow);
        setEpisodes(epData.episodes || []);
      } catch (err) {
        console.error("Failed to load episodes list:", err.message);
        setError("Failed to fetch episodes.");
      } finally {
        setLoading(false);
      }
    }

    loadEpisodesData();
  }, [id, seasonNumber, currentUser]);

  const handleOpenAddModal = () => {
    setEditingEpisode(null);
    // Find next episode number automatically
    const nextEpNum = episodes.length > 0 
      ? Math.max(...episodes.map(e => e.episodeNumber)) + 1 
      : 1;

    setEpisodeForm({
      title: "",
      description: "",
      thumbnailUrl: "",
      episodeNumber: String(nextEpNum),
      duration: "45",
      releaseDate: new Date().toISOString().split("T")[0],
      isPublished: false
    });
    setEpisodeVideoFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ep) => {
    setEditingEpisode(ep);
    setEpisodeForm({
      title: ep.title || "",
      description: ep.description || "",
      thumbnailUrl: ep.thumbnailUrl || "",
      episodeNumber: String(ep.episodeNumber),
      duration: String(ep.duration || "45"),
      releaseDate: ep.releaseDate || "",
      isPublished: !!ep.isPublished
    });
    setEpisodeVideoFile(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append("title", episodeForm.title);
      formData.append("description", episodeForm.description);
      formData.append("thumbnailUrl", episodeForm.thumbnailUrl);
      formData.append("episodeNumber", episodeForm.episodeNumber);
      formData.append("duration", episodeForm.duration);
      formData.append("releaseDate", episodeForm.releaseDate);
      formData.append("isPublished", episodeForm.isPublished);

      if (episodeVideoFile) {
        formData.append("video", episodeVideoFile);
      }

      if (editingEpisode) {
        // Edit Mode
        const data = await updateEpisode(token, id, seasonNumber, editingEpisode.id, formData);
        setEpisodes(episodes.map(item => item.id === editingEpisode.id ? data.episode : item));
        setSuccessMsg(`Episode ${episodeForm.episodeNumber} updated successfully!`);
      } else {
        // Add Mode
        const data = await createEpisode(token, id, seasonNumber, formData);
        setEpisodes([...episodes, data.episode].sort((a, b) => a.episodeNumber - b.episodeNumber));
        setSuccessMsg(`Episode ${episodeForm.episodeNumber} added successfully!`);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Episode submit error:", err.message);
      setError(err.message || "Failed to save episode.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setError("");
    setSuccessMsg("");
    try {
      const token = await currentUser.getIdToken();
      await deleteEpisode(token, id, seasonNumber, deleteTargetId);
      setEpisodes(episodes.filter(ep => ep.id !== deleteTargetId));
      setSuccessMsg("Episode deleted successfully.");
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete episode:", err.message);
      setError(err.message || "Failed to delete episode.");
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
    <div className="space-y-6 text-left relative">
      {/* Breadcrumb */}
      <div>
        <Link
          to={`/admin/tv-shows/${id}/seasons`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors mb-3"
        >
          <FiChevronLeft className="h-4 w-4" /> Back to Seasons
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase text-white">
              {tvShow?.title} — Season {seasonNumber}
            </h1>
            <p className="text-sm text-gray-400 font-light mt-1">
              Add and edit episode information and stream video files.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-[0_4px_15px_rgba(229,9,20,0.35)] transition-all cursor-pointer"
          >
            <FiPlus className="h-5 w-5" />
            <span>Add Episode</span>
          </button>
        </div>
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

      {/* Episodes Table grid */}
      <div className="bg-[#12131a] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
        {episodes.length === 0 ? (
          <div className="p-16 text-center text-gray-500 font-light text-sm">
            No episodes registered in Season {seasonNumber} yet. Click "Add Episode" to upload.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-4 font-semibold w-16 text-center">Ep #</th>
                  <th className="p-4 font-semibold w-24">Thumbnail</th>
                  <th className="p-4 font-semibold">Title / Description</th>
                  <th className="p-4 font-semibold">Duration</th>
                  <th className="p-4 font-semibold">Release Date</th>
                  <th className="p-4 font-semibold">Video Status</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {episodes.map((ep) => (
                  <tr key={ep.id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4 text-center font-bold text-white text-lg font-mono">{ep.episodeNumber}</td>
                    <td className="p-4">
                      <div className="w-20 aspect-video rounded-lg overflow-hidden bg-gray-900 border border-white/5 shadow-md shrink-0">
                        {ep.thumbnailUrl ? (
                          <img
                            src={ep.thumbnailUrl}
                            alt={ep.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#0d0e12]">
                            <FiVideo className="h-5 w-5 text-gray-700" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div>
                        <p className="font-bold text-white text-base leading-tight mb-1">{ep.title}</p>
                        <p className="text-gray-400 text-xs line-clamp-2 font-light">{ep.description || "No description provided."}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-xs">{ep.duration}m</td>
                    <td className="p-4 text-gray-300">{ep.releaseDate || "—"}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${
                        ep.transcodingStatus === "READY"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : ep.transcodingStatus === "UPLOADING"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {ep.transcodingStatus || "READY"}
                      </span>
                    </td>
                    <td className="p-4">
                      {ep.isPublished ? (
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
                        <button
                          onClick={() => handleOpenEditModal(ep)}
                          className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(ep.id)}
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

      {/* Add/Edit Episode Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12131a] border border-white/5 p-6 rounded-2xl max-w-xl w-full shadow-2xl text-left my-8 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-4">
              {editingEpisode ? `Edit Episode ${episodeForm.episodeNumber}` : "Add New Episode"}
            </h2>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Episode Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={episodeForm.episodeNumber}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, episodeNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Episode Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pilot"
                    value={episodeForm.title}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Episode Description</label>
                <textarea
                  rows="3"
                  placeholder="Plot summary of this episode..."
                  value={episodeForm.description}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Duration (mins)</label>
                  <input
                    type="number"
                    required
                    value={episodeForm.duration}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, duration: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Release Date</label>
                  <input
                    type="date"
                    value={episodeForm.releaseDate}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, releaseDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Thumbnail URL</label>
                <input
                  type="text"
                  placeholder="https://image.tmdb.org/t/p/... or custom"
                  value={episodeForm.thumbnailUrl}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, thumbnailUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
                />
              </div>

              {/* Upload source video to R2 */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Episode Video File (.mp4 / Cloudflare R2 Upload)
                </label>
                <div className="relative border border-dashed border-white/10 rounded-xl p-4 bg-white/2 hover:bg-white/5 transition-all text-center flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setEpisodeVideoFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FiUpload className="h-6 w-6 text-[#e50914] mb-2" />
                  <p className="text-xs font-bold text-gray-300">
                    {episodeVideoFile ? episodeVideoFile.name : editingEpisode ? "Click to replace existing video stream file" : "Select video file"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <label className="flex items-center gap-2 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={episodeForm.isPublished}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, isPublished: e.target.checked })}
                    className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-white/5"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Publish Immediately</span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-white/10 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <FiLoader className="h-4.5 w-4.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Episode</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation delete Modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12131a] border border-white/5 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center space-y-6">
            <div className="p-4 bg-red-500/10 text-red-500 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-red-500/20">
              <FiTrash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Delete Episode?</h3>
              <p className="text-sm text-gray-400 font-light mt-2 leading-relaxed">
                This action is irreversible. The episode metadata and video stream files will be permanently deleted.
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
