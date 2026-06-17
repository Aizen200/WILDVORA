import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WildvoraLogo = ({ light = false }) => (
  <div className="flex items-center gap-2">
    <svg width="28" height="28" viewBox="0 0 80 82" fill="none" className="flex-shrink-0">
      <polygon points="40,12 80,82 0,82" fill={light ? '#fff' : '#397858'} opacity={light ? 0.9 : undefined} />
      <polygon points="40,0 46,12 34,12" fill={light ? 'rgba(255,255,255,0.4)' : '#C4A482'} />
      <polygon points="40,47 60,82 20,82" fill={light ? 'rgba(255,255,255,0.2)' : '#67A8B6'} />
    </svg>
    <span className={`text-lg font-bold tracking-wide ${light ? 'text-white' : 'text-gray-900'}`}>Wildvora</span>
  </div>
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Left Hero ── */}
      <div
        className="hidden lg:flex flex-1 relative flex-col"
        style={{ backgroundImage: 'url(/hero-forest.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60" />
        <div className="relative z-10 flex flex-col h-full p-10">
          <WildvoraLogo light />
          <div className="mt-auto mb-10">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
              Discover, host, and grow<br />your outdoor adventure<br />business.
            </h1>
            <p className="text-white/75 text-base max-w-sm leading-relaxed">
              Join the community of explorers and entrepreneurs shaping the future of nature-based travel.
            </p>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-xs font-semibold uppercase tracking-widest">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Sustainably Focused Exploration
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-[480px] bg-[#F5F0EB] flex flex-col items-center justify-center px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-[380px]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome Back</h2>
            <p className="text-sm text-gray-500 mb-6">Sign in to manage your next adventure.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="explorer@wildvora.com"
                  required
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-[#1A5F45] focus:ring-2 focus:ring-[#1A5F45]/10 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" className="text-[12px] text-[#1A5F45] font-medium hover:underline">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-11 px-4 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-[#1A5F45] focus:ring-2 focus:ring-[#1A5F45]/10 transition"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#1A5F45] rounded"
                />
                <span className="text-sm text-gray-600">Remember me for 30 days</span>
              </label>

              <button id="btn-login" type="submit" disabled={loading}
                className="w-full h-12 bg-[#1A5F45] hover:bg-[#145038] text-white font-semibold rounded-full text-sm transition-all duration-150 disabled:opacity-60">
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#1A5F45] font-semibold hover:underline">Sign Up</Link>
            </p>
          </div>
          <p className="text-center text-xs text-gray-400 mt-5">© 2024 Wildvora. Built for the modern explorer.</p>
        </div>
      </div>
    </div>
  );
}
