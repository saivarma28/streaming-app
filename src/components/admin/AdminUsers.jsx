import React, { useState, useEffect } from "react";
import { 
  FiUsers, FiCheck, FiX, FiSearch 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getAllUsers } from "../../services/apiService";

export default function AdminUsers() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadUsers() {
      if (!currentUser) return;
      setLoading(true);
      setError("");
      try {
        const token = await currentUser.getIdToken();
        const data = await getAllUsers(token);
        setUsers(data.users || []);
      } catch (err) {
        console.error("Failed to load users directory:", err.message);
        setError("Failed to fetch users list. Only administrators are authorized.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [currentUser]);

  const filteredUsers = users.filter(user => {
    return searchQuery.trim() === "" ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-white font-extrabold">Users Directory</h1>
          <p className="text-sm text-gray-400 font-light mt-1">Review registered platform users and authorization levels.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Search Filter Box */}
      <div className="bg-[#12131a] border border-white/5 p-4 rounded-2xl flex gap-4 shadow-xl">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Search users by name/email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white placeholder-gray-400 outline-none focus:border-red-500/40 focus:bg-white/10 transition-all font-semibold"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#12131a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-gray-500 font-light text-sm">
            No registered users found matching search credentials.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-4 px-6 font-semibold">User Profile</th>
                  <th className="py-4 px-6 font-semibold">Email Address</th>
                  <th className="py-4 px-6 font-semibold text-center">Auth Role</th>
                  <th className="py-4 px-6 font-semibold text-center">Email Verification</th>
                  <th className="py-4 px-6 font-semibold text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-gray-300">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-[#e50914] font-bold uppercase border border-red-500/15">
                          {user.name ? user.name[0] : "U"}
                        </div>
                        <span className="text-white font-bold">{user.name || "User Account"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-400">{user.email}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        user.role === "admin" 
                          ? "bg-red-500/10 text-red-500 border-red-500/20" 
                          : "bg-white/5 text-gray-400 border-white/5"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {user.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <FiCheck className="h-3 w-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/20">
                          <FiX className="h-3 w-3" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-500 font-light">
                      {new Date(user.createdAt).toLocaleDateString()}
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
