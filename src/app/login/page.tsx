"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { Wordmark } from '@/components/Navbar';

// Linear-Style Form Input consistent with Register Page
const FormInput = ({ label, icon: Icon, required, type = 'text', value, onChange, placeholder, cornerAction, ...props }: any) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5 w-full text-left">
      <div className="flex items-center justify-between px-1">
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {label} {required && <span className="text-amber-500">*</span>}
        </label>
        {cornerAction}
      </div>
      <div className="relative group w-full">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 group-focus-within:text-neutral-950 dark:group-focus-within:text-white transition-colors duration-200 pointer-events-none"
          />
        )}
        <input
          type={isPassword && show ? 'text' : type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full h-12 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-10 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-950 dark:focus:border-white focus:bg-white dark:focus:bg-[#161616] focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-white/10 transition-all duration-200 outline-none shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700`}
          {...props}
        />
        {isPassword && (
          <motion.button
            type="button"
            onClick={() => setShow(!show)}
            whileTap={{ scale: 0.8 }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer p-0.5 focus:outline-none flex items-center justify-center"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            <div className="relative w-4 h-4 flex items-center justify-center">
              <AnimatePresence initial={false}>
                {show ? (
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
        )}
      </div>
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        username: username.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid username or password.');
      } else {
        router.push('/workspace');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred during sign-in.');
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
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
          >
            <Wordmark />
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Access your author workspace, draft pieces, and reviews.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/85 dark:bg-[#0c0c0c]/90 backdrop-blur-3xl border border-neutral-200/90 dark:border-neutral-800/90 rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.7)] space-y-7">
          
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

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <FormInput
              label="Username or Email"
              icon={User}
              required
              value={username}
              onChange={(e: any) => setUsername(e.target.value)}
              placeholder="e.g. shaurya or Abhinav123@ietlucknow.ac.in"
            />
            <FormInput
              label="Password"
              type="password"
              icon={Lock}
              required
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••"
              cornerAction={
                <Link
                  href="/forgot-password"
                  className="font-mono text-[10.5px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              }
            />

            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={loading || !username.trim() || !password}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-full h-13 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                {!loading && <ArrowRight size={15} />}
              </motion.button>
            </div>
          </form>

          <div className="text-center pt-2 border-t border-neutral-100 dark:border-neutral-900">
            <span className="text-xs text-neutral-500 font-medium">New to Excelsior? </span>
            <Link href="/register" className="text-xs font-bold text-neutral-900 dark:text-white hover:underline underline-offset-4">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

