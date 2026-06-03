import { useState } from 'react';

const CATEGORIES = [
  { label: 'All Activity', count: 12, id: 'all' },
  { label: 'Host Alerts', count: 4, id: 'host' },
  { label: 'Payout Approvals', count: 2, id: 'payout' },
  { label: 'Listing Reviews', count: 5, id: 'listing' },
  { label: 'System Alerts', count: 1, id: 'system' }
];

const NOTIFICATIONS = [
  {
    id: 1,
    category: 'listing',
    title: 'Listing Approval Required – "Alpine Ridge Trek"',
    time: '2m ago',
    desc: 'Sarah Jenkins submitted a new listing for review. Please check the compliance requirements and photos.',
    badges: [{ text: 'Review', color: 'bg-amber-50 text-amber-600 border border-amber-100' }, { text: '#4491-ZV', color: 'text-gray-500 border border-gray-200' }],
    icon: (
      <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  },
  {
    id: 2,
    category: 'payout',
    title: 'Payout Batch Processed',
    time: '4h ago',
    desc: 'Weekly payouts for 124 hosts have been successfully submitted to Stripe Connect for processing.',
    badges: [{ text: 'Payment', color: 'bg-blue-50 text-blue-600 border border-blue-100' }],
    icon: (
      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <path d="M2 10h20M12 14v-4" />
        </svg>
      </div>
    )
  },
  {
    id: 3,
    category: 'host',
    title: 'New Host KYC Pending',
    time: '6h ago',
    desc: '"Cascadia Forest Survival Class" host uploaded ID verification documents. Action required to approve their account.',
    badges: [{ text: 'KYC', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' }, { text: 'View Host', color: 'text-[#1A5F45] font-bold cursor-pointer hover:underline' }],
    icon: (
      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4-4-4-4" />
        </svg>
      </div>
    )
  },
  {
    id: 4,
    category: 'system',
    title: 'Security Alert: Failed Admin Login',
    time: '12h ago',
    desc: "Multiple failed login attempts detected for an admin account from IP 192.168.1.4. Please review security logs.",
    badges: [{ text: 'Security', color: 'bg-red-50 text-red-700 border border-red-100' }],
    icon: (
      <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
    )
  },
  {
    id: 5,
    category: 'system',
    title: 'Platform Maintenance Scheduled',
    time: '1d ago',
    desc: "Database maintenance is scheduled for Sunday at 2:00 AM UTC. Expected downtime is 15 minutes.",
    badges: [],
    icon: (
      <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </div>
    )
  }
];

export default function Notifications() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredNotifications = activeCategory === 'all'
    ? NOTIFICATIONS
    : NOTIFICATIONS.filter(n => n.category === activeCategory);

  return (
    <div className="px-8 py-8 flex flex-col font-sans">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Stay updated on platform activity and administrative tasks.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl px-4 py-2.5 text-sm shadow-sm hover:bg-gray-50 transition">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl px-4 py-2.5 text-sm shadow-sm hover:bg-gray-50 transition">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span>Mark all as read</span>
            </button>
          </div>
        </div>

        {/* Main Grid split */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Left Column Categories */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 space-y-1">
              <span className="block text-[10px] font-bold text-[#1A5F45] uppercase tracking-wider px-3 mb-2">Categories</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-emerald-50 text-[#1A5F45]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeCategory === cat.id ? 'bg-[#1A5F45] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Platform Health Card */}
            <div className="bg-[#EBF5FC] rounded-2xl p-5 border border-sky-100 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Platform Health</span>
              </div>
              <div className="text-2xl font-black text-gray-900 mt-2.5">99.98%</div>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Uptime this week</p>
            </div>
          </div>

          {/* Right Column Recent Updates list (Span 2) */}
          <div className="col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Activity</span>
              <span className="text-[10px] text-gray-400 font-semibold">Showing last 24 hours</span>
            </div>

            <div className="space-y-6 flex-1">
              {filteredNotifications.map(n => (
                <div key={n.id} className="flex gap-4 items-start">
                  {n.icon}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-extrabold text-gray-900">{n.title}</h4>
                      <span className="text-[10px] text-gray-400 font-medium">{n.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">{n.desc}</p>
                    {n.badges.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {n.badges.map((b, idx) => (
                          <span key={idx} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.color}`}>
                            {b.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition mt-6 pt-4 border-t border-gray-50 w-full cursor-pointer">
              <span>View Older Activity</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
