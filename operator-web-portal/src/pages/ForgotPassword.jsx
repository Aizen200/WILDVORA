import { useState } from 'react';
import { Link } from 'react-router-dom';

const WildvoraLogo = ({ light = false }) => (
  <div className="flex items-center gap-2">
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
      <polygon points="14,2 26,22 2,22" fill={light ? '#fff' : '#1A5F45'} opacity="0.9"/>
      <polygon points="14,6 22,20 6,20" fill={light ? 'rgba(255,255,255,0.4)' : '#C4A482'} />
    </svg>
    <span className={`text-lg font-bold tracking-wide ${light ? 'text-white' : 'text-gray-900'}`}>Wildvora</span>
  </div>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setSent(true); setLoading(false); }, 1200);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Left Hero ── */}
      <div className="hidden lg:flex flex-1 relative flex-col"
        style={{ backgroundImage: 'url(/hero-forest.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
        <div className="relative z-10 flex flex-col h-full p-10">
          <WildvoraLogo light />
          <div className="mt-auto mb-16">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
              Manage bookings,<br />listings, reviews, and<br />payouts from one place.
            </h1>
          </div>
          {/* Pill badge */}
          <div className="flex items-center gap-3 bg-white/15 backdrop-blur border border-white/20 rounded-full px-5 py-3 w-fit mb-2">
            <svg width="18" height="18" viewBox="0 0 28 24" fill="none">
              <polygon points="14,2 26,22 2,22" fill="#fff" opacity="0.9"/>
              <polygon points="14,6 22,20 6,20" fill="rgba(255,255,255,0.4)"/>
            </svg>
            <span className="text-white text-sm font-medium">Join over 10,000+ modern explorers today.</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-[480px] bg-[#F5F0EB] flex flex-col items-center justify-center px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-[380px]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <WildvoraLogo />
            </div>

            {sent ? (
              <div className="text-center">
                <div className="text-5xl mb-4">✉️</div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Check your inbox</h2>
                <p className="text-sm text-gray-500 mb-6">
                  We sent a password reset link to <strong className="text-gray-700">{email}</strong>.
                  Check your spam folder if you don't see it.
                </p>
                <Link to="/login"
                  className="block w-full h-12 bg-[#1A5F45] hover:bg-[#145038] text-white font-semibold rounded-full text-sm flex items-center justify-center transition">
                  ← Back to Login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Forgot Password</h2>
                <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send you a reset link.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉</span>
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-[#1A5F45] focus:ring-2 focus:ring-[#1A5F45]/10 transition"
                      />
                    </div>
                  </div>

                  <button id="btn-send-reset" type="submit" disabled={loading}
                    className="w-full h-12 bg-[#1A5F45] hover:bg-[#145038] text-white font-semibold rounded-full text-sm flex items-center justify-center gap-2 transition disabled:opacity-60">
                    {loading ? 'Sending...' : 'Send Reset Link →'}
                  </button>
                </form>

                <Link to="/login" id="link-back-to-login"
                  className="block text-center mt-5 text-sm text-gray-500 hover:text-[#1A5F45] transition">
                  ← Back to Login
                </Link>
              </>
            )}
          </div>

          <p className="text-center text-sm text-gray-400 mt-5">
            Having trouble?{' '}
            <a href="mailto:support@wildvora.in" className="text-[#1A5F45] font-medium hover:underline">
              Contact our help center
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
