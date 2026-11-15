import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../../features/home/pages/Home";
import Login from "../../features/auth/pages/Login";
import Register from "../../features/auth/pages/Register";
import VerifyEmailOtp from "../../features/auth/pages/VerifyEmailOtp";
import PhoneVerification from "../../features/auth/pages/PhoneVerification";
import ForgotPasswordSelector from "../../features/auth/pages/ForgotPasswordSelector";
import ForgotPasswordEmail from "../../features/auth/pages/ForgotPasswordEmail";
import ForgotPasswordPhone from "../../features/auth/pages/ForgotPasswordPhone";
import ForgotPasswordPhoneVerify from "../../features/auth/pages/ForgotPasswordPhoneVerify";
import ForgotPasswordPhoneReset from "../../features/auth/pages/ForgotPasswordPhoneReset";
import ResetPassword from "../../features/auth/pages/ResetPassword";
import Profile from "../../features/profile/pages/Profile";
import MovieDetails from "../../features/movies/pages/MovieDetails";
import VideoPlayerPage from "../../features/movies/pages/VideoPlayerPage";
import AdminDashboard from "../../features/admin/pages/AdminDashboard";
import ProtectedRoute from "../../features/auth/components/ProtectedRoute";
import PublicRoute from "../../features/auth/components/PublicRoute";
import Movies from "../../features/movies/pages/Movies";
import TvShows from "../../features/tv/pages/TvShows";
import Premium from "../../features/payment/pages/Premium";

// High-fidelity premium placeholders for secondary routes
const Placeholder = ({ title }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0e12] px-4 text-center">
    <div className="rounded-2xl border border-white/5 bg-white/5 p-10 backdrop-blur-md max-w-md shadow-2xl">
      <h2 className="text-3xl font-extrabold text-white mb-4 uppercase tracking-wider">{title}</h2>
      <p className="text-gray-400 font-light mb-6">
        We are currently selecting and processing the best cinematic titles. Check back soon for our premium content library.
      </p>
      <div className="inline-block px-6 py-2 rounded-xl bg-gradient-to-r from-red-600/10 to-orange-600/10 text-red-500 border border-red-500/25 text-xs font-semibold uppercase tracking-widest">
        Coming Soon
      </div>
    </div>
  </div>
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Protected Main Routes (Require Email & Phone verified) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/premium"
        element={
          <ProtectedRoute>
            <Premium />
          </ProtectedRoute>
        }
      />
      <Route
        path="/movie/:id"
        element={
          <ProtectedRoute>
            <MovieDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/watch/:id"
        element={
          <ProtectedRoute>
            <VideoPlayerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Registration Verification Pipelines (Self-Guarded internally inside components to prevent loops) */}
      <Route path="/verify-email-otp" element={<VerifyEmailOtp />} />
      <Route path="/verify-phone" element={<PhoneVerification />} />

      {/* Public / Guest-only Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Forgot Password Flow */}
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordSelector />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password/email"
        element={
          <PublicRoute>
            <ForgotPasswordEmail />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password/phone"
        element={
          <PublicRoute>
            <ForgotPasswordPhone />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password/phone/verify"
        element={
          <PublicRoute>
            <ForgotPasswordPhoneVerify />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password/phone/reset"
        element={
          <PublicRoute>
            <ForgotPasswordPhoneReset />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Other placeholders (Public/Standard for now) */}
      <Route
        path="/tv-shows"
        element={
          <ProtectedRoute>
            <TvShows />
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies"
        element={
          <ProtectedRoute>
            <Movies />
          </ProtectedRoute>
        }
      />
      <Route path="/new-popular" element={<Placeholder title="New & Popular" />} />
      <Route path="/my-list" element={<Placeholder title="My List" />} />
      <Route path="*" element={<Placeholder title="404 - Not Found" />} />
    </Routes>
  );
}
