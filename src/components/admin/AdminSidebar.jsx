import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  FiHome, FiVideo, FiTv, FiSearch, FiUsers, FiSettings, FiLogOut 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      console.error("Failed to logout from admin panel:", e.message);
    }
  };

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: FiHome, end: true },
    { name: "Movies", path: "/admin/movies", icon: FiVideo, end: false },
    { name: "TV Shows", path: "/admin/tv-shows", icon: FiTv, end: false },
    { name: "TMDB Import", path: "/admin/tmdb", icon: FiSearch, end: false },
    { name: "Users Directory", path: "/admin/users", icon: FiUsers, end: false },
    { name: "Settings & Genres", path: "/admin/settings", icon: FiSettings, end: false }
  ];

  return (
    <aside className="w-64 bg-[#12131a] border-r border-white/5 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-lg font-black uppercase tracking-widest text-white">
            Stream<span className="text-[#e50914]">App</span>
          </h2>
          <span className="text-[10px] font-extrabold bg-[#e50914]/10 text-[#e50914] px-2 py-0.5 rounded-full uppercase tracking-wider">
            Admin Console
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#e50914] to-red-600 text-white shadow-[0_4px_15px_rgba(229,9,20,0.25)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile and Sign Out */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-[#e50914] hover:bg-[#e50914]/5 transition-all cursor-pointer"
        >
          <FiLogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
