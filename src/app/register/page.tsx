// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.error || 'Failed to register account');
        setLoading(false);
        return;
      }

      // Automatically sign in upon registration
      const signinRes = await signIn('credentials', {
        username: username.toLowerCase().trim(),
        password,
        redirect: false
      });

      if (signinRes?.error) {
        setError('Registered, but failed to log in automatically');
      } else {
        router.push('/workspace');
        router.refresh();
      }

    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b10] bg-[radial-gradient(circle_at_50%_0%,#151829_0%,#08090d_100%)] px-4">
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-white inline-block">
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">EXCELSIOR</span>
          </Link>
          <h2 className="text-xl font-bold text-white mt-2">Join Excelsior</h2>
          <p className="text-xs text-gray-500 mt-1">Become part of the campus literary ecosystem.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg text-center">
            ️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Full Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Member"
              required
              className="bg-slate-950/40 border border-white/10 text-white rounded-lg p-2.5 outline-none focus:border-violet-600 transition text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Campus Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane@student.edu"
              required
              className="bg-slate-950/40 border border-white/10 text-white rounded-lg p-2.5 outline-none focus:border-violet-600 transition text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jane_writes"
              required
              className="bg-slate-950/40 border border-white/10 text-white rounded-lg p-2.5 outline-none focus:border-violet-600 transition text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-slate-950/40 border border-white/10 text-white rounded-lg p-2.5 outline-none focus:border-violet-600 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 text-white rounded-full font-semibold text-sm transition"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="text-center text-xs">
          <span className="text-gray-500">Already registered? </span>
          <Link href="/login" className="text-cyan-400 hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
