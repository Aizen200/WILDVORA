import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const FALLBACK_IMAGES = {
  Trekking:      'https://images.unsplash.com/photo-1551632811-561730d1e4a6?auto=format&fit=crop&w=400&q=80',
  Camping:       'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80',
  'Water Sports':'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=400&q=80',
  Jungle:        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80',
  Cycling:       'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80',
  Climbing:      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=400&q=80',
  Safari:        'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=400&q=80',
  Skiing:        'https://images.unsplash.com/photo-1482867996988-2faec3cbb4f9?auto=format&fit=crop&w=400&q=80',
};

const StatCard = ({ label, value, meta, badge, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-1 shadow-sm">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      {badge && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          badge.startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
        }`}>{badge}</span>
      )}
    </div>
    <div className="text-2xl font-extrabold text-gray-900">{value}</div>
    {meta && <div className="text-xs text-gray-400 mt-0.5">{meta}</div>}
    {children}
  </div>
);

const STATUS = {
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
  completed: 'bg-gray-100 text-gray-600 border border-gray-200',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const handleExportDashboard = () => {
    const csvContent = "data:text/csv;charset=utf-8,Month,Revenue,Bookings,Listings,Occupancy\nMay,₹14000,10,3,78%\nJun,₹22000,15,4,82%\nJul,₹18000,12,4,75%\nAug,₹28000,20,4,88%\nSep,₹26000,18,4,84%\nOct,₹36000,24,5,92%\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "wildvora_dashboard_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    Promise.all([
      hostAPI.getStats(),
      hostAPI.getListings(),
      hostAPI.getBookings({ status: 'confirmed' }),
    ])
      .then(([s, l, b]) => {
        setStats(s.data.stats);
        setListings(l.data.experiences.slice(0, 3));
        setBookings(b.data.bookings.slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#1A5F45] border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div id="dashboard-page" className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Good {greeting}, {user?.name?.split(' ')[0] || 'Host'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Here's what's happening with your outdoor adventures today.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Revenue"
            value={`₹${(stats?.revenueThisMonth || 0).toLocaleString()}`}
            badge="+12%"
          >
            <div className="flex gap-1 mt-2 h-8 items-end">
              {[40, 55, 45, 70, 60, 80, 65].map((h, i) => (
                <div key={i} className="flex-1 bg-[#C8E6D4] rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </StatCard>
          <StatCard
            label="Total Bookings"
            value={stats?.bookingsToday || 0}
            meta="28 new this week"
          />
          <StatCard
            label="Active Listings"
            value={stats?.totalListings || 0}
            meta="Across 4 regions"
          />
          <StatCard
            label="Avg. Occupancy"
            value={`${Math.round((stats?.averageRating || 0) / 5 * 100) || 78}%`}
          >
            <div className="h-1.5 bg-gray-100 rounded-full mt-2">
              <div className="h-1.5 bg-[#1A5F45] rounded-full" style={{ width: '78%' }} />
            </div>
          </StatCard>
        </div>

        {/* Middle: Revenue Chart + Upcoming Arrivals */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Revenue Chart */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Revenue Overview</h2>
                <p className="text-xs text-gray-400">Performance analysis over the last 6 months</p>
              </div>
              <div className="flex gap-1">
                {['6M', '1Y', 'All'].map((p, i) => (
                  <button key={p} className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
                    i === 0 ? 'bg-[#1A5F45] text-white border-[#1A5F45]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-3 h-40">
              {[35, 55, 45, 70, 65, 90].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg ${i === 5 ? 'bg-[#1A5F45]' : 'bg-[#C8E6D4]'}`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(m => (
                <span key={m} className="flex-1 text-center text-[10px] text-gray-400 font-medium">{m}</span>
              ))}
            </div>
          </div>

          {/* Upcoming Arrivals */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-0.5">Upcoming Arrivals</h2>
            <p className="text-xs text-gray-400 mb-4">Next {bookings.length || 5} confirmed guests</p>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No upcoming arrivals</p>
              ) : bookings.map(b => (
                <div key={b._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#EEF6F1] text-[#1A5F45] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {b.user?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{b.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{b.experience?.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-gray-600">
                      {new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">FULL</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Listing Performance + Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          {/* Listing Performance */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Listing Performance</h2>
              <Link to="/listings" className="text-xs text-[#1A5F45] font-semibold hover:underline">View All Listings</Link>
            </div>
            <div className="grid grid-cols-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100 mb-2 px-1">
              <span className="col-span-2">Experience</span>
              <span className="text-center">Views · Conv.</span>
              <span className="text-right">Revenue · Status</span>
            </div>
            {listings.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                No listings yet.{' '}
                <Link to="/listings/new" className="text-[#1A5F45] font-semibold">Create one</Link>
              </p>
            ) : listings.map(exp => (
              <div key={exp._id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 px-1">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                  <img
                    src={exp.images?.[0] || FALLBACK_IMAGES[exp.category] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80'}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{exp.title}</p>
                  <p className="text-xs text-gray-400 truncate">{typeof exp.location === 'object' ? `${exp.location?.city || ''}${exp.location?.country ? ', ' + exp.location.country : ''}` : exp.location}</p>
                </div>
                <div className="text-xs text-gray-400 text-center w-20">— · —</div>
                <div className="text-right w-28 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">₹{exp.price}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    STATUS[exp.status] || 'bg-gray-100 text-gray-500'
                  }`}>{exp.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-[#1A5F45] rounded-2xl p-5 text-white flex flex-col shadow-sm">
            <h2 className="text-base font-bold mb-1">Quick Actions</h2>
            <p className="text-[#A8D5BF] text-xs mb-4">Expedite your daily operations with one click.</p>
            <div className="space-y-2 flex-1">
              {[
                { label: 'Create Listing',  sub: 'Add a new wild experience',    action: () => navigate('/listings/new') },
                { label: 'View Schedule',   sub: 'Manage guide assignments',     action: () => navigate('/bookings') },
                { label: 'Export Report',   sub: 'CSV, PDF for this month',      action: handleExportDashboard },
              ].map(({ label, sub, action }) => (
                <button key={label} onClick={action}
                  className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl p-3 text-left transition">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[10px] text-[#A8D5BF]">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 text-center">
              <p className="text-[11px] text-[#A8D5BF]">
                Need help?{' '}
                <Link to="/support" className="text-white font-semibold hover:underline">Contact Support</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}