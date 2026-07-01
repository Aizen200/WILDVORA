import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children, compact = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#f7faf6] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-72">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input id="search-input" type="text" placeholder="Search experiences, guests, or IDs..." className="text-sm text-gray-600 bg-transparent placeholder-gray-400 outline-none flex-1" />
          </div>
          <div className="flex items-center gap-3">
            <button id="btn-notifications" onClick={() => navigate('/notifications')} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            </button>
            <button id="btn-help" onClick={() => navigate('/support')} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
            </button>
            <div 
              id="topbar-profile"
              onClick={() => navigate('/settings')} 
              className="flex items-center gap-2.5 pl-3 border-l border-gray-200 cursor-pointer hover:opacity-80 transition"
            >
              <div className="text-right">
                <p className="text-[13px] font-semibold text-gray-800 leading-tight">{user?.name || 'Host'}</p>
                <p className="text-[11px] text-gray-400 leading-tight">Mountain Guide</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#1A5F45] text-white flex items-center justify-center text-sm font-bold border border-gray-200">
                <span>{user?.name?.[0] || 'H'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className={`flex-1 animate-fade-in-up ${compact ? 'overflow-hidden flex flex-col' : 'overflow-y-auto p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
