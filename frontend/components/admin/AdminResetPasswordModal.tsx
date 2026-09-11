"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiMail,
  FiKey,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiArrowLeft,
  FiRefreshCw,
  FiShield,
  FiCheck,
  FiLock,
} from "react-icons/fi";

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ADMIN_EMAIL = "arifulhaquerohan@gmail.com";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export default function AdminResetPasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminResetPasswordModalProps) {
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>("");

  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cooldown timer (seconds)
  const [cooldown, setCooldown] = useState(0);

  // Ref for auto-focusing OTP input
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const timeout = setTimeout(() => {
        setStep("request");
        setError(null);
        setEmail("");
        setMaskedEmail("");
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Auto focus OTP input when entering verify step
  useEffect(() => {
    if (step === "verify") {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (!isOpen) return null;

  const handleRequestOtp = async () => {
    if (cooldown > 0) return;

    const cleaned = email.trim().toLowerCase();
    if (!cleaned) {
      setError("Please enter your administrator email address.");
      return;
    }
    if (!EMAIL_REGEX.test(cleaned)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (cleaned !== ADMIN_EMAIL) {
      setError("The provided email address does not match our administrator records.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/request-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleaned }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setMaskedEmail(data.maskedEmail || cleaned);
        setStep("verify");
        setCooldown(60); // 60s cooldown before resend
      } else {
        setError(data.error || "Failed to dispatch recovery OTP. Please try again.");
      }
    } catch {
      setError("Network connection error. Please check connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanedOtp = otp.trim();
    if (!cleanedOtp || cleanedOtp.length !== 6) {
      setError("Please provide the complete 6-digit authentication code.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Master password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanedOtp,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStep("success");
      } else {
        setError(data.error || "Invalid or expired recovery code. Please try again.");
      }
    } catch {
      setError("Network connection error. Please check connectivity.");
    } finally {
      setLoading(false);
    }
  };

  // Password validation checks
  const isLengthValid = newPassword.length >= 8;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242824]/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#FCFAF7] border border-[#DED5C7] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-[#242824] animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#737D73] hover:text-[#242824] hover:bg-[#F5F2EB] transition-colors"
          aria-label="Close modal"
        >
          <FiX size={18} />
        </button>

        {/* Stepper Progress Bar */}
        <div className="mb-6 pt-1">
          <div className="flex items-center justify-between max-w-xs mx-auto mb-2">
            {/* Step 1 Indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === "request"
                    ? "bg-[#586348] text-white shadow-sm ring-4 ring-[#586348]/20"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-300"
                }`}
              >
                {step === "request" ? "1" : <FiCheck size={14} />}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#5A625A] mt-1 font-semibold">Verify</span>
            </div>

            {/* Line 1 */}
            <div
              className={`flex-1 h-[2px] mx-2 transition-colors ${
                step !== "request" ? "bg-[#586348]" : "bg-[#DED5C7]"
              }`}
            />

            {/* Step 2 Indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === "verify"
                    ? "bg-[#586348] text-white shadow-sm ring-4 ring-[#586348]/20"
                    : step === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                    : "bg-[#F5F2EB] text-[#737D73] border border-[#DED5C7]"
                }`}
              >
                {step === "success" ? <FiCheck size={14} /> : "2"}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#5A625A] mt-1 font-semibold">Reset</span>
            </div>

            {/* Line 2 */}
            <div
              className={`flex-1 h-[2px] mx-2 transition-colors ${
                step === "success" ? "bg-[#586348]" : "bg-[#DED5C7]"
              }`}
            />

            {/* Step 3 Indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === "success"
                    ? "bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-600/20"
                    : "bg-[#F5F2EB] text-[#737D73] border border-[#DED5C7]"
                }`}
              >
                3
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#5A625A] mt-1 font-semibold">Ready</span>
            </div>
          </div>
        </div>

        {/* STEP 1: REQUEST OTP */}
        {step === "request" && (
          <div>
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348]">
                <FiMail size={22} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold tracking-tight text-[#242824]">Reset Master Password</h3>
                <p className="text-xs text-[#5A625A]">Identity verification via single-use email code</p>
              </div>
            </div>

            <p className="text-sm text-[#5A625A] leading-relaxed mb-5">
              Enter your registered administrator email address. We&apos;ll verify our records and dispatch a secure 6-digit recovery code to your inbox.
            </p>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <FiAlertTriangle className="shrink-0 mt-0.5" size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#5A625A] uppercase tracking-wider mb-2">
                Administrator Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C948C]">
                  <FiMail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRequestOtp();
                  }}
                  placeholder="admin@banglasketch.com"
                  className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20 transition"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading || cooldown > 0}
                className="w-full flex items-center justify-center gap-2 bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7] font-semibold py-3.5 px-6 rounded-2xl active:scale-[0.985] transition-all shadow-md text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={16} />
                    <span>Verifying Email & Sending Code...</span>
                  </>
                ) : cooldown > 0 ? (
                  <span>Wait {cooldown}s before retrying</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <FiArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs text-[#5A625A] hover:text-[#242824] transition text-center font-medium"
              >
                Cancel and return to login
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VERIFY OTP & SET NEW PASSWORD */}
        {step === "verify" && (
          <div onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF1EA] border border-[#D5DEC4] flex items-center justify-center text-[#586348]">
                  <FiKey size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold tracking-tight text-[#242824]">Enter Recovery Code</h3>
                  <p className="text-xs text-[#5A625A]">Sent to <span className="text-[#242824] font-mono font-medium">{maskedEmail || "admin email"}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep("request")}
                className="text-xs text-[#586348] hover:text-[#242824] flex items-center gap-1 transition font-medium"
                title="Change email address"
              >
                <FiArrowLeft size={12} /> Edit Email
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <FiAlertTriangle className="shrink-0 mt-0.5" size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Segmented OTP 6-Digit Display */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#5A625A] uppercase tracking-wider mb-2">
                6-Digit Verification Code
              </label>

              {/* Interactive Segmented Boxes */}
              <div
                className="relative cursor-text"
                onClick={() => otpInputRef.current?.focus()}
              >
                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                  {Array.from({ length: 6 }).map((_, index) => {
                    const digit = otp[index] || "";
                    const isCurrent = otp.length === index;
                    return (
                      <div
                        key={index}
                        className={`h-14 sm:h-16 rounded-2xl flex items-center justify-center font-mono text-2xl font-bold transition-all ${
                          digit
                            ? "bg-white border-2 border-[#586348] text-[#242824] shadow-xs"
                            : isCurrent
                            ? "bg-white border-2 border-[#586348] ring-2 ring-[#586348]/20"
                            : "bg-[#F5F2EB] border border-[#DED5C7] text-[#8C948C]"
                        }`}
                      >
                        {digit}
                      </div>
                    );
                  })}
                </div>

                {/* Hidden actual input covering the area for native paste & keyboard */}
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError(null);
                  }}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-text"
                  autoFocus
                />
              </div>

              {/* Resend Helper */}
              <div className="mt-2 flex items-center justify-between text-xs text-[#737D73] px-1">
                <span>Code expires in 10 minutes</span>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading || cooldown > 0}
                  className="text-[#586348] hover:text-[#242824] hover:underline disabled:opacity-50 font-medium inline-flex items-center gap-1"
                >
                  <FiRefreshCw size={11} className={cooldown > 0 ? "animate-spin" : ""} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                </button>
              </div>
            </div>

            {/* New Password Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#5A625A] uppercase tracking-wider mb-2">
                New Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C948C]">
                  <FiLock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl pl-11 pr-11 py-3 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737D73] hover:text-[#242824] p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#5A625A] uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C948C]">
                  <FiShield size={16} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Re-enter new password"
                  className="w-full bg-[#FCFAF7] border border-[#DED5C7] rounded-2xl pl-11 pr-11 py-3 text-sm text-[#242824] placeholder:text-[#8C948C] focus:outline-none focus:border-[#586348] focus:ring-2 focus:ring-[#586348]/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737D73] hover:text-[#242824] p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Live Password Requirement Indicators */}
            <div className="mb-6 grid grid-cols-2 gap-2 text-[11px] p-3 rounded-xl bg-[#F5F2EB] border border-[#DED5C7]">
              <div className={`flex items-center gap-1.5 ${isLengthValid ? "text-emerald-700 font-medium" : "text-[#737D73]"}`}>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isLengthValid ? "bg-emerald-100 text-emerald-700" : "bg-[#DED5C7] text-[#5A625A]"}`}>
                  <FiCheck size={10} />
                </div>
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isMatch ? "text-emerald-700 font-medium" : "text-[#737D73]"}`}>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isMatch ? "bg-emerald-100 text-emerald-700" : "bg-[#DED5C7] text-[#5A625A]"}`}>
                  <FiCheck size={10} />
                </div>
                <span>Passwords match</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.length !== 6 || !isLengthValid || !isMatch}
                className="w-full flex items-center justify-center gap-2 bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7] font-semibold py-3.5 px-6 rounded-2xl active:scale-[0.985] transition-all shadow-md text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={16} />
                    <span>Verifying Code & Updating...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={16} />
                    <span>Confirm & Reset Password</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full py-2.5 text-xs text-[#5A625A] hover:text-[#242824] transition text-center font-medium"
              >
                Back to email entry
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === "success" && (
          <div className="text-center py-4">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="relative w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center shadow-sm">
                <FiCheckCircle size={38} />
              </div>
            </div>

            <h3 className="font-serif text-2xl font-bold tracking-tight text-[#242824] mb-2">Password Reset Successful!</h3>
            <p className="text-sm text-[#5A625A] leading-relaxed mb-6 max-w-sm mx-auto">
              Your master administrator credentials have been securely updated. A confirmation notice was dispatched to your email for audit tracking.
            </p>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onSuccess) onSuccess();
              }}
              className="w-full bg-[#242824] hover:bg-[#383E38] text-[#FCFAF7] font-semibold py-3.5 px-6 rounded-2xl transition-all shadow-md text-sm"
            >
              Sign In to Admin Panel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
