import { useAuth } from '../context/AuthContext';

export default function AdminTopbar() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-16 min-h-16 px-8 flex items-center justify-between sticky top-0 z-40 select-none font-sans">
      {/* Left: Branding & Search */}
      <div className="flex items-center gap-8 flex-1 max-w-xl">
        <div className="flex items-center gap-2 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 80 82" fill="none" className="flex-shrink-0">
            <polygon points="40,12 80,82 0,82" fill="#397858" />
            <polygon points="40,0 46,12 34,12" fill="#C4A482" />
            <polygon points="40,47 60,82 20,82" fill="#67A8B6" />
          </svg>
          <span className="text-xl font-bold tracking-wide text-gray-900">WildVora Admin</span>
        </div>
        
        {/* Search Input Container */}
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search hosts or listings..."
            className="w-full h-9 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-[#1A5F45] focus:ring-1 focus:ring-[#1A5F45] transition-all"
          />
        </div>
      </div>

      {/* Right: Actions & User Menu */}
      <div className="flex items-center gap-6">
        {/* Navigation Items */}
        <nav className="flex items-center gap-6 text-sm font-semibold text-gray-600">
          <span className="hover:text-gray-900 cursor-pointer transition">Dashboard</span>
          <span className="hover:text-gray-900 cursor-pointer transition">Logs</span>
          <span className="hover:text-gray-900 cursor-pointer transition">Reports</span>
        </nav>

        {/* Vertical Divider */}
        <div className="w-px h-5 bg-gray-200"></div>

        {/* Action Icons */}
        <div className="flex items-center gap-4 text-gray-500">
          <button className="hover:text-gray-900 transition relative cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          <button className="hover:text-gray-900 transition cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <button className="hover:text-gray-900 transition cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#1A5F45] text-white flex items-center justify-center font-bold text-sm overflow-hidden border border-gray-200">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
