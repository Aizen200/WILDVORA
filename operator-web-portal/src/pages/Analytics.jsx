import { useState, useEffect } from 'react';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

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

  // Compute weekly revenue for chart visualization
  const weeklyRevenue = (() => {
    const weeks = [0, 0, 0, 0];
    bookings.forEach(b => {
      const d = new Date(b.createdAt);
      const weekNum = Math.min(Math.floor(d.getDate() / 7), 3);
      if (['confirmed','completed'].includes(b.status)) weeks[weekNum] += b.totalPrice;
    });
    return weeks;
  })();
  const maxWeekRev = Math.max(...weeklyRevenue, 1);

  // Category breakdown
  const categoryMap = {};
  listings.forEach(l => { categoryMap[l.category] = (categoryMap[l.category] || 0) + 1; });
  const totalListings = listings.length || 1;
  const topCategory = Object.entries(categoryMap).sort((a,b) => b[1]-a[1])[0];

  // Monthly booking heatmap (AM/PM split)
  const heatmap = MONTHS.map(m => {
    const mIdx = MONTHS.indexOf(m);
    const mBookings = bookings.filter(b => new Date(b.createdAt).getMonth() === mIdx);
    return {
      month: m,
      am: mBookings.filter(b => new Date(b.createdAt).getHours() < 12).length,
      pm: mBookings.filter(b => new Date(b.createdAt).getHours() >= 12).length,
    };
  });
  const maxHeat = Math.max(...heatmap.flatMap(h => [h.am, h.pm]), 1);

  const heatColor = (val) => {
    const pct = val / maxHeat;
    if (pct > 0.75) return '#1A5F45';
    if (pct > 0.5)  return '#2E7D52';
    if (pct > 0.25) return '#78B99A';
    return '#C8E6D4';
  };

  return (
    <Layout>
      <div id="analytics-page">
        <nav id="analytics-breadcrumb">Analytics › <span>Insights Dashboard</span></nav>

        <div id="analytics-header">
          <h1 id="analytics-title">Analytics &amp; Insights</h1>
          <div id="analytics-period-btns">
            {['Last 30 Days','Quarterly','Yearly'].map(p => (
              <button
                key={p}
                id={`period-${p.replace(/ /g,'-').toLowerCase()}`}
                className={`period-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >{p}</button>
            ))}
          </div>
          <button id="btn-export-pdf" onClick={() => window.print()}>⬇ Export PDF</button>
        </div>

        {error && <div id="analytics-error" role="alert">{error}</div>}

        {loading ? <p id="analytics-loading">Loading analytics...</p> : (
          <>
            <div id="analytics-main-grid">
              {/* Revenue Growth Chart */}
              <section id="revenue-chart-section">
                <div id="revenue-chart-header">
                  <div>
                    <h2>Revenue Growth</h2>
                    <p>Earnings overview compared to previous period</p>
                  </div>
                  <div id="revenue-total">
                    <strong>₹{stats?.revenueThisMonth?.toLocaleString() ?? 0}</strong>
                    <span>▲ This month</span>
                  </div>
                </div>
                <div id="revenue-bar-chart" role="img" aria-label="Revenue bar chart">
                  {weeklyRevenue.map((rev, i) => (
                    <div key={i} className="bar-col" id={`bar-week-${i+1}`}>
                      <div
                        className="bar"
                        style={{ height: `${(rev/maxWeekRev)*100}%`, background: i === 2 ? '#1A5F45' : '#C8E6D4' }}
                        title={`₹${rev}`}
                      />
                      <span className="bar-label">Week {i+1}{i===2?' (Current)':''}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Right column: insights + alerts */}
              <div id="analytics-right-col">
                <div id="top-insight-card">
                  <span id="top-insight-label">✦ Top Insight</span>
                  <p id="top-insight-text">
                    {topCategory
                      ? `Your '${topCategory[0]}' listings are your top category. Consider adding more to maximize bookings.`
                      : 'Add more listings to start seeing insights.'}
                  </p>
                  <a href="/listings" id="link-manage-listing">Manage Listings</a>
                </div>

                <div id="performance-alerts">
                  <h3>Performance Alerts</h3>
                  <div className="alert-item" id="alert-reviews">
                    <span className="alert-icon alert-warn">!</span>
                    <div>
                      <strong>Unread Reviews ({stats?.totalReviews ?? 0})</strong>
                      <small>High-impact reviews pending response.</small>
                    </div>
                  </div>
                  <div className="alert-item" id="alert-occupancy">
                    <span className="alert-icon alert-info">↗</span>
                    <div>
                      <strong>Avg. Rating: {stats?.averageRating ?? '—'}</strong>
                      <small>{stats?.upcomingThisWeek ?? 0} upcoming bookings this week.</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Customer Trends + Experience Popularity */}
            <div id="analytics-bottom-grid">
              <section id="customer-trends">
                <h2>Customer Trends</h2>
                <div id="trend-legend">
                  <span className="legend-dot" style={{background:'#1A5F45'}} /> Bookings
                  <span className="legend-dot" style={{background:'#78B99A'}} /> Listings
                </div>
                <div id="trend-chart" role="img" aria-label="Customer trend chart">
                  {/* Simple visual representation */}
                  <div id="trend-info">
                    <div><strong>Total Bookings:</strong> {bookings.length}</div>
                    <div><strong>Active Listings:</strong> {stats?.totalListings ?? 0}</div>
                    <div><strong>Confirmed:</strong> {bookings.filter(b=>b.status==='confirmed').length}</div>
                    <div><strong>Completed:</strong> {bookings.filter(b=>b.status==='completed').length}</div>
                  </div>
                </div>
              </section>

              <section id="experience-popularity">
                <h2>Experience Popularity</h2>
                <p>Top booking categories this month</p>
                <div id="popularity-donut" role="img" aria-label="Experience popularity">
                  <div id="donut-center">
                    <strong>{topCategory ? Math.round((topCategory[1]/totalListings)*100) : 0}%</strong>
                    <small>{topCategory?.[0] || 'No data'}</small>
                  </div>
                </div>
                <ul id="popularity-legend">
                  {Object.entries(categoryMap).map(([cat, count]) => (
                    <li key={cat} className="popularity-item" id={`pop-${cat.toLowerCase()}`}>
                      <span className="legend-dot" />
                      {cat} ({Math.round((count/totalListings)*100)}%)
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Seasonal Heatmap */}
            <section id="seasonal-performance">
              <div id="seasonal-header">
                <div>
                  <h2>Seasonal Performance</h2>
                  <p>Booking density across daily time slots and seasons</p>
                </div>
                <div id="heatmap-legend">
                  <span>Less Active</span>
                  <span className="heat-swatch" style={{background:'#C8E6D4'}}/>
                  <span className="heat-swatch" style={{background:'#78B99A'}}/>
                  <span className="heat-swatch" style={{background:'#2E7D52'}}/>
                  <span className="heat-swatch" style={{background:'#1A5F45'}}/>
                  <span>Highly Active</span>
                </div>
              </div>
              <div id="heatmap-grid">
                <div id="heatmap-months">
                  <div/>
                  {heatmap.map(h => <div key={h.month} className="heatmap-month-label">{h.month}</div>)}
                </div>
                <div className="heatmap-row" id="heatmap-am">
                  <span className="heatmap-slot-label">AM</span>
                  {heatmap.map(h => (
                    <div
                      key={h.month}
                      className="heat-cell"
                      id={`heat-am-${h.month.toLowerCase()}`}
                      style={{ background: heatColor(h.am) }}
                      title={`${h.month} AM: ${h.am} bookings`}
                    />
                  ))}
                </div>
                <div className="heatmap-row" id="heatmap-pm">
                  <span className="heatmap-slot-label">PM</span>
                  {heatmap.map(h => (
                    <div
                      key={h.month}
                      className="heat-cell"
                      id={`heat-pm-${h.month.toLowerCase()}`}
                      style={{ background: heatColor(h.pm) }}
                      title={`${h.month} PM: ${h.pm} bookings`}
                    />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
