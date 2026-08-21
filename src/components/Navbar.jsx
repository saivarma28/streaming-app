import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiSearch, FiBell, FiUser, FiMenu, FiX, FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getUserMe } from "../services/apiService";

export default function Navbar() {
  const { pathname } = useLocation();

  // Hide global navbar on admin or watch pages to avoid visual overlaps
  if (pathname.startsWith("/admin") || pathname.startsWith("/watch")) {
    return null;
  }

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState("user");
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserRole() {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const response = await getUserMe(token);
          if (response.success && response.user) {
            setRole(response.user.role);
          }
        } catch (err) {
          console.error("Failed to load user role in Navbar:", err);
        }
      } else {
        setRole("user");
      }
    }
    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out: ", err);
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "TV Shows", path: "/tv-shows" },
    { name: "Movies", path: "/movies" },
    { name: "New & Popular", path: "/new-popular" },
    { name: "My List", path: "/my-list" }
  ];

  if (role === "admin") {
    navLinks.push({ name: "Admin Dashboard", path: "/admin" });
  }

  // Helper to extract initials
  const getUserInitials = () => {
    if (!currentUser || !currentUser.displayName) return "U";
    const names = currentUser.displayName.trim().split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isScrolled
          ? "bg-[#090a0f]/90 backdrop-blur-md shadow-lg border-b border-white/5 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-8 items-center justify-between">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e50914] via-[#ff3838] to-[#ff7b00] shadow-[0_0_15px_rgba(229,9,20,0.5)] group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-black text-xl italic tracking-wider">S</span>
              </div>
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-xl font-bold tracking-wider text-transparent transition-all duration-300 group-hover:text-white">
                STREAM<span className="text-[#e50914]">APP</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      `text-sm font-medium transition-all duration-300 hover:text-white relative py-1 ${
                        isActive
                          ? "text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-[#e50914] after:to-red-500"
                          : "text-gray-400"
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-5">
            {currentUser ? (
              <>
                <button className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer">
                  <FiSearch className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer relative">
                  <FiBell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                  </span>
                </button>
                <div className="h-[20px] w-[1px] bg-white/10"></div>
                {/* Profile Button with Name and Avatar */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      className="h-8 w-8 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#e50914] to-orange-600 text-white font-bold text-xs border border-white/10">
                      {getUserInitials()}
                    </div>
                  )}
                  <span className="text-sm font-semibold max-w-[100px] truncate">{currentUser.displayName || "Profile"}</span>
                </Link>
                {/* Logout Action */}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="text-gray-400 hover:text-red-500 transition-colors duration-300 cursor-pointer p-1"
                >
                  <FiLogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-300 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 px-5 py-2 rounded-xl shadow-[0_4px_15px_rgba(229,9,20,0.35)]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
            >
              {isMobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#090a0f] border-t border-white/5 px-4 pt-4 pb-6 space-y-3 transition-all duration-300">
          {currentUser ? (
            <>
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block text-base font-medium py-2 px-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-white/5 text-white border-l-4 border-[#e50914]"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              <div className="h-[1px] bg-white/5 my-3"></div>
              {/* Profile link in mobile */}
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="h-8 w-8 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#e50914] to-orange-600 text-white font-bold text-xs border border-white/10">
                    {getUserInitials()}
                  </div>
                )}
                <span className="font-semibold text-sm">{currentUser.displayName || "My Profile"}</span>
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 py-2 px-3 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white/5 transition-all duration-300 cursor-pointer text-left font-medium"
              >
                <FiLogOut className="h-5 w-5" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2 px-3">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center text-sm font-semibold text-gray-300 border border-white/10 hover:bg-white/5 py-2.5 rounded-xl transition-colors duration-300"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center text-sm font-semibold text-white bg-gradient-to-r from-[#e50914] to-red-600 py-2.5 rounded-xl transition-colors duration-300"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
