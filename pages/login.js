import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push('/dashboard/businesses'), 900);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-[420px] px-8 py-10">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[22px] font-bold text-gray-900 text-center tracking-tight mb-1">Welcome back</h1>
        <p className="text-[13px] text-gray-400 text-center mb-8">Enter your credentials to access your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              defaultValue="admin@crmwarsaw.pl"
              required
              className="w-full px-3.5 py-2.5 text-[13px] text-gray-800 bg-white border border-gray-200 rounded-lg outline-none placeholder-gray-300 focus:ring-2 focus:ring-gray-200 focus:border-transparent transition hover:border-gray-300"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Password</label>
              <button type="button" className="text-[12px] text-blue-500 hover:text-blue-600 transition-colors">
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              defaultValue="password"
              required
              className="w-full px-3.5 py-2.5 text-[13px] text-gray-800 bg-white border border-gray-200 rounded-lg outline-none placeholder-gray-300 focus:ring-2 focus:ring-gray-200 focus:border-transparent transition hover:border-gray-300"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 active:bg-black disabled:opacity-60 text-white text-[13px] font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in...
              </>
            ) : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-[12px] text-gray-300 mt-6">
          CRM Warsaw · Internal use only
        </p>

      </div>
    </div>
  );
}
