"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Wordmark } from '@/components/Navbar';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Multi-step State: 1 = Request OTP, 2 = Verify OTP & Set New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Resend countdown timer (45 seconds)
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request Password Reset Code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to dispatch verification code.');
        return;
      }

      setResolvedEmail(data.email || identifier.trim());
      setMaskedEmail(data.maskedEmail || identifier.trim());
      setCooldown(45);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resolvedEmail || identifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend code.');
        return;
      }

      setCooldown(45);
      setSuccessMsg('A new verification code has been dispatched to your email.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !newPassword || !confirmPassword || loading) return;

    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resolvedEmail,
          code: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        return;
      }

      setStep(3);
    } catch (err: any) {
      setError(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center py-12 sm:py-16 px-4 sm:px-6 md:px-8 overflow-hidden bg-neutral-50 dark:bg-[#030303] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950">
      {/* Ambient Lighting Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 sm:w-225 h-125 rounded-full bg-neutral-200/50 dark:bg-neutral-800/20 blur-[140px] opacity-60 dark:opacity-40" />
      </div>

      <div className="w-full max-w-xl sm:max-w-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Wordmark />
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {step === 3 ? 'Password Recovered' : 'Reset Your Password'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {step === 1
                ? 'Enter your registered email address or username to receive a verification code.'
                : step === 2
                ? `Enter the 6-digit code sent to ${maskedEmail || resolvedEmail} and your new password.`
                : 'Your password has been successfully updated. You may now sign in.'}
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/85 dark:bg-[#0c0c0c]/90 backdrop-blur-3xl border border-neutral-200/90 dark:border-neutral-800/90 rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.7)] space-y-6">
          {/* Error Notice */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-mono flex items-center gap-3">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Notice */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-3">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── STEP 1: Enter Username / Email ─── */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-1.5 text-left">
                <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Registered Email or Username <span className="text-amber-500">*</span>
                </label>
                <div className="relative group w-full">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. user@email.com or username"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-950 dark:focus:border-white focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <motion.button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="w-full h-13 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                  {!loading && <ArrowRight size={15} />}
                </motion.button>
              </div>
            </form>
          )}

          {/* ─── STEP 2: OTP & New Password ─── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} autoComplete="off" className="space-y-5">
              {/* 6-Digit Code */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    6-Digit Verification Code <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className="font-mono text-[10.5px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                    <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>
                <div className="relative group w-full">
                  <KeyRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] font-mono text-base tracking-[0.25em] text-neutral-900 dark:text-white placeholder:text-neutral-400 placeholder:tracking-normal focus:border-neutral-950 dark:focus:border-white focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5 text-left">
                <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  New Password <span className="text-amber-500">*</span>
                </label>
                <div className="relative group w-full">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-12 pl-10 pr-10 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-neutral-950 dark:focus:border-white focus:outline-none shadow-xs"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    whileTap={{ scale: 0.8 }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer p-0.5 focus:outline-none flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <AnimatePresence initial={false}>
                        {showPassword ? (
                          <motion.span
                            key="eye-off"
                            initial={{ opacity: 0, scale: 0.6, rotate: -25 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.6, rotate: 25 }}
                            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <EyeOff size={15} />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="eye"
                            initial={{ opacity: 0, scale: 0.6, rotate: 25 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.6, rotate: -25 }}
                            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Eye size={15} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5 text-left">
                <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Confirm New Password <span className="text-amber-500">*</span>
                </label>
                <div className="relative group w-full">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full h-12 pl-10 pr-10 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-neutral-950 dark:focus:border-white focus:outline-none shadow-xs"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    whileTap={{ scale: 0.8 }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer p-0.5 focus:outline-none flex items-center justify-center"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <AnimatePresence initial={false}>
                        {showConfirmPassword ? (
                          <motion.span
                            key="confirm-eye-off"
                            initial={{ opacity: 0, scale: 0.6, rotate: -25 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.6, rotate: 25 }}
                            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <EyeOff size={15} />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="confirm-eye"
                            initial={{ opacity: 0, scale: 0.6, rotate: 25 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.6, rotate: -25 }}
                            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Eye size={15} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <motion.button
                  type="submit"
                  disabled={loading || !otpCode.trim() || !newPassword || !confirmPassword}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex-1 h-12 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Resetting...' : 'Update Password'}</span>
                  {!loading && <ArrowRight size={14} />}
                </motion.button>
              </div>
            </form>
          )}

          {/* ─── STEP 3: Success Confirmation ─── */}
          {step === 3 && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">
                  Password Updated
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  Your credentials have been securely updated. You can now log into your account with your new password.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full h-12 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          {step !== 3 && (
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-900 text-xs">
              <Link
                href="/login"
                className="font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Return to Sign In</span>
              </Link>
              <Link
                href="/register"
                className="font-bold text-neutral-900 dark:text-white hover:underline underline-offset-4"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
