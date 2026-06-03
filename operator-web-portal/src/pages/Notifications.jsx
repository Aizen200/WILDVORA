import { useState } from 'react';
import Layout from '../components/Layout';

const CATEGORIES = [
  { label: 'All Activity', count: 12, id: 'all' },
  { label: 'Booking Alerts', count: 4, id: 'booking' },
  { label: 'Payment Status', count: 2, id: 'payment' },
  { label: 'Listing Updates', count: 5, id: 'listing' },
  { label: 'System Alerts', count: 1, id: 'system' }
];

const NOTIFICATIONS = [
  {
    id: 1,
    category: 'booking',
    title: 'New booking! – "Alpine Ridge Trek"',
    time: '2m ago',
    desc: 'Sarah Jenkins booked 3 spots for the upcoming weekend expedition. Please review the guest requirements.',
    badges: [{ text: 'Booking', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' }, { text: '#4491-ZV', color: 'text-gray-500 border border-gray-200' }],
    icon: (
      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </div>
    )
  },
  {
    id: 2,
    category: 'payment',
    title: 'Payout sent – $1,280.00',
    time: '4h ago',
    desc: 'Your earnings for the "Midnight Kayak Tour" series have been processed and sent to your bank account.',
    badges: [{ text: 'Payment', color: 'bg-blue-50 text-blue-600 border border-blue-100' }],
    icon: (
      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <path d="M2 10h20M12 14v-4" />
        </svg>
      </div>
    )
  },
  {
    id: 3,
    category: 'listing',
    title: 'Your listing is live!',
    time: '6h ago',
    desc: '"Cascadia Forest Survival Class" has been approved and is now visible to adventurers in the Pacific Northwest.',
    badges: [{ text: 'Listing', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' }, { text: 'View Listing', color: 'text-[#105D3D] font-bold cursor-pointer hover:underline' }],
    icon: (
      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </div>
    )
  },
  {
    id: 4,
    category: 'system',
    title: 'Security Alert: New Login',
    time: '12h ago',
    desc: "A new login was detected from a Chrome browser on MacOS (Portland, OR). If this wasn't you, reset your password.",
    badges: [{ text: 'Security', color: 'bg-amber-50 text-amber-700 border border-amber-100' }],
    icon: (
      <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
    )
  },
  {
    id: 5,
    category: 'system',
    title: 'Platform Update: New Analytics',
    time: '1d ago',
    desc: "We've added deeper insights into your seasonal booking trends. Check your updated Dashboard.",
    badges: [],
    icon: (
      <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
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
    <Layout>
      <div className="min-h-full pb-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications & Activity</h1>
            <p className="text-sm text-gray-500 mt-1">Stay updated on your wilderness bookings and payout milestones.</p>
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
              <span className="block text-[10px] font-bold text-[#105D3D] uppercase tracking-wider px-3 mb-2">Categories</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeCategory === cat.id
                      ? 'bg-emerald-50 text-[#105D3D]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeCategory === cat.id ? 'bg-[#105D3D] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Next Payout Card */}
            <div className="bg-[#EBF5FC] rounded-2xl p-5 border border-sky-100 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
                <span>Next Payout</span>
              </div>
              <div className="text-2xl font-black text-gray-900 mt-2.5">$2,450.00</div>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Expected: Oct 24, 2023</p>
            </div>
          </div>

          {/* Right Column Recent Updates list (Span 2) */}
          <div className="col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Updates</span>
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

            <button className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition mt-6 pt-4 border-t border-gray-50 w-full">
              <span>View Older Activity</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Row of 3 Metrics Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Booking Growth</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-black text-gray-800">+14%</span>
                <span className="text-[10px] text-gray-400 font-bold">vs last month</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg. Response Time</span>
              <div className="text-base font-black text-gray-800 mt-0.5">1.2 hrs</div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Promotions</span>
              <div className="text-base font-black text-gray-800 mt-0.5">3 Listings</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
