import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiSearch, FiBell, FiUser, FiMenu, FiX, FiLogOut, FiStar, FiDownload, FiShare, FiPlusSquare } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { usePWAInstall } from "../../hooks/usePWAInstall";


export default function Navbar() {
  const { pathname } = useLocation();

  // Hide global navbar on admin or watch pages to avoid visual overlaps
  if (pathname.startsWith("/admin") || pathname.startsWith("/watch")) {
    return null;
  }

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showInstallFallback, setShowInstallFallback] = useState(false);
  const { currentUser, dbUser, role, logout } = useAuth();
  const { canInstall, isStandalone, isIOS, isSafari, promptInstall } = usePWAInstall();
  const expiry = dbUser?.premiumExpiryDate || dbUser?.subscriptionExpiryDate;
  const isPremiumUser = dbUser && (dbUser.role === "admin" || (dbUser.isPremium === true && expiry && new Date(expiry) > new Date()));
  const navigate = useNavigate();

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

  const handleSearchClick = () => {
    if (pathname !== "/" && pathname !== "/movies" && pathname !== "/tv-shows") {
      navigate("/");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("open-search-overlay"));
      }, 150);
    } else {
      window.dispatchEvent(new CustomEvent("open-search-overlay"));
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
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e50914] via-[#ff3838] to-[#ff7b00] shadow-[0_0_15px_rgba(229,9,20,0.5)] group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-black text-base sm:text-xl italic tracking-wider">S</span>
              </div>
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-sm sm:text-xl font-bold tracking-wider text-transparent transition-all duration-300 group-hover:text-white">
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
                {isPremiumUser ? (
                  <Link
                    to="/premium"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-[#ffb703]/10 text-[#ffb703] border border-[#ffb703]/20 uppercase tracking-widest shadow-[0_0_10px_rgba(255,183,3,0.15)] hover:scale-102 transition-transform duration-300"
                  >
                    <FiStar className="h-3 w-3 fill-current" /> Premium
                  </Link>
                ) : (
                  <Link
                    to="/premium"
                    className="inline-block px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#ffb703] to-[#ff8500] hover:shadow-[0_0_15px_rgba(255,133,0,0.3)] text-black text-xs font-black uppercase tracking-wider transition-all duration-300 transform hover:scale-102"
                  >
                    Go Premium
                  </Link>
                )}
                <button 
                  onClick={handleSearchClick}
                  className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
                >
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

          {/* Mobile Actions & Menu Trigger */}
          <div className="flex md:hidden items-center gap-3">
            {currentUser && (
              <>
                <button 
                  onClick={handleSearchClick}
                  className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer p-1"
                  aria-label="Search"
                >
                  <FiSearch className="h-5 w-5" />
                </button>
                <button 
                  className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer relative p-1"
                  aria-label="Notifications"
                >
                  <FiBell className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  </span>
                </button>
                <Link 
                  to="/profile" 
                  className="flex items-center text-gray-300 hover:text-white transition-all duration-300 p-1"
                  aria-label="Profile"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      className="h-6 w-6 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#e50914] to-orange-600 text-white font-bold text-[10px] border border-white/10">
                      {getUserInitials()}
                    </div>
                  )}
                </Link>
              </>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer p-1"
              aria-label="Toggle Menu"
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
              {isPremiumUser ? (
                <Link
                  to="/premium"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mx-3 py-2 rounded-xl bg-[#ffb703]/10 border border-[#ffb703]/20 text-[#ffb703] text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-1 hover:bg-[#ffb703]/20 transition-all duration-300"
                >
                  <FiStar className="h-3.5 w-3.5 fill-current" /> Premium Active
                </Link>
              ) : (
                <Link
                  to="/premium"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center text-xs font-black text-black bg-gradient-to-r from-[#ffb703] to-[#ff8500] py-2.5 mx-3 rounded-xl uppercase tracking-wider shadow-md"
                >
                  Upgrade to Premium
                </Link>
              )}
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
              {/* Account link in mobile hamburger menu drawer */}
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 font-medium"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="h-5 w-5 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <FiUser className="h-5 w-5" />
                )}
                <span className="text-base">Account</span>
              </Link>
              
              {/* Install App Link */}
              {!isStandalone && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (canInstall) {
                      promptInstall();
                    } else {
                      setShowInstallFallback(true);
                    }
                  }}
                  className="w-full flex items-center gap-3 py-2 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-left font-medium"
                >
                  <FiDownload className="h-5 w-5 text-red-500 animate-pulse" />
                  Install StreamApp
                </button>
              )}
              
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

      {/* iOS/Android Manual Install Fallback Modal */}
      {showInstallFallback && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#12131a] p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowInstallFallback(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <FiX className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#e50914] to-orange-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]">
                <FiDownload className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Install StreamApp</h3>
            </div>

            {isIOS ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  iOS Safari does not support automatic downloads. Follow these steps to install StreamApp on your iPhone/iPad:
                </p>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-2.5 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-[10px]">1</span>
                    <span className="font-light">Tap the share button <FiShare className="h-3.5 w-3.5 text-sky-400 inline shrink-0" /> at the bottom of Safari.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-[10px]">2</span>
                    <span className="font-light">Select <strong className="text-white font-semibold">Add to Home Screen</strong> <FiPlusSquare className="h-3.5 w-3.5 text-emerald-400 inline shrink-0" /> from the menu.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Direct PWA installation is not supported by your current browser settings. Follow these steps to install StreamApp on Android:
                </p>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-xs text-gray-300 leading-relaxed font-light">
                  Tap Chrome's options menu <strong className="text-white font-semibold">⋮</strong> in the top-right corner and select <strong className="text-white font-semibold">"Install app"</strong> or <strong className="text-white font-semibold">"Add to Home screen"</strong>.
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstallFallback(false)}
              className="mt-6 w-full py-2.5 bg-[#e50914] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
