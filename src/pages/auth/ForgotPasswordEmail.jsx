import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiCheckCircle, FiAlertCircle, FiArrowLeft } from "react-icons/fi";

export default function ForgotPasswordEmail() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { resetPassword } = useAuth();

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) return setError("Email address is required.");

    try {
      setLoading(true);
      await resetPassword(email);
      setMessage("Password reset link has been sent to your email. Please check your inbox.");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        setError("Invalid email address or user not found. Please try again.");
      } else {
        setError("Failed to send password reset email. Please try again later.");
      }
    } finally {
      setLoading(false);
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
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#e50914] to-red-600 font-black italic text-lg text-white">
              S
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              STREAM<span className="text-[#e50914]">APP</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">
            Email Recovery
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 font-light">
            Enter your registered email to receive a password reset link
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

        <form onSubmit={handleResetSubmit} className="space-y-4">
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
            className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {/* Back navigation options */}
        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 text-sm">
          <Link
            to="/forgot-password"
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
