import { NavLink } from 'react-router-dom';

const WildvoraLogo = ({ light = false }) => (
  <div className="flex items-center gap-2">
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none" className="flex-shrink-0">
      <polygon points="14,2 26,22 2,22" fill={light ? '#fff' : '#1A5F45'} opacity="0.95"/>
      <polygon points="14,6 22,20 6,20" fill={light ? 'rgba(255,255,255,0.4)' : '#C4A482'} />
    </svg>
    <span className={`text-xl font-bold tracking-wide ${light ? 'text-white' : 'text-gray-900'}`}>WildReserve</span>
  </div>
);

const NAV = [
  { to: '/overview',  label: 'Overview',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { to: '/listings',  label: 'Listings',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 9h8M8 13h5"/></svg> },
  { to: '/bookings',  label: 'Bookings',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { to: '/hosts',     label: 'Hosts',     icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg> },
  { to: '/customers', label: 'Customers', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> },
  { to: '/payouts',   label: 'Payouts',   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M6 14h.01M10 14h.01"/></svg> },
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 min-w-64 h-screen bg-[#052618] text-[#9FB5A9] flex flex-col justify-between sticky top-0 border-r border-[#083622] overflow-y-auto select-none font-sans">
      {/* Top Section */}
      <div className="flex flex-col px-6 pt-7">
        {/* Brand */}
        <div className="flex flex-col mb-8">
          <WildvoraLogo light />
          <span className="text-[10px] text-[#5C806D] font-bold uppercase tracking-widest mt-1 pl-[36px]">Admin Console</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              id={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#C6F6D5] text-[#052618] shadow-sm'
                    : 'text-[#9FB5A9] hover:bg-[#073622] hover:text-white'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="px-6 pb-6 flex flex-col">
        {/* Support Ticket Button */}
        <button className="w-full bg-[#AEDDF4] hover:bg-[#97D0EB] text-[#052618] text-[13px] font-bold rounded-xl py-3 px-4 flex items-center justify-center gap-2 mb-6 transition duration-150 cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Support Ticket
        </button>

        {/* Links */}
        <div className="space-y-1 pt-4 border-t border-[#073822]/60">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition duration-150 ${
                isActive ? 'text-white bg-[#073622]' : 'text-[#9FB5A9] hover:text-white'
              }`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Settings
          </NavLink>
          <NavLink
            to="/help"
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition duration-150 ${
                isActive ? 'text-white bg-[#073622]' : 'text-[#9FB5A9] hover:text-white'
              }`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
            Help Center
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
