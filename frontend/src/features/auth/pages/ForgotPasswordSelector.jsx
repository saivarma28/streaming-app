import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiPhone, FiChevronRight, FiArrowLeft } from "react-icons/fi";

export default function ForgotPasswordSelector() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 py-28 relative">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-[#12131a]/85 p-8 backdrop-blur-xl shadow-2xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
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
            Choose how you would like to recover your password
          </p>
        </div>

        <div className="space-y-4">
          {/* Email Reset Link */}
          <button
            onClick={() => navigate("/forgot-password/email")}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all duration-300 group cursor-pointer text-left"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/25">
                <FiMail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Reset Using Email</h3>
                <p className="text-[10px] text-gray-400 font-light mt-0.5">We will send a password reset link to your email</p>
              </div>
            </div>
            <FiChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
          </button>

          {/* Mobile Phone OTP Reset */}
          <button
            onClick={() => navigate("/forgot-password/phone")}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all duration-300 group cursor-pointer text-left"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/25">
                <FiPhone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Reset Using Mobile Number</h3>
                <p className="text-[10px] text-gray-400 font-light mt-0.5">Verify via SMS OTP verification code</p>
              </div>
            </div>
            <FiChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Back to Login */}
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
