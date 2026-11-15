import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminDashboardHome from "../components/AdminDashboardHome";
import AdminMovies from "../components/AdminMovies";
import AdminMovieForm from "../components/AdminMovieForm";
import AdminTvShows from "../components/AdminTvShows";
import AdminTvShowForm from "../components/AdminTvShowForm";
import AdminSeasons from "../components/AdminSeasons";
import AdminEpisodes from "../components/AdminEpisodes";
import AdminTmdb from "../components/AdminTmdb";
import AdminUsers from "../components/AdminUsers";
import AdminGenres from "../components/AdminGenres";

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-[#0d0e12] text-gray-100 overflow-x-hidden">
      {/* Persistent Left Sidebar */}
      <AdminSidebar />

      {/* Main Panel Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        <Routes>
          <Route path="/" element={<AdminDashboardHome />} />
          
          {/* Movies Management Routing */}
          <Route path="/movies" element={<AdminMovies />} />
          <Route path="/movies/add" element={<AdminMovieForm />} />
          <Route path="/movies/:id/edit" element={<AdminMovieForm />} />
          
          {/* TV Shows Management Routing */}
          <Route path="/tv-shows" element={<AdminTvShows />} />
          <Route path="/tv-shows/add" element={<AdminTvShowForm />} />
          <Route path="/tv-shows/:id/edit" element={<AdminTvShowForm />} />
          <Route path="/tv-shows/:id/seasons" element={<AdminSeasons />} />
          <Route path="/tv-shows/:id/seasons/:seasonNumber/episodes" element={<AdminEpisodes />} />
          
          {/* TMDB Integration Routing */}
          <Route path="/tmdb" element={<AdminTmdb />} />
          
          {/* Users Directory Routing */}
          <Route path="/users" element={<AdminUsers />} />
          
          {/* Category Genres & General Settings */}
          <Route path="/settings" element={<AdminGenres />} />
        </Routes>
      </main>
    </div>
  );
}
