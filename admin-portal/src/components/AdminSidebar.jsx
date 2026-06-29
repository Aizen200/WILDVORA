import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WildvoraLogo = ({ light = false }) => (
  <div className="flex items-center gap-2">
    <svg width="28" height="28" viewBox="0 0 80 82" fill="none" className="flex-shrink-0">
      <polygon points="40,12 80,82 0,82" fill="#397858" />
      <polygon points="40,0 46,12 34,12" fill="#C4A482" />
      <polygon points="40,47 60,82 20,82" fill="#67A8B6" />
    </svg>
    <span className={`text-xl font-bold tracking-wide ${light ? 'text-white' : 'text-gray-900'}`}>Wildvora</span>
  </div>
);

const NAV = [
  { to: '/overview',  label: 'Dashboard',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { to: '/experiences',  label: 'Experiences',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
  { to: '/partners',     label: 'Partners',     icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> },
  { to: '/destinations',  label: 'Destinations',  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> },
  { to: '/payouts',   label: 'Payouts',   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M6 14h.01M10 14h.01"/></svg> },
];

export default function AdminSidebar() {
  const { user } = useAuth();
  
  // Initials for avatar
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <aside className="w-64 min-w-64 h-screen bg-[#052618] text-[#9FB5A9] flex flex-col justify-between sticky top-0 border-r border-[#083622] overflow-y-auto select-none font-sans">
      {/* Top Section */}
      <div className="flex flex-col px-6 pt-7">
        {/* Brand */}
        <Link to="/overview" className="flex flex-col mb-8 group cursor-pointer no-underline hover:no-underline">
          <WildvoraLogo light />
          <span className="text-[10px] text-[#5C806D] font-bold uppercase tracking-widest mt-1 pl-[36px] group-hover:text-white transition-colors">Admin Command Center</span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#0a4028] text-white shadow-sm border border-[#0d5435]'
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
      <div className="px-4 pb-4 pt-4 border-t border-[#073822]/60 flex flex-col gap-3">
        {/* Profile Card */}
        <div className="flex items-center gap-3 bg-[#073622] p-3 rounded-2xl border border-[#0b4e32]">
          <div className="w-10 h-10 rounded-full bg-[#C6F6D5] text-[#052618] flex items-center justify-center font-bold text-sm">
            <span>{initials}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-white font-semibold text-sm truncate leading-snug">{user?.name || 'Admin User'}</span>
            <span className="text-[#5C806D] text-xs font-bold uppercase tracking-wider">
              {user?.role === 'admin' ? 'Super Administrator' : 'Operations Staff'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

