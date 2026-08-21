import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiPhone, FiLock, FiAlertCircle } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../context/AuthContext";
import { sendEmailOtp } from "../services/apiService";

export default function Register() {
  // Input states
  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI States
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  // Dynamic helper: Detect if the input is an email (contains letters or @) or phone (digits only)
  const isEmail = /[a-zA-Z]/.test(emailOrPhone) || emailOrPhone.includes("@");

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName || !emailOrPhone) {
      return setError("All fields are required.");
    }

    if (isEmail) {
      // Email registration path
      if (!password || !confirmPassword) {
        return setError("Password and Confirm Password are required.");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailOrPhone)) {
        return setError("Please enter a valid email address.");
      }
      if (password.length < 6) {
        return setError("Password must be at least 6 characters.");
      }
      if (password !== confirmPassword) {
        return setError("Passwords do not match.");
      }

      try {
        setLoading(true);
        // Call API to send a real email OTP
        await sendEmailOtp(emailOrPhone);

        // Save registration state temporarily in sessionStorage
        sessionStorage.setItem(
          "temp_reg_user",
          JSON.stringify({ fullName, email: emailOrPhone, password })
        );

        // Redirect to Step 2 Verification screen
        navigate("/verify-email-otp");
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to send email OTP. Please check your backend connection.");
      } finally {
        setLoading(false);
      }
    } else {
      // Phone registration path
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(emailOrPhone)) {
        return setError("Phone number must include country code (e.g. +919876543210).");
      }

      // Save registration state temporarily in sessionStorage
      sessionStorage.setItem(
        "temp_reg_phone",
        JSON.stringify({ fullName, phoneNumber: emailOrPhone })
      );

      // Redirect to Phone Verification screen directly
      navigate("/verify-phone");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setGoogleLoading(true);
      await googleLogin();
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google authentication failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
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
            Create Account
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 font-light">
            Register today to start exploring premium content
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <FiAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                <FiUser className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Email or Mobile Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                {isEmail ? <FiMail className="h-4.5 w-4.5" /> : <FiPhone className="h-4.5 w-4.5" />}
              </span>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="Email or Mobile Number"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Conditionally show Password inputs if email registration is detected */}
          {isEmail && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Password
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
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                    <FiLock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    required
                    disabled={loading}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : isEmail ? (
              "Send Email OTP"
            ) : (
              "Submit"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center justify-center gap-3">
          <div className="h-[1px] flex-1 bg-white/5"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Or continue with</span>
          <div className="h-[1px] flex-1 bg-white/5"></div>
        </div>

        {/* Google signup */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all duration-300 disabled:opacity-50 cursor-pointer"
        >
          {googleLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </>
          )}
        </button>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-400 font-light">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-red-500 hover:text-red-400 transition-colors"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
