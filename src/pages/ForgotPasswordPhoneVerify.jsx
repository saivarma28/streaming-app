import React, { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { FiPhone, FiAlertCircle, FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";

export default function ForgotPasswordPhoneVerify() {
  const [otpCode, setOtpCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // UI States
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { signInWithPhone } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedPhone = sessionStorage.getItem("forgot_phone_num");
    if (savedPhone) {
      setPhoneNumber(savedPhone);
    }
  }, []);

  // Redirect if no verification session exists
  if (!window.forgotPasswordConfirmation && !sessionStorage.getItem("forgot_phone_num")) {
    return <Navigate to="/forgot-password/phone" replace />;
  }

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otpCode || otpCode.length < 6) {
      return setError("Please enter the 6-digit OTP code.");
    }

    try {
      setLoading(true);

      if (!window.forgotPasswordConfirmation) {
        return setError("Verification session expired. Please request the OTP again.");
      }

      // Verify OTP code
      await window.forgotPasswordConfirmation.confirm(otpCode);

      // Store phone verification success flag in sessionStorage
      sessionStorage.setItem("forgot_phone_verified", "true");

      navigate("/forgot-password/phone/reset");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Incorrect OTP code. Please check the code and try again.");
      } else if (err.code === "auth/code-expired") {
        setError("The OTP code has expired. Please click resend to get a new code.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
      // Re-setup recaptcha
      const recaptchaVerifier = new RecaptchaVerifier(auth, "forgot-verify-recaptcha", {
        size: "invisible",
        callback: () => {}
      });

      const confirmationResult = await signInWithPhone(phoneNumber, recaptchaVerifier);
      window.forgotPasswordConfirmation = confirmationResult;
      setMessage("A fresh SMS OTP code has been sent to your mobile number!");
    } catch (err) {
      console.error(err);
      setError("Failed to resend SMS OTP. Please check your network connection.");
    } finally {
      setResending(false);
    }
  };

  const handleChangeNumber = () => {
    window.forgotPasswordConfirmation = null;
    sessionStorage.removeItem("forgot_phone_num");
    sessionStorage.removeItem("forgot_phone_verified");
    navigate("/forgot-password/phone");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 py-28 relative">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>

      {/* Invisible reCAPTCHA container for SMS */}
      <div id="forgot-verify-recaptcha"></div>

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-[#12131a]/85 p-8 backdrop-blur-xl shadow-2xl">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600/10 text-red-500 mb-4 border border-red-500/20">
            <FiPhone className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">
            Verify Phone OTP
          </h2>
          <p className="text-xs text-gray-400 mt-2 font-light leading-relaxed">
            Enter the 6-digit OTP code sent to your mobile number:<br />
            <span className="font-semibold text-white">{phoneNumber}</span>
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

        <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
              6-Digit SMS OTP Code
            </label>
            <input
              type="text"
              maxLength={6}
              required
              disabled={loading}
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full tracking-[1rem] text-center rounded-xl border border-white/5 bg-white/5 py-4 text-xl text-white placeholder-gray-600 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleChangeNumber}
              disabled={loading || resending}
              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all cursor-pointer text-center text-sm"
            >
              Change Number
            </button>
            <button
              type="submit"
              disabled={loading || resending}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 cursor-pointer text-center text-sm"
            >
              {loading ? (
                <div className="h-5 w-5 mx-auto animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                "Verify OTP"
              )}
            </button>
          </div>

          {/* Resend Helper Link */}
          <div className="text-center border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading || resending}
              className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              Resend OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
