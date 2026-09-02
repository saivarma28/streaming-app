import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { auth } from "../../firebase";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { FiLock, FiCheckCircle, FiAlertCircle, FiArrowLeft } from "react-icons/fi";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or missing action code. Please request a new password reset link.");
      setVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((emailAddress) => {
        setEmail(emailAddress);
        setVerifying(false);
      })
      .catch((err) => {
        console.error("Firebase code verification error:", err);
        if (err.code === "auth/invalid-action-code") {
          setError("The password reset link is invalid. It may have already been used.");
        } else if (err.code === "auth/expired-action-code") {
          setError("The password reset link has expired. Please request a new one.");
        } else {
          setError("Failed to verify password reset link. Please try again.");
        }
        setVerifying(false);
      });
  }, [oobCode]);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      return setError("All fields are required.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      setLoading(true);
      await confirmPasswordReset(auth, oobCode, password);
      setMessage("Your password has been successfully reset. You can now log in with your new password.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Firebase confirmPasswordReset error:", err);
      if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else if (err.code === "auth/expired-action-code") {
        setError("The reset code has expired. Please request a new reset link.");
      } else if (err.code === "auth/invalid-action-code") {
        setError("The reset code is invalid. Please request a new reset link.");
      } else {
        setError("Failed to update password. Please try again.");
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
            New Password
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 font-light">
            {email ? `Resetting password for ${email}` : "Create a secure new password for your account"}
          </p>
        </div>

        {/* Verifying Spinner */}
        {verifying && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
            <p className="text-xs text-gray-400">Verifying secure action link...</p>
          </div>
        )}

        {/* Error Callout */}
        {!verifying && error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 leading-normal">
            <FiAlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Success Callout */}
        {!verifying && message && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-400 leading-normal">
            <FiCheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span className="font-semibold">{message}</span>
          </div>
        )}

        {/* Reset Password Form */}
        {!verifying && !error && !message && (
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
                  disabled={loading}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none disabled:opacity-50"
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
                  disabled={loading}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                "Update Password"
              )}
            </button>
          </form>
        )}

        {/* Back navigation options */}
        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 text-sm">
          <Link
            to="/forgot-password/email"
            className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            Request Link Again
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
