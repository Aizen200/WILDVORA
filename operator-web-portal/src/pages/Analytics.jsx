import { useState, useEffect, useMemo } from 'react';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// Group bookings into 4 weekly buckets based on startDate within last 30 days
function getWeeklyBuckets(bookings) {
  const now = Date.now();
  const buckets = [0, 0, 0, 0];
  bookings.forEach(b => {
    const msAgo = now - new Date(b.startDate).getTime();
    const daysAgo = msAgo / (1000 * 60 * 60 * 24);
    if (daysAgo <= 7)        buckets[3]++;
    else if (daysAgo <= 14) buckets[2]++;
    else if (daysAgo <= 21) buckets[1]++;
    else if (daysAgo <= 30) buckets[0]++;
  });
  return buckets;
}

// Get category distribution from listings
function getCategoryDist(listings) {
  const counts = {};
  listings.forEach(l => { counts[l.category] = (counts[l.category] || 0) + 1; });
  const total = listings.length || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cat, count]) => ({ cat, pct: Math.round((count / total) * 100) }));
}

const CAT_COLORS = ['#105D3D','#2B7A9B','#C4A482','#9CA3AF'];

export default function Analytics() {
  const [stats, setStats]       = useState(null);
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [period, setPeriod]     = useState('Last 30 Days');

  useEffect(() => {
    Promise.all([hostAPI.getStats(), hostAPI.getBookings({}), hostAPI.getListings()])
      .then(([statsRes, bookingsRes, listingsRes]) => {
        setStats(statsRes.data.stats);
        setBookings(bookingsRes.data.bookings);
        setListings(listingsRes.data.experiences);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const weeklyBuckets = useMemo(() => getWeeklyBuckets(bookings), [bookings]);
  const maxBucket = Math.max(...weeklyBuckets, 1);
  const catDist = useMemo(() => getCategoryDist(listings), [listings]);
  const revenue = stats?.revenueThisMonth || 0;

  return (
    <Layout>
      <div className="min-h-full pb-8">
        {/* Breadcrumb */}
        <nav className="text-xs font-semibold text-gray-400 mb-2">
          Analytics &rsaquo; <span className="text-[#105D3D]">Insights Dashboard</span>
        </nav>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <div className="flex items-center gap-3">
            {/* Period selector pill container */}
            <div className="flex bg-white border border-gray-200 rounded-full p-1 shadow-sm">
              {['Last 30 Days', 'Quarterly', 'Yearly'].map(p => (
                <button
                  key={p}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    period === p ? 'bg-[#105D3D] text-white' : 'text-gray-500 hover:text-gray-800'
                  }`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            {/* Export PDF Button */}
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#105D3D] hover:bg-[#0c4e32] text-white font-semibold rounded-xl px-4 py-2.5 text-sm shadow-sm transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V3m0 0L8 7m4-4l4 4"/>
              </svg>
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-500 font-semibold">Loading dashboard analytics...</div>
        ) : (
          <div className="space-y-6">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Revenue',
                  value: `₹${(stats?.revenueThisMonth || 0).toLocaleString('en-IN')}`,
                  sub: 'This month',
                  color: 'border-l-[#105D3D]',
                },
                {
                  label: 'Total Bookings',
                  value: bookings.length,
                  sub: `${bookings.filter(b => b.status === 'pending').length} pending`,
                  color: 'border-l-blue-400',
                },
                {
                  label: 'Active Listings',
                  value: listings.filter(l => l.status === 'live' || l.status === 'active').length,
                  sub: `${listings.length} total`,
                  color: 'border-l-amber-400',
                },
                {
                  label: 'Avg. Rating',
                  value: stats?.averageRating?.toFixed(1) ?? '—',
                  sub: 'Guest satisfaction',
                  color: 'border-l-rose-400',
                },
              ].map(m => (
                <div key={m.label} className={`bg-white rounded-2xl border-l-[3px] ${m.color} shadow-sm p-5`}>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{m.label}</span>
                  <div className="text-2xl font-black text-gray-900 mt-1 mb-0.5">{m.value}</div>
                  <span className="text-[11px] text-gray-400 font-semibold">{m.sub}</span>
                </div>
              ))}
            </div>

            {/* Top Grid: Revenue Growth + Insights Sidebar */}
            <div className="grid grid-cols-3 gap-6">
              {/* Revenue Growth Card (Span 2) */}
              <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Revenue Growth</h2>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">Earnings overview compared to previous period</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-gray-900">
                      ₹{revenue.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-0.5 mt-0.5">
                      <span className="text-xs">&uarr;</span> This Month
                    </span>
                  </div>
                </div>

                {/* Bars Chart — weekly booking buckets */}
                <div className="flex justify-between items-end h-44 px-4 pt-4 border-b border-gray-100">
                  {weeklyBuckets.map((count, i) => {
                    const heightPct = Math.round((count / maxBucket) * 100);
                    const isActive = i === weeklyBuckets.indexOf(Math.max(...weeklyBuckets));
                    const labels = ['Week 1', 'Week 2', 'Week 3', 'Current Week'];
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 group relative">
                        {count > 0 && (
                          <span className="absolute -top-5 text-[9px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition">
                            {count}
                          </span>
                        )}
                        <div
                          style={{ height: `${Math.max(heightPct, 8)}%` }}
                          className={`w-10 rounded-t-lg transition-all duration-500 hover:opacity-90 ${
                            isActive ? 'bg-[#105D3D]' : 'bg-[#EBF1FA]'
                          }`}
                        />
                        <span className="text-[9px] font-bold text-gray-400 mt-2 h-4 text-center leading-none">
                          {labels[i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insights Sidebar Column (Span 1) */}
              <div className="space-y-6">
                {/* Top Insight Card */}
                <div className="bg-[#3B8266] text-white rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-48">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#E1F7EC]">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l2.4 7.4h7.8l-6.3 4.6 2.4 7.4-6.3-4.6-6.3 4.6 2.4-7.4-6.3-4.6h7.8z"/>
                      </svg>
                      Top Insight
                    </div>
                    <p className="text-xs leading-relaxed font-semibold mt-3">
                      Your 'Summit View' listing is trending +20% higher than last month. Consider increasing availability for the upcoming weekend to maximize capture.
                    </p>
                  </div>
                  <a 
                    href="/listings" 
                    className="text-xs font-bold text-white underline hover:opacity-90 transition mt-4 inline-block"
                  >
                    Manage Listing
                  </a>
                </div>

                {/* Performance Alerts Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance Alerts</h3>
                  <div className="flex gap-3.5 items-start">
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      !
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Unread Reviews (4)</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5 leading-tight">High-impact reviews pending response.</p>
                    </div>
                  </div>
                  <div className="flex gap-3.5 items-start pt-1.5 border-t border-gray-50">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Cancellations Up</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5 leading-tight">+5% increase in last 7 days.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Customer Trends & Experience Popularity */}
            <div className="grid grid-cols-3 gap-6">
              {/* Customer Trends Chart (Span 2) */}
              <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-base font-bold text-gray-900">Customer Trends</h2>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#105D3D]" /> Bookings
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2B7A9B]" /> Site Visitors
                    </div>
                  </div>
                </div>

                {/* SVG Visualizing trends lines */}
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                    {/* Grid line */}
                    <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1"/>
                    
                    {/* Site Visitors trend (blue dashed) */}
                    <path
                      d="M0,90 Q80,75 140,82 T280,30 T420,10 T500,45"
                      fill="none"
                      stroke="#2B7A9B"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />

                    {/* Bookings trend (green solid) */}
                    <path
                      d="M0,100 Q85,82 145,95 T285,45 T425,25 T500,60"
                      fill="none"
                      stroke="#105D3D"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* Experience Popularity (Donut) (Span 1) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Experience Popularity</h2>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Top booking categories this month</p>
                </div>

                {/* Donut visual */}
                <div className="flex justify-center my-4 relative">
                  <div className="w-32 h-32 rounded-full border-[10px] border-[#EEF2F6] flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-[#105D3D] border-r-[#2B7A9B] rotate-[45deg]" />
                    <div className="text-center">
                      <div className="text-2xl font-black text-gray-800">
                        {catDist[0]?.pct ?? 68}%
                      </div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-tight">
                        {catDist[0]?.cat ?? 'Hiking'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend — real data or fallback */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-500">
                  {(catDist.length > 0 ? catDist : [
                    { cat: 'Hiking', pct: 68 },
                    { cat: 'Kayaking', pct: 22 },
                    { cat: 'Photography', pct: 7 },
                    { cat: 'Other', pct: 3 },
                  ]).map(({ cat, pct }, idx) => (
                    <div key={cat} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[idx] }} />
                      {cat} ({pct}%)
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Seasonal Performance Heatmap Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Seasonal Performance</h2>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Booking density across daily time slots and seasons</p>
                </div>
                {/* Heatmap Legend */}
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
                  <span>Less Active</span>
                  <div className="flex gap-0.5 mx-1">
                    <span className="w-3.5 h-3.5 rounded bg-[#E8F5EE]" />
                    <span className="w-3.5 h-3.5 rounded bg-[#BCE2CD]" />
                    <span className="w-3.5 h-3.5 rounded bg-[#6DC294]" />
                    <span className="w-3.5 h-3.5 rounded bg-[#105D3D]" />
                  </div>
                  <span>Highly Active</span>
                </div>
              </div>

              {/* Heatmap Matrix */}
              <div className="overflow-x-auto">
                <div className="min-w-[600px] space-y-2.5">
                  {/* Months Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(12, minmax(0, 1fr))' }} className="text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                    <div /> {/* spacing for label */}
                    {MONTHS.map(m => (
                      <div key={m}>{m}</div>
                    ))}
                  </div>

                  {/* AM Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(12, minmax(0, 1fr))' }} className="items-center">
                    <div className="text-[10px] font-black text-gray-400 pr-2">AM</div>
                    {/* Mock heat cells mapping layout */}
                    {[
                      '#E8F5EE', '#E8F5EE', '#BCE2CD', '#BCE2CD', '#6DC294', '#105D3D',
                      '#105D3D', '#105D3D', '#6DC294', '#BCE2CD', '#BCE2CD', '#E8F5EE'
                    ].map((col, idx) => (
                      <div key={idx} style={{ background: col }} className="h-10 mx-1 rounded-lg shadow-sm border border-white" />
                    ))}
                  </div>

                  {/* PM Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(12, minmax(0, 1fr))' }} className="items-center">
                    <div className="text-[10px] font-black text-gray-400 pr-2">PM</div>
                    {[
                      '#E8F5EE', '#E8F5EE', '#BCE2CD', '#6DC294', '#6DC294', '#105D3D',
                      '#105D3D', '#105D3D', '#105D3D', '#6DC294', '#BCE2CD', '#E8F5EE'
                    ].map((col, idx) => (
                      <div key={idx} style={{ background: col }} className="h-10 mx-1 rounded-lg shadow-sm border border-white" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

