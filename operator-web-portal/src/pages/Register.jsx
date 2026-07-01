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

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', confirmPassword:'' });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!agreed) return setError('You must agree to the Terms & Conditions.');
    setError(''); setLoading(true);
    try {
      await register(
        `${form.firstName} ${form.lastName}`.trim(),
        form.email.trim().toLowerCase(),
        form.phone.trim(),
        form.password
      );
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-[#1A5F45] focus:ring-2 focus:ring-[#1A5F45]/10 transition";

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Left Hero ── */}
      <div className="hidden lg:flex flex-1 relative flex-col"
        style={{ backgroundImage: 'url(/hero-mountain.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/55" />
        <div className="relative z-10 flex flex-col h-full p-10">
          <WildvoraLogo light />
          <div className="mt-auto mb-10">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
              List your experiences<br />and reach adventurers<br />worldwide.
            </h1>
            <p className="text-white/75 text-base max-w-sm leading-relaxed">
              Join the premier community for modern explorers. Share the untamed beauty of the world and grow your adventure business.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-[520px] bg-[#f7faf6] flex flex-col items-center justify-center px-8 py-8 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <WildvoraLogo />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-1">Create Account</h2>
            <p className="text-sm text-gray-500 text-center mb-6">Start your journey with us today.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label>
                  <input id="reg-first-name" type="text" placeholder="First Name" value={form.firstName} onChange={set('firstName')} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input id="reg-last-name" type="text" placeholder="Last Name" value={form.lastName} onChange={set('lastName')} required className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input id="reg-email" type="email" placeholder="user@example.com" value={form.email} onChange={set('email')} required className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input id="reg-phone" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={set('phone')} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                  <input id="reg-password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <input id="reg-confirm-password" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} required className={inputCls} />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input id="terms-checkbox" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="w-4 h-4 accent-[#1A5F45] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I agree to the <Link to="/terms" className="text-[#1A5F45] font-semibold hover:underline">Terms &amp; Conditions</Link> and{' '}
                  <Link to="/privacy" className="text-[#1A5F45] font-semibold hover:underline">Privacy Policy</Link>.
                </span>
              </label>

              <button id="btn-create-account" type="submit" disabled={loading}
                className="w-full h-12 bg-[#1A5F45] hover:bg-[#145038] text-white font-semibold rounded-full text-sm flex items-center justify-center gap-2 transition disabled:opacity-60">
                {loading ? 'Creating account...' : 'Create Account →'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1A5F45] font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
