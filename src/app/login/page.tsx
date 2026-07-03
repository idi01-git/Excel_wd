// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('password');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        username: username.toLowerCase().trim(),
        password,
        redirect: false
      });

      if (res?.error) {
        setError('Invalid username or password');
      } else {
        router.push('/workspace');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred during sign-in');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoIdentity = (name: string) => {
    setUsername(name);
    setPassword('password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b10] bg-[radial-gradient(circle_at_50%_0%,#151829_0%,#08090d_100%)] px-4">
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-white inline-block">
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">EXCELSIOR</span>
          </Link>
          <h2 className="text-xl font-bold text-white mt-2">Welcome Back</h2>
          <p className="text-xs text-gray-500 mt-1">Log in to publish, critique, and comment.</p>
        </div>

        {/* Demo Fast Switcher selector */}
        <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4">
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2 text-center">
            Demo Fast-Cycle Accounts
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => selectDemoIdentity('member@excelsior.club')}
              className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-xs text-gray-300 rounded font-medium text-left border border-white/5 transition"
            >
              Jane Member (MEMBER)
            </button>
            <button
              onClick={() => selectDemoIdentity('author@excelsior.club')}
              className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-xs text-gray-300 rounded font-medium text-left border border-white/5 transition"
            >
              John Author (WRITER)
            </button>
            <button
              onClick={() => selectDemoIdentity('mod@excelsior.club')}
              className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-xs text-gray-300 rounded font-medium text-left border border-white/5 transition"
            >
              Mark Moderator (MOD)
            </button>
            <button
              onClick={() => selectDemoIdentity('admin@excelsior.club')}
              className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-xs text-gray-300 rounded font-medium text-left border border-white/5 transition"
            >
              Sarah Admin (ADMIN)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg text-center">
            ️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. member"
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
              required
              className="bg-slate-950/40 border border-white/10 text-white rounded-lg p-2.5 outline-none focus:border-violet-600 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 text-white rounded-full font-semibold text-sm transition"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div className="text-center text-xs">
          <span className="text-gray-500">New to Excelsior? </span>
          <Link href="/register" className="text-cyan-400 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
