import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiLogOut, FiUser, FiMail, FiAlertCircle, FiShield, FiCheckCircle } from "react-icons/fi";

export default function Profile() {
  const { currentUser, role, logout } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setError("");
      setLoading(true);
      await logout();
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Failed to log out. Please try again.");
      setLoading(false);
    }
  };



  // Helper to extract user initials if avatar is not available
  const getUserInitials = () => {
    if (!currentUser || !currentUser.displayName) return "U";
    const names = currentUser.displayName.trim().split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 py-24">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-[#12131a]/85 p-8 backdrop-blur-xl shadow-2xl text-center">
        <h2 className="text-2xl font-black uppercase text-white tracking-wider mb-6">User Profile</h2>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 text-left">
            <FiAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400 text-left">
            <FiCheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{success}</span>
          </div>
        )}

        {/* Profile Avatar Card */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4 group">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || "User Avatar"}
                className="h-24 w-24 rounded-full object-cover border-2 border-white/10 group-hover:border-red-500 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_20px_rgba(229,9,20,0.3)]"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-[#e50914] to-orange-600 border-2 border-white/10 group-hover:border-red-500 text-white text-3xl font-black shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all duration-300">
                {getUserInitials()}
              </div>
            )}
            {/* Online indicator */}
            <span className="absolute bottom-1 right-1 flex h-4.5 w-4.5 rounded-full bg-emerald-500 border-2 border-[#12131a]"></span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">{currentUser?.displayName || "Subscriber"}</h3>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-red-600/10 to-orange-600/10 text-red-500 border border-red-500/20 uppercase tracking-widest">
            Premium Plan
          </span>
        </div>

        {/* Credentials Details */}
        <div className="space-y-4 mb-6 text-left">
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 flex items-center gap-3.5">
            <FiUser className="h-5 w-5 text-gray-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Display Name</p>
              <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.displayName || "Not Specified"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-4 flex items-center gap-3.5">
            <FiMail className="h-5 w-5 text-gray-500 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">{currentUser?.email || "No Email Bound"}</p>
            </div>
          </div>
        </div>

        {/* Administrative Mode Link (Only visible if database role is admin) */}
        {role === "admin" && (
          <div className="mb-8 rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <FiShield className="h-4.5 w-4.5 text-[#e50914]" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Administrative Mode</span>
            </div>
            <p className="text-xs text-gray-500 font-light mb-4 leading-relaxed">
              Your account has administrator privileges. You can access the backend management dashboard below.
            </p>
            <Link
              to="/admin"
              className="block text-center py-2 px-3 rounded-lg border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider transition-colors duration-300"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-red-700 to-red-950 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl border border-red-600/10 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_20px_rgba(229,9,20,0.3)] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              <FiLogOut className="h-5 w-5" />
              Sign Out
            </>
          )}
        </button>
      </div>
    </div>
  );
}
