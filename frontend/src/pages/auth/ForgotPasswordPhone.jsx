import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../../firebase";
import { FiPhone, FiAlertCircle, FiCheckCircle, FiArrowLeft } from "react-icons/fi";

export default function ForgotPasswordPhone() {
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");

  // UI States
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { signInWithPhone } = useAuth();
  const recaptchaVerifierRef = useRef(null);
  const navigate = useNavigate();

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.warn("Error cleaning up recaptcha on unmount:", e);
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const getFriendlyErrorMessage = (code) => {
    switch (code) {
      case "auth/invalid-phone-number":
        return "The phone number entered is invalid. Please format it correctly (e.g. +919876543210).";
      case "auth/too-many-requests":
        return "SMS OTP requests are temporarily blocked from this device due to unusual activity. Please try again later.";
      case "auth/sms-quota-exceeded":
        return "SMS quota for this project has been exceeded. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  const handleSendOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!phoneNumber) return setError("Mobile number is required.");

    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;
    const phoneRegex = /^\+[1-9]\d{1,14}$/;

    if (!phoneRegex.test(fullPhoneNumber)) {
      return setError("Please enter a valid phone number with country code.");
    }

    try {
      setLoading(true);

      // Reset any existing recaptcha instance and clean the container DOM element
      // to avoid "reCAPTCHA has already been rendered in this element" error.
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.warn("Error clearing old recaptcha verifier:", e);
        }
        recaptchaVerifierRef.current = null;
      }

      const container = document.getElementById("forgot-recaptcha-container");
      if (container) {
        container.innerHTML = "";
      }

      // Create a fresh reCAPTCHA container instance
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "forgot-recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          setError("reCAPTCHA expired. Please try again.");
          if (recaptchaVerifierRef.current) {
            try {
              recaptchaVerifierRef.current.clear();
            } catch (e) {
              console.warn("Error clearing expired recaptcha verifier:", e);
            }
            recaptchaVerifierRef.current = null;
          }
        }
      });

      const confirmationResult = await signInWithPhone(fullPhoneNumber, recaptchaVerifierRef.current);
      
      // Store confirmationResult globally in the window object to verify in the next screen
      window.forgotPasswordConfirmation = confirmationResult;
      sessionStorage.setItem("forgot_phone_num", fullPhoneNumber);

      navigate("/forgot-password/phone/verify");
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
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

      {/* Invisible reCAPTCHA container for SMS */}
      <div id="forgot-recaptcha-container"></div>

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
            Mobile Recovery
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 font-light">
            Enter your mobile number to send a verification code
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <FiAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSendOtpSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Mobile Number
            </label>
            <div className="flex gap-2">
              {/* Country Code Select */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="rounded-xl border border-white/5 bg-white/5 py-3 px-3 text-sm text-white focus:border-red-500/40 focus:bg-white/10 outline-none w-20 cursor-pointer"
              >
                <option value="+91" className="bg-[#12131a] text-white">+91 (IN)</option>
                <option value="+1" className="bg-[#12131a] text-white">+1 (US)</option>
                <option value="+44" className="bg-[#12131a] text-white">+44 (UK)</option>
                <option value="+971" className="bg-[#12131a] text-white">+971 (AE)</option>
              </select>

              {/* Phone input */}
              <div className="relative flex-1">
                <input
                  type="tel"
                  required
                  disabled={loading}
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none disabled:opacity-50"
                />
              </div>
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
              "Send OTP"
            )}
          </button>
        </form>

        {/* Back navigation */}
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
