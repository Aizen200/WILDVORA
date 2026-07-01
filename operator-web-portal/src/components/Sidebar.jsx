import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';

const NAV = [
  { to: '/',              label: 'Dashboard',     end: true,  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { to: '/listings',      label: 'Listings',      end: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 9h8M8 13h5"/></svg> },
  { to: '/bookings',      label: 'Bookings',      end: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { to: '/analytics',     label: 'Analytics',     end: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  { to: '/reviews',       label: 'Reviews',       end: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
  { to: '/payouts',       label: 'Payouts',       end: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
  { to: '/notifications', label: 'Notifications', end: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg> },
  { to: '/messages',      label: 'Messages',      end: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"/></svg> },
  { to: '/marketplace',   label: 'Marketplace',   end: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
];

export default function Sidebar() {
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();

  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    return saved ? parseInt(saved, 10) : 160;
  });

  const startResizing = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = width;
    const startX = mouseDownEvent.clientX;

    const handleMouseMove = (mouseMoveEvent) => {
      const currentX = mouseMoveEvent.clientX;
      // Allow dynamic resizing from 140px up to 500px (or more)
      const newWidth = Math.max(140, Math.min(500, startWidth + (currentX - startX)));
      setWidth(newWidth);
    };

    const handleMouseUp = (mouseUpEvent) => {
      const finalX = mouseUpEvent.clientX;
      const finalWidth = Math.max(140, Math.min(500, startWidth + (finalX - startX)));
      localStorage.setItem('sidebar-width', finalWidth.toString());

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.removeProperty('user-select');
      document.body.style.removeProperty('cursor');
    };

    document.body.style.setProperty('user-select', 'none');
    document.body.style.setProperty('cursor', 'col-resize');

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      <aside 
        style={{ width: `${width}px`, minWidth: `${width}px` }}
        className="h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0 relative z-30 flex-shrink-0"
      >
        {/* Scrollable Container for Sidebar Contents */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Brand */}
          <div 
            onClick={() => navigate('/')}
            className="px-5 pt-6 pb-4 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <svg width="28" height="28" viewBox="0 0 80 82" fill="none" className="flex-shrink-0">
                <polygon points="40,12 80,82 0,82" fill="#397858" />
                <polygon points="40,0 46,12 34,12" fill="#C4A482" />
                <polygon points="40,47 60,82 20,82" fill="#67A8B6" />
              </svg>
              <span className="text-base font-extrabold text-[#1A5F45] tracking-wide">Wildvora</span>
            </div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest ml-7">Operator Portal</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 space-y-0.5">
            {NAV.map(({ to, label, end, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                id={`nav-${label.toLowerCase().replace(' ', '-')}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#EEF6F1] text-[#1A5F45] font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Create New Listing CTA */}
          <div className="px-3 pb-4">
            <button
              id="btn-create-listing"
              onClick={() => navigate('/listings/new')}
              className="w-full bg-[#1A5F45] hover:bg-[#145038] text-white text-[12px] font-semibold rounded-xl py-3 px-3 leading-tight transition flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-left">
                Create New<br />Listing
              </span>
            </button>
          </div>

          {/* Bottom Links */}
          <div className="border-t border-gray-100 px-3 py-4 space-y-0.5">
            <NavLink to="/settings" id="nav-settings"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${isActive ? 'bg-[#EEF6F1] text-[#1A5F45]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              Settings
            </NavLink>
            <NavLink to="/support" id="nav-support"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${isActive ? 'bg-[#EEF6F1] text-[#1A5F45]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
              Support
            </NavLink>
            <button id="btn-logout" onClick={() => setShowLogout(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all text-left">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Logout
            </button>
          </div>
        </div>

        {/* Resizable Drag Handle Bar */}
        <div
          onMouseDown={startResizing}
          className="absolute top-0 -right-[4px] w-[8px] h-full cursor-col-resize z-50 group touch-none"
        >
          <div className="w-[2px] h-full mx-auto bg-transparent group-hover:bg-[#1A5F45]/30 group-active:bg-[#1A5F45] transition-colors" />
        </div>
      </aside>

      {showLogout && <LogoutModal onClose={() => setShowLogout(false)} />}
    </>
  );
}
