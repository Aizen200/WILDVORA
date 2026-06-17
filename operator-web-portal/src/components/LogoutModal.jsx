import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const WildvoraLogo = () => (
  <div className="flex items-center justify-center gap-2">
    <svg width="28" height="28" viewBox="0 0 80 82" fill="none" className="flex-shrink-0">
      <polygon points="40,12 80,82 0,82" fill="#397858" />
      <polygon points="40,0 46,12 34,12" fill="#C4A482" />
      <polygon points="40,47 60,82 20,82" fill="#67A8B6" />
    </svg>
    <span className="text-lg font-bold text-gray-900">Wildvora</span>
  </div>
);

export default function LogoutModal({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      id="logout-modal-backdrop"
      className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        id="logout-modal"
        className="bg-white rounded-2xl shadow-2xl p-10 w-[400px] max-w-[90vw] relative text-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          id="btn-close-modal"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition text-lg"
        >✕</button>

        {/* Logo */}
        <div className="mb-6">
          <WildvoraLogo />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Log Out?</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-7">
          Are you sure you want to log out of your session? You will need to sign in again to access your adventures.
        </p>

        <button
          id="btn-confirm-logout"
          onClick={handleLogout}
          className="w-full h-12 bg-[#1A5F45] hover:bg-[#145038] text-white font-semibold rounded-full text-sm transition mb-3"
        >
          Logout
        </button>

        <button
          id="btn-cancel-logout"
          onClick={onClose}
          className="w-full h-12 border border-gray-200 rounded-full text-sm text-gray-700 font-medium hover:border-gray-400 transition"
        >
          Cancel
        </button>

        {user && (
          <p className="mt-5 text-[11px] text-gray-300 uppercase tracking-widest font-medium">
            Wildvora Explorer ID: WV-{user._id?.slice(-4).toUpperCase() || '0000'}
          </p>
        )}
      </div>
    </div>
  );
}
