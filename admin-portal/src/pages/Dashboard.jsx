import { useState, useEffect } from 'react';
import { TrendUp, TrendDown } from '../components/shared.jsx';
import api from '../api/axios';

function BookingBadge({ status }) {
  if (status?.toLowerCase() === 'confirmed' || status === 'Confirmed') {
    return (
      <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
        Confirmed
      </span>
    );
  }
  if (status?.toLowerCase() === 'completed' || status === 'Completed') {
    return (
      <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
        Completed
      </span>
    );
  }
  if (status?.toLowerCase() === 'cancelled' || status === 'Cancelled') {
    return (
      <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#f3ede3', color: '#92693a' }}>
      {status || 'Pending'}
    </span>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalBookings: 0,
    gmv: 0,
    activeHosts: 0,
    activeCustomers: 0,
    totalOperators: 0,
    verifiedOperators: 0,
    pendingListings: 0,
    liveListings: 0,
    totalReports: 0,
    totalPayoutsAmount: 0,
    bookingGrowth: 0,
    gmvGrowth: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overviewRes, bookingsRes, notifRes] = await Promise.all([
          api.get('/admin/analytics/overview'),
          api.get('/admin/bookings'),
          api.get('/notifications'),
        ]);

        if (overviewRes.data && overviewRes.data.success) {
          const stats = overviewRes.data.analytics;
          setStatsData({
            totalBookings: stats.totalBookings || 0,
            gmv: stats.gmv || 0,
            activeHosts: stats.activeHosts || 0,
            activeCustomers: stats.activeCustomers || 0,
            totalOperators: stats.totalOperators || 0,
            verifiedOperators: stats.verifiedOperators || 0,
            pendingListings: stats.pendingListings || 0,
            liveListings: stats.liveListings || 0,
            totalReports: stats.totalReports || 0,
            totalPayoutsAmount: stats.totalPayoutsAmount || 0,
            bookingGrowth: stats.bookingGrowth || 0,
            gmvGrowth: stats.gmvGrowth || 0,
          });
        }

        if (bookingsRes.data && bookingsRes.data.success) {
          const bList = bookingsRes.data.bookings.slice(0, 3).map(b => ({
            listing: b.experience?.title || 'Wild Adventure',
            host: b.experience?.hostName || 'Guide',
            date: new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: b.status,
            amount: `₹${b.totalPrice.toLocaleString()}`,
            img: b.experience?.images?.[0] || null,
          }));
          setRecentBookings(bList);
        }

        if (notifRes.data && notifRes.data.success) {
          const nList = notifRes.data.notifications.slice(0, 3).map(n => {
            let bg = 'bg-sky-100';
            let dot = 'bg-sky-500';
            let strokeColor = '#0284c7';
            if (n.type === 'booking') {
              bg = 'bg-emerald-100';
              dot = 'bg-emerald-500';
              strokeColor = '#059669';
            } else if (n.type === 'listing') {
              bg = 'bg-amber-100';
              dot = 'bg-amber-500';
              strokeColor = '#d97706';
            }
            return {
              bg,
              dot,
              icon: (
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={2}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
              title: n.title,
              desc: n.desc,
              time: 'Just now',
            };
          });
          setRecentActivity(nList);
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsList = [
    {
      label: 'Total Bookings',
      value: statsData.totalBookings.toLocaleString(),
      change: `${statsData.bookingGrowth >= 0 ? '+' : ''}${statsData.bookingGrowth}%`,
      up: statsData.bookingGrowth >= 0,
      vs: 'vs. last week',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1A5F45" strokeWidth={1.8}>
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: 'GMV',
      value: `₹${statsData.gmv.toLocaleString()}`,
      change: `${statsData.gmvGrowth >= 0 ? '+' : ''}${statsData.gmvGrowth}%`,
      up: statsData.gmvGrowth >= 0,
      vs: 'vs. last week',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1A5F45" strokeWidth={1.8}>
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
        </svg>
      ),
    },
    {
      label: 'Operators',
      value: `${statsData.totalOperators} / ${statsData.verifiedOperators} Verif.`,
      change: 'Active',
      up: true,
      vs: 'Total registered & verified',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#c0874a" strokeWidth={1.8}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      label: 'Listings Status',
      value: `${statsData.liveListings} Live / ${statsData.pendingListings} Pend.`,
      change: 'Active',
      up: true,
      vs: 'Marketplace experiences',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1A5F45" strokeWidth={1.8}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Active Disputes / Reports',
      value: statsData.totalReports.toString(),
      change: 'Priority',
      up: false,
      vs: 'Awaiting resolution',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={1.8}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    },
    {
      label: 'Total Payouts Released',
      value: `₹${statsData.totalPayoutsAmount.toLocaleString()}`,
      change: 'Success',
      up: true,
      vs: 'Settled funds',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth={1.8}>
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="12" y1="17" x2="12" y2="17"/>
          <path d="M12 9v5"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#f0f2ef' }}>
      {/* ── Hero Banner ── */}
      <div className="relative" style={{ height: '240px', background: 'linear-gradient(135deg, #052618 0%, #0a4028 50%, #0f5c38 100%)' }}>
        <div className="relative px-8 pt-14">
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Welcome Back, Alex.
          </h1>
          <p className="text-white/65 text-sm mt-2.5 leading-relaxed max-w-sm">
            The reserves are seeing high activity this morning. Monitor registrations, check listing approval requests and manage payouts.
          </p>
        </div>
      </div>

      {/* ── Stat Cards (overlap hero) ── */}
      <div className="px-8 pt-6 pb-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statsList.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border"
              style={{
                borderColor: '#e4e8e4',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#f0f5f1' }}
                >
                  {s.icon}
                </div>
                {s.change && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-bold ${s.up ? 'text-emerald-600' : 'text-rose-500'}`}
                  >
                    {s.up ? <TrendUp /> : <TrendDown />} {s.change}
                  </span>
                )}
              </div>
              <div className="text-gray-500 text-xs font-medium mb-1">{s.label}</div>
              <div className="text-gray-900 text-xl font-extrabold tracking-tight truncate">{s.value}</div>
              <div className="text-gray-400 text-xs mt-1">{s.vs}</div>
            </div>
          ))}
        </div>

        {/* ── Bottom Section ── */}
        <div className="grid grid-cols-5 gap-6">
          {/* Recent Bookings */}
          <div
            className="col-span-3 bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e4e8e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: '#f0f2f0' }}
            >
              <h2 className="text-gray-900 font-bold text-base">Recent Bookings</h2>
            </div>

            {recentBookings.length === 0 ? (
              <div className="p-16 text-center text-gray-400 text-sm">
                No recent bookings recorded.
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div
                  className="grid px-6 py-3 text-xs font-semibold border-b"
                  style={{
                    gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.1fr',
                    color: '#9ca3af',
                    borderColor: '#f0f2f0',
                  }}
                >
                  <span>Listing</span>
                  <span>Host</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span>Amount</span>
                </div>

                {/* Rows */}
                <div className="divide-y" style={{ borderColor: '#f0f2f0' }}>
                  {recentBookings.map((b, i) => (
                    <div
                      key={i}
                      className="grid items-center px-6 py-4 hover:bg-gray-50/70 transition-all cursor-pointer"
                      style={{
                        gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.1fr',
                        borderColor: '#f0f2f0',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {b.img ? (
                          <img
                            src={b.img}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                            style={{ border: '1px solid #e4e8e4' }}
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#f0f5f1]"
                            style={{ border: '1px solid #e4e8e4' }}
                          >
                            <svg className="w-5 h-5 text-[#052618]/50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
                            </svg>
                          </div>
                        )}
                        <span className="text-gray-800 text-sm font-semibold leading-snug truncate">{b.listing}</span>
                      </div>
                      <span className="text-gray-600 text-sm truncate">{b.host}</span>
                      <span className="text-gray-400 text-xs">{b.date}</span>
                      <span><BookingBadge status={b.status} /></span>
                      <span className="text-gray-900 font-bold text-sm">{b.amount}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div
            className="col-span-2 bg-white rounded-2xl border overflow-hidden flex flex-col"
            style={{ borderColor: '#e4e8e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <div
              className="px-6 py-5 border-b"
              style={{ borderColor: '#f0f2f0' }}
            >
              <h2 className="text-gray-900 font-bold text-base">Recent Activity</h2>
            </div>

            {recentActivity.length === 0 ? (
              <div className="p-16 text-center text-gray-400 text-sm flex-1 flex items-center justify-center">
                No recent activity reports.
              </div>
            ) : (
              <div className="flex-1 divide-y px-6" style={{ borderColor: '#f0f2f0' }}>
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex gap-4 py-5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${a.bg}`}
                    >
                      {a.icon}
                    </div>
                    <div>
                      <div className="text-gray-900 text-sm font-semibold leading-snug">{a.title}</div>
                      <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">{a.desc}</div>
                      <div className="text-gray-400 text-xs mt-1">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}