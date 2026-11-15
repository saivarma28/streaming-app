import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FiLock, FiAlertCircle, FiArrowLeft } from "react-icons/fi";

export default function ForgotPasswordPhoneReset() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // Security Check: Verify that the user successfully passed phone verification first
  const isPhoneVerified = sessionStorage.getItem("forgot_phone_verified") === "true";

  if (!isPhoneVerified) {
    return <Navigate to="/forgot-password/phone" replace />;
  }

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      return setError("All fields are required.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    // Explaining Firebase Security Limits rather than faking success
    setError("Firebase Security Limit: Direct password updates using a phone credential require a secure server session. In the next phase, we will implement the Node.js backend endpoint (POST /api/auth/reset-password-phone) to complete this reset securely.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 py-28 relative">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-[#12131a]/85 p-8 backdrop-blur-xl shadow-2xl">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#e50914] to-red-600 font-black italic text-lg text-white">
              S
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              STREAM<span className="text-[#e50914]">APP</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">
            Reset Password
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 font-light">
            Create a secure new password for your account
          </p>
        </div>

        {/* Firebase Security Callout Warning (Explicitly details the secure backend requirement) */}
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-xs text-orange-400 leading-normal">
          <FiAlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>
            <strong>Security Notice:</strong> The client-side Firebase SDK restricts password updates using a phone verification session alone to protect account integrity. A secure server-side Node.js admin handler is required.
          </span>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
            <FiAlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                <FiLock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                <FiLock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.35)] cursor-pointer mt-2"
          >
            Reset Password
          </button>
        </form>

        {/* Back navigation options */}
        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 text-sm">
          <Link
            to="/forgot-password/phone/verify"
            className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link
            to="/login"
            className="font-semibold text-red-500 hover:text-red-400 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
