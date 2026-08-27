import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  // Helper to translate raw Firebase auth errors to reader-friendly warnings
  const getFriendlyErrorMessage = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
        return "No account matches this email address.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return setError("Email is required.");
    }
    try {
      setMessage("");
      setError("");
      setLoading(true);
      await resetPassword(email);
      setMessage("Password reset email sent. Please check your email.");
      setEmail("");
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 py-24">
      {/* Glow effect background */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-[#12131a]/85 p-8 backdrop-blur-xl shadow-2xl">
        {/* Brand/Heading */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#e50914] to-red-600 font-black italic text-lg text-white">
              S
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              STREAM<span className="text-[#e50914]">APP</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">Reset Password</h2>
          <p className="text-xs text-gray-400 mt-1.5 font-light">Enter your email to receive a recovery link</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <FiAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Success Callout */}
        {message && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <FiCheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                <FiMail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                disabled={loading}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <p className="mt-8 text-center text-sm text-gray-400 font-light">
          Remember your details?{" "}
          <Link
            to="/login"
            className="font-semibold text-red-500 hover:text-red-400 transition-colors"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
