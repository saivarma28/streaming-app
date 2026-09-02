import React, { useState, useEffect } from "react";
import { 
  FiVideo, FiTv, FiUsers, FiClock, FiActivity, FiArrowRight 
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  getMovies, 
  getTvShows, 
  getAllUsers, 
  getAllWatchHistories 
} from "../../services/apiService";

export default function AdminDashboardHome() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    moviesCount: 0,
    tvShowsCount: 0,
    usersCount: 0,
    watchHistoryCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    async function loadStats() {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const [moviesData, tvData, usersData, historyData] = await Promise.all([
          getMovies(token, null, true).catch(() => ({ movies: [] })),
          getTvShows(token, null, true).catch(() => ({ tvShows: [] })),
          getAllUsers(token).catch(() => ({ users: [] })),
          getAllWatchHistories(token).catch(() => ({ history: [] }))
        ]);

        setStats({
          moviesCount: moviesData.movies?.length || 0,
          tvShowsCount: tvData.tvShows?.length || 0,
          usersCount: usersData.users?.length || 0,
          watchHistoryCount: historyData.history?.length || 0
        });

        // Get top 8 recent watch entries
        setRecentHistory(historyData.history?.slice(0, 8) || []);
      } catch (err) {
        console.error("Dashboard home statistics load error:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Movies", count: stats.moviesCount, icon: FiVideo, color: "text-blue-500", bg: "bg-blue-500/10", link: "/admin/movies" },
    { title: "Total TV Shows", count: stats.tvShowsCount, icon: FiTv, color: "text-emerald-500", bg: "bg-emerald-500/10", link: "/admin/tv-shows" },
    { title: "Registered Users", count: stats.usersCount, icon: FiUsers, color: "text-purple-500", bg: "bg-purple-500/10", link: "/admin/users" },
    { title: "Streams Logged", count: stats.watchHistoryCount, icon: FiClock, color: "text-amber-500", bg: "bg-amber-500/10", link: null }
  ];

  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-black uppercase text-white">Dashboard Overview</h1>
        <p className="text-sm text-gray-400 font-light mt-1">Real-time statistics of your streaming media platform.</p>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const CardContent = (
            <div className="bg-[#12131a] border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl hover:border-white/10 hover:bg-white/5 transition-all">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.title}</span>
                <h3 className="text-3xl font-black text-white">{card.count}</h3>
              </div>
              <div className={`p-4 rounded-xl ${card.color} ${card.bg}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );

          return card.link ? (
            <Link key={card.title} to={card.link} className="block transition-transform duration-300 hover:-translate-y-0.5">
              {CardContent}
            </Link>
          ) : (
            <div key={card.title}>{CardContent}</div>
          );
        })}
      </div>

      {/* Recent Watch Activity */}
      <div className="bg-[#12131a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <FiActivity className="h-5 w-5 text-[#e50914]" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Recent User Stream Activity</h2>
        </div>

        {recentHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-light text-sm">
            No stream play events logged in the system yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="pb-3 font-semibold">User Profile</th>
                  <th className="pb-3 font-semibold">Stream Title</th>
                  <th className="pb-3 font-semibold">Progress Position</th>
                  <th className="pb-3 font-semibold">Completion</th>
                  <th className="pb-3 font-semibold text-right">Last Watched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-4 font-semibold text-white">
                      <div>
                        <p>{item.userEmail || "Anonymous User"}</p>
                        <span className="text-[10px] text-gray-500 font-mono">UID: {item.firebaseUid?.substring(0, 10)}...</span>
                      </div>
                    </td>
                    <td className="py-4 font-bold text-gray-300">
                      {item.movie?.title || `Media Record #${item.movieId}`}
                    </td>
                    <td className="py-4 text-gray-400 font-mono">
                      {Math.floor(item.progress / 60)}m {item.progress % 60}s
                    </td>
                    <td className="py-4">
                      {item.completed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right text-gray-500 text-xs">
                      {new Date(item.updatedAt).toLocaleDateString()} {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
