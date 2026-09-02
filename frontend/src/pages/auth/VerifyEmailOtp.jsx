import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { verifyEmailOtp, sendEmailOtp, syncUser } from "../../services/apiService";
import { FiMail, FiAlertCircle, FiCheckCircle, FiRefreshCw, FiLogOut } from "react-icons/fi";

export default function VerifyEmailOtp() {
  const { currentUser, register, logout, fetchDbProfile } = useAuth();
  const [otp, setOtp] = useState("");
  const submittingRef = useRef(false);
  const [tempUser, setTempUser] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  // UI States
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check if we have temporary registration details in sessionStorage
    const regData = sessionStorage.getItem("temp_reg_user");
    if (regData) {
      setTempUser(JSON.parse(regData));
      setOtpSent(true); // OTP was already triggered during registration step 1
    } 
    // 2. If logged in but email is unverified, retrieve details from active session
    else if (currentUser) {
      setTempUser({
        email: currentUser.email,
        fullName: currentUser.displayName || "User"
      });
    }
  }, [currentUser]);

  // Redirect to register if neither temporary registration cache nor active login session exists
  if (!currentUser && !sessionStorage.getItem("temp_reg_user")) {
    return <Navigate to="/register" replace />;
  }

  const handleSendInitialOtp = async () => {
    if (submittingRef.current) return;
    setError("");
    setMessage("");
    setLoading(true);

    try {
      submittingRef.current = true;
      await sendEmailOtp(tempUser.email);
      setOtpSent(true);
      setMessage("Verification OTP has been sent to your email address!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send verification OTP. Please try again later.");
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");
    setMessage("");

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 6) {
      return setError("Please enter a valid 6-digit OTP code.");
    }

    let otpVerified = false;
    try {
      submittingRef.current = true;
      setLoading(true);
      
      // 1. Verify OTP with Backend API
      await verifyEmailOtp(tempUser.email, trimmedOtp);
      otpVerified = true;

      let token = null;
      let firebaseUser = currentUser;

      // 2. If we are in registration mode (have tempUser.password cached), create Firebase account now
      const regData = sessionStorage.getItem("temp_reg_user");
      if (regData) {
        const parsedReg = JSON.parse(regData);
        firebaseUser = await register(parsedReg.email, parsedReg.password, parsedReg.fullName);
        token = await firebaseUser.getIdToken();
        sessionStorage.removeItem("temp_reg_user");
      } else if (currentUser) {
        token = await currentUser.getIdToken();
      }

      if (token) {
        await syncUser(token);
        await fetchDbProfile(firebaseUser);
      }

      // 3. Mark email verification step as successful
      sessionStorage.setItem("email_otp_verified", "true");

      // 4. Proceed to Home Page
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes("expired")) {
        setError("OTP expired. Please request a new OTP.");
      } else if (otpVerified) {
        setError(err.message || "OTP verified, but database profile synchronization failed.");
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleResendOtp = async () => {
    if (submittingRef.current) return;
    setError("");
    setMessage("");
    setResending(true);

    try {
      submittingRef.current = true;
      await sendEmailOtp(tempUser.email);
      setMessage("A fresh verification OTP code has been sent to your email!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to resend email OTP. Please try again later.");
    } finally {
      setResending(false);
      submittingRef.current = false;
    }
  };

  const handleChangeEmail = async () => {
    // Clear storage and navigate back to register or logout
    sessionStorage.removeItem("temp_reg_user");
    sessionStorage.removeItem("email_otp_verified");
    if (currentUser) {
      try {
        await logout();
      } catch (e) {
        console.error(e);
      }
    }
    navigate("/register");
  };

  const handleLogout = async () => {
    try {
      await logout();
      sessionStorage.removeItem("temp_reg_user");
      sessionStorage.removeItem("email_otp_verified");
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
            Verify Email OTP
          </h2>
          <p className="text-xs text-gray-400 mt-2 font-light leading-relaxed">
            Verify your email address to secure your account:<br />
            <span className="font-semibold text-white">{tempUser?.email}</span>
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

        {!otpSent ? (
          /* STEP 1 (For logged-in users): Trigger OTP dispatch */
          <div className="space-y-4">
            <button
              onClick={handleSendInitialOtp}
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <FiRefreshCw className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                "Send Verification OTP"
              )}
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all cursor-pointer text-center text-sm inline-flex items-center justify-center gap-1.5"
            >
              <FiLogOut className="h-4 w-4" />
              Back to Login
            </button>
          </div>
        ) : (
          /* STEP 2: Verify OTP input */
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
                Enter 6-Digit Email OTP
              </label>
              <input
                type="text"
                maxLength={6}
                required
                disabled={loading}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full tracking-[1rem] text-center rounded-xl border border-white/5 bg-white/5 py-4 text-xl text-white placeholder-gray-600 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 outline-none disabled:opacity-50"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={loading || resending}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all cursor-pointer text-center text-sm"
              >
                Change Account
              </button>
              <button
                type="submit"
                disabled={loading || resending}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 cursor-pointer text-center text-sm"
              >
                {loading ? (
                  <div className="h-5 w-5 mx-auto animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  "Verify Email"
                )}
              </button>
            </div>

            {/* Resend Helper Link */}
            <div className="text-center border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resending}
                className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {resending && <FiRefreshCw className="h-3 w-3 animate-spin" />}
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
