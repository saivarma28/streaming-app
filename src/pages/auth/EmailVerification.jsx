import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../firebase";
import { FiMail, FiCheckCircle, FiAlertCircle, FiLogOut, FiRefreshCw } from "react-icons/fi";

export default function EmailVerification() {
  const { currentUser, reloadUser, logout } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  // If no user is logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If already verified, redirect to check phone or home page
  if (currentUser.emailVerified) {
    return <Navigate to="/" replace />;
  }

  const handleResendEmail = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMessage("Verification link sent! Please check your email inbox.");
      } else {
        setError("Session expired. Please log in again.");
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few moments before trying again.");
      } else {
        setError("Failed to send verification email. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setError("");
    setMessage("");
    setChecking(true);

    try {
      await reloadUser();
      // Wait for React state updates. If it succeeds, the component will re-render and trigger the redirect at the top.
      if (auth.currentUser && auth.currentUser.emailVerified) {
        navigate("/");
      } else {
        setError("Email not verified yet. Please click the link in your email and try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while refreshing your status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 py-28 relative">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-[#12131a]/85 p-8 backdrop-blur-xl shadow-2xl">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600/10 text-red-500 mb-4 border border-red-500/20">
            <FiMail className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">
            Verify Your Email
          </h2>
          <p className="text-xs text-gray-400 mt-2 font-light leading-relaxed">
            We have sent a verification email to: <br />
            <span className="font-semibold text-white">{currentUser.email}</span>
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <FiAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Success Callout */}
        {message && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <FiCheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{message}</span>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleCheckVerification}
            disabled={checking || loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 cursor-pointer"
          >
            {checking ? (
              <FiRefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              "I Have Verified"
            )}
          </button>

          <button
            onClick={handleResendEmail}
            disabled={checking || loading}
            className="w-full flex items-center justify-center py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all duration-300 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              "Resend Verification Email"
            )}
          </button>
        </div>

        {/* Back to Login Option */}
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <FiLogOut className="h-4 w-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
