import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { RecaptchaVerifier, updateProfile } from "firebase/auth";
import { auth } from "../../firebase";
import { FiPhone, FiLock, FiAlertCircle, FiCheckCircle, FiLogOut, FiArrowLeft } from "react-icons/fi";
import { syncUser } from "../../services/apiService";

export default function PhoneVerification() {
  const { currentUser, signInWithPhone, linkPhone, logout, fetchDbProfile } = useAuth();
  const [step, setStep] = useState(1); // 1 = Enter Phone, 2 = Enter SMS OTP

  // Inputs
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // UI States
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // References
  const confirmationResultRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const navigate = useNavigate();

  // Load temporary signup phone data if available
  useEffect(() => {
    const savedPhoneData = sessionStorage.getItem("temp_reg_phone");
    if (savedPhoneData) {
      try {
        const parsed = JSON.parse(savedPhoneData);
        if (parsed.phoneNumber) {
          const rawNum = parsed.phoneNumber.trim();
          // Extract country code if present
          const matchedCode = ["+91", "+1", "+44", "+971"].find(c => rawNum.startsWith(c));
          if (matchedCode) {
            setCountryCode(matchedCode);
            setPhoneNumber(rawNum.substring(matchedCode.length));
          } else {
            setPhoneNumber(rawNum);
          }
        }
      } catch (e) {
        console.error("Failed to parse temporary registration phone number:", e);
      }
    }
  }, []);

  // Route protection inside component
  const tempPhoneData = sessionStorage.getItem("temp_reg_phone");
  if (!currentUser && !tempPhoneData) {
    return <Navigate to="/login" replace />;
  }

  // Check email verification state (only if they logged in with email, not doing phone signup)
  if (currentUser) {
    const isEmailVerified = currentUser.emailVerified || sessionStorage.getItem("email_otp_verified") === "true";
    if (!isEmailVerified) {
      return <Navigate to="/verify-email-otp" replace />;
    }

    // If phone is already verified/linked, redirect to home page
    if (currentUser.phoneNumber) {
      return <Navigate to="/" replace />;
    }
  }

  // Clean up reCAPTCHA on unmount
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

  const getFriendlyErrorMessage = (err) => {
    const code = err?.code || "";
    switch (code) {
      case "auth/invalid-phone-number":
        return "The phone number entered is invalid. Please format it correctly (e.g. +919876543210).";
      case "auth/missing-phone-number":
        return "Phone number is required.";
      case "auth/too-many-requests":
        return "We have blocked requests from this device due to unusual activity. Please try again later.";
      case "auth/sms-quota-exceeded":
        return "SMS quota for this project has been exceeded. Please try again later or contact support.";
      case "auth/invalid-verification-code":
        return "Incorrect OTP code. Please check the code and try again.";
      case "auth/code-expired":
        return "The OTP code has expired. Please click resend to get a new code.";
      case "auth/provider-already-linked":
        return "This phone number is already linked to another account.";
      case "auth/credential-already-in-use":
        return "This phone number is already in use by another user.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again.";
      default:
        return err?.message || "An error occurred during phone verification. Please try again.";
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setMessage("");

    if (!phoneNumber) {
      return setError("Phone number is required.");
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;
    const phoneRegex = /^\+[1-9]\d{1,14}$/;

    if (!phoneRegex.test(fullPhoneNumber)) {
      return setError("Please enter a valid phone number with country code.");
    }

    try {
      setLoading(true);

      // Reset any existing recaptcha instance and clean the container DOM element
      // to avoid \"reCAPTCHA has already been rendered in this element\" error.
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.warn("Error clearing old recaptcha verifier:", e);
        }
        recaptchaVerifierRef.current = null;
      }

      const container = document.getElementById("phone-recaptcha-container");
      if (container) {
        container.innerHTML = "";
      }

      // Create a fresh reCAPTCHA container instance
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "phone-recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          setError("reCAPTCHA session expired. Please request the OTP again.");
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
      confirmationResultRef.current = confirmationResult;

      setMessage("SMS OTP sent successfully to your mobile number!");
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
      // Reset reCAPTCHA on failure so it can re-render fresh
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otpCode || otpCode.length < 6) {
      return setError("Please enter the 6-digit OTP code.");
    }

    try {
      setLoading(true);

      if (!confirmationResultRef.current) {
        return setError("Verification session expired. Please request the OTP again.");
      }

      let token = null;

      if (currentUser) {
        // Link phone number to current user account
        const user = await linkPhone(confirmationResultRef.current.verificationId, otpCode);
        token = await user.getIdToken();
      } else {
        // Sign in new phone-only user
        const userCredential = await confirmationResultRef.current.confirm(otpCode);
        let user = userCredential.user;
        const savedPhoneData = JSON.parse(sessionStorage.getItem("temp_reg_phone"));
        if (savedPhoneData && savedPhoneData.fullName) {
          await updateProfile(user, { displayName: savedPhoneData.fullName });
          user = auth.currentUser;
        }
        token = await user.getIdToken();
      }

      if (token) {
        await syncUser(token);
        await fetchDbProfile(user);
      }

      // Success! Clear session storage flags and redirect to Home
      sessionStorage.removeItem("email_otp_verified");
      sessionStorage.removeItem("temp_reg_phone");
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      sessionStorage.removeItem("email_otp_verified");
      sessionStorage.removeItem("temp_reg_phone");
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

      {/* Invisible reCAPTCHA container for SMS */}
      <div id="phone-recaptcha-container"></div>

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-[#12131a]/85 p-8 backdrop-blur-xl shadow-2xl">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600/10 text-red-500 mb-4 border border-red-500/20">
            <FiPhone className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">
            {step === 1 ? "Verify Mobile" : "SMS OTP Code"}
          </h2>
          <p className="text-xs text-gray-400 mt-2 font-light leading-relaxed">
            {step === 1
              ? "Verify your phone number with SMS OTP to secure your account"
              : `Enter the 6-digit OTP sent to your mobile number.`}
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

        {step === 1 ? (
          /* STEP 1: Enter Phone Number */
          <form onSubmit={handleSendOtp} className="space-y-4">
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
                "Send SMS OTP"
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: Enter SMS OTP code */
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
                Enter 6-Digit Code
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
                onClick={() => {
                  setStep(1);
                  setError("");
                  setMessage("");
                  setOtpCode("");
                }}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all cursor-pointer text-center text-sm inline-flex items-center justify-center gap-1.5"
              >
                <FiArrowLeft className="h-4 w-4" />
                Change Number
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 cursor-pointer text-center text-sm"
              >
                {loading ? (
                  <div className="h-5 w-5 mx-auto animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  "Verify Phone"
                )}
              </button>
            </div>

            {/* Resend Helper Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Logout/Back Option */}
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
