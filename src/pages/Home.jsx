import React from "react";
import { FiPlay, FiInfo, FiPlus } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import heroBanner from "../assets/hero_banner.png";

export default function Home() {
  const { currentUser } = useAuth();
  const trendingMovies = [
    {
      id: 1,
      title: "Interstellar Odyssey",
      category: "Sci-Fi • Thriller",
      rating: "9.2",
      image: "bg-gradient-to-br from-indigo-900 to-slate-900"
    },
    {
      id: 2,
      title: "Shadow Protocol",
      category: "Action • Suspense",
      rating: "8.7",
      image: "bg-gradient-to-br from-red-950 to-neutral-900"
    },
    {
      id: 3,
      title: "Chronicles of Aether",
      category: "Fantasy • Adventure",
      rating: "8.9",
      image: "bg-gradient-to-br from-violet-950 to-stone-900"
    },
    {
      id: 4,
      title: "Neon Horizon 2099",
      category: "Cyberpunk • Drama",
      rating: "9.0",
      image: "bg-gradient-to-br from-emerald-950 to-zinc-900"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#0d0e12] pb-20">
      {/* Hero Banner Section */}
      <div className="relative h-[85vh] w-full overflow-hidden">
        {/* Background Image with Gradients */}
        <div className="absolute inset-0">
          <img
            src={heroBanner}
            alt="Hero Movie Banner"
            className="h-full w-full object-cover object-center transform scale-105 animate-pulse-slow"
          />
          {/* Subtle gradient overlays to blend with dark background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e12] via-[#0d0e12]/20 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-16 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-2xl text-left">
            {currentUser?.displayName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-gray-300 border border-white/10 mb-4 mr-3 uppercase tracking-wider">
                Welcome, {currentUser.displayName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 mb-4 uppercase tracking-wider">
              Trending #1 Series
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-none mb-4">
              Echoes of the <br />
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Cosmos
              </span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed font-light">
              An interstellar journey beyond the boundary of space and time. Uncover the mystery that reshaped humanity's future in the stars. Watch the critically acclaimed original series now.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-[0_4px_20px_rgba(229,9,20,0.4)] hover:shadow-[0_4px_25px_rgba(229,9,20,0.6)] transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <FiPlay className="h-5 w-5 fill-current" />
                Play Now
              </button>
              <button className="flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold border border-white/10 backdrop-blur-md transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <FiInfo className="h-5 w-5" />
                More Info
              </button>
              <button className="flex items-center justify-center p-3.5 bg-[#1a1b24]/80 border border-white/5 hover:border-white/10 text-white rounded-xl backdrop-blur-md transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <FiPlus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content (Trending Now Carousel/Row) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">Trending Movies & Shows</h2>
          <a href="#" className="text-sm font-semibold text-red-500 hover:text-red-400 transition-colors">
            See All
          </a>
        </div>

        {/* Movie Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingMovies.map((movie) => (
            <div
              key={movie.id}
              className="group relative h-48 rounded-2xl overflow-hidden border border-white/5 cursor-pointer shadow-lg transform hover:scale-[1.03] transition-all duration-500 ease-out"
            >
              {/* Cover Art Box with Gradient */}
              <div className={`absolute inset-0 ${movie.image} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* Outer glass border on hover */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500/30 rounded-2xl transition-all duration-300"></div>

              {/* Title & Info Card overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Trending</span>
                  <span className="text-xs font-semibold bg-white/10 px-2 py-0.5 rounded text-yellow-400 border border-yellow-400/20">★ {movie.rating}</span>
                </div>
                <h3 className="text-white font-bold text-lg leading-tight group-hover:text-red-400 transition-colors duration-300">
                  {movie.title}
                </h3>
                <p className="text-gray-400 text-xs mt-1">{movie.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
