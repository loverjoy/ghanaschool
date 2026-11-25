import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (!agree) {
      setError('You must agree to the User Agreement and Privacy Policy.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await signIn(username, password);
    if (!result.success) {
      setError(result.error || 'Authentication failed.');
      setLoading(false);
    }
  };

  const handlePreset = (presetUser: string) => {
    setUsername(presetUser);
    setPassword('password');
    setAgree(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4 font-sans relative">
      {/* Upper Logo & Heading */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="p-3 bg-[#0d5c41] text-white rounded-xl mb-3 shadow-md">
          <GraduationCap size={40} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 font-display">
          GhanaEdu School Management
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">
          Multi-school educational administration platform
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-2xl shadow-xl p-8 relative overflow-hidden">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
          <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to access the system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              className="w-full bg-white border border-slate-300 focus:border-[#0d5c41] focus:ring-1 focus:ring-[#0d5c41] rounded-lg py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
              placeholder="e.g. superadmin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-white border border-slate-300 focus:border-[#0d5c41] focus:ring-1 focus:ring-[#0d5c41] rounded-lg py-2.5 pl-3.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-center font-medium">
              {error}
            </div>
          )}

          {/* Policy Agreement Checkbox */}
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="agree-checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0d5c41] focus:ring-[#0d5c41]"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <label htmlFor="agree-checkbox" className="text-xs text-slate-600 leading-normal select-none">
              I agree to the <a href="#" className="text-[#0d5c41] hover:underline font-semibold">User Agreement</a> and{' '}
              <a href="#" className="text-[#0d5c41] hover:underline font-semibold">Privacy Policy</a>. This system is for
              authorized school staff only.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0d5c41] hover:bg-[#0a4632] text-white font-bold rounded-lg transition duration-200 flex justify-center items-center gap-2 text-sm shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-5 text-center">
          <a href="#" className="text-xs font-semibold text-[#0d5c41] hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Watermark Logo */}
        <div className="absolute bottom-2.5 right-4 text-[10px] text-slate-400 font-medium">
          by Medo
        </div>
      </div>

      {/* Subtle Preset Buttons for Developer Testing */}
      <div className="mt-10 max-w-lg text-center bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Developer presets (Click to auto-fill credentials):
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => handlePreset('superadmin')}
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
          >
            SuperAdmin
          </button>
          <button
            onClick={() => handlePreset('kofi.appiah')}
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
          >
            Accra Admin
          </button>
          <button
            onClick={() => handlePreset('kwame.owusu')}
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
          >
            Kumasi Admin
          </button>
          <button
            onClick={() => handlePreset('ama.serwaa')}
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
          >
            Teacher Ama
          </button>
          <button
            onClick={() => handlePreset('kwame.boateng')}
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
          >
            Teacher Kwame
          </button>
        </div>
      </div>
    </div>
  );
}
