import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* ── Tiny helpers ──────────────────────────────── */
function StatCard({ label, value, sub, badge, badgeColor, icon, highlight }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{
        background: highlight ? 'linear-gradient(135deg,#0d2d1c 0%,#0a4028 100%)' : '#fff',
        border: highlight ? '1px solid #0f5a38' : '1px solid #e6eae6',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        color: highlight ? '#fff' : '#111827',
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: highlight ? '#7ec8a4' : '#6b7280' }}>
          {label}
        </span>
        {icon && <span style={{ opacity: 0.6 }}>{icon}</span>}
      </div>
      <div className="text-3xl font-black tracking-tight leading-none" style={{ color: highlight ? '#fff' : '#111827' }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: highlight ? '#7ec8a4' : '#6b7280' }}>{sub}</div>
      )}
      {badge && (
        <span
          className="self-start mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: badgeColor?.bg || '#ddf4e7', color: badgeColor?.text || '#166534' }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/* ── Simple SVG line chart ────────────────────── */
function BookingTrendsChart({ current = [], last = [] }) {
  const W = 480, H = 140, PAD = 20;
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const allVals = [...current, ...last];
  const max = Math.max(...allVals, 1);
  const xStep = (W - PAD * 2) / 6;

  const pts = (arr) =>
    arr.map((v, i) => `${PAD + i * xStep},${H - PAD - ((v / max) * (H - PAD * 2))}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line
          key={i}
          x1={PAD} y1={H - PAD - f * (H - PAD * 2)}
          x2={W - PAD} y2={H - PAD - f * (H - PAD * 2)}
          stroke="#f0f2f0" strokeWidth="1"
        />
      ))}
      {/* Day labels */}
      {days.map((d, i) => (
        <text
          key={d}
          x={PAD + i * xStep}
          y={H - 4}
          textAnchor="middle"
          fontSize="9"
          fill="#9ca3af"
          fontWeight="600"
        >
          {d}
        </text>
      ))}
      {/* Last week */}
      {last.length === 7 && (
        <polyline
          points={pts(last)}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Current week */}
      {current.length === 7 && (
        <polyline
          points={pts(current)}
          fill="none"
          stroke="#1A5F45"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Dots */}
      {current.length === 7 &&
        current.map((v, i) => (
          <circle
            key={i}
            cx={PAD + i * xStep}
            cy={H - PAD - ((v / max) * (H - PAD * 2))}
            r="3.5"
            fill="#1A5F45"
          />
        ))}
    </svg>
  );
}

/* ── Revenue Mix bar ──────────────────────────── */
function RevBar({ label, pct, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className="text-xs font-bold text-gray-900">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

/* ── Safety Report Item ───────────────────────── */
function SafetyItem({ title, desc, time, type, onAction }) {
  return (
    <div className="flex gap-3 py-3.5 border-b last:border-0" style={{ borderColor: '#fecaca' }}>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: type === 'weather' ? '#fef2f2' : '#fff7ed' }}
      >
        {type === 'weather' ? (
          <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 00-10 10h20A10 10 0 0012 2z"/><path d="M2 12a10 10 0 0020 0"/>
          </svg>
        ) : (
          <svg width="16" height="16" fill="none" stroke="#f97316" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 leading-snug">{title}</div>
        <div className="text-xs text-gray-500 mt-0.5 truncate">{desc}</div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onAction && onAction('evac')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition cursor-pointer"
          >
            Initiate Evac
          </button>
          <button
            onClick={() => onAction && onAction('details')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>
      <div className="text-[10px] text-gray-400 flex-shrink-0">{time}</div>
    </div>
  );
}

/* ── Pipeline Item ────────────────────────────── */
function PipelineItem({ icon, label, desc, count, accent }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: '#f3f4f6' }}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: accent + '18' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 leading-snug">{label}</div>
        <div className="text-xs text-gray-400">{desc}</div>
      </div>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
        style={{ background: accent, color: '#fff' }}
      >
        {count}
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, bookingsRes] = await Promise.all([
          api.get('/admin/analytics/overview'),
          api.get('/admin/bookings?disputed=true'),
        ]);
        if (overviewRes.data?.success) setAnalytics(overviewRes.data.analytics);
        if (bookingsRes.data?.success) setDisputes(bookingsRes.data.bookings.slice(0, 3));
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const a = analytics || {};
  const formatGMV = (val) => {
    if (!val || val === 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString('en-IN')}`;
  };
  const gmvDisplay = formatGMV(a.gmv || 0);
  const safetyRate = a.safetyRate ?? 0;
  const revMix = a.revenueMix || [];
  const revColors = ['#1A5F45', '#2a9d8f', '#3b82f6', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1A5F45] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Loading Operations Overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-8 py-8" style={{ background: '#f4f6f4' }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Operations Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time ecosystem metrics for the last 24 hours.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1A5F45] text-white hover:bg-[#144d38] transition shadow cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition shadow cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            Past 7 Days
          </button>
        </div>
      </div>

      {/* ── Top Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* GMV */}
        <div className="rounded-2xl p-5 col-span-1" style={{ background: '#fff', border: '1px solid #e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#d1fae5', color: '#065f46' }}
            >
              +{a.gmvGrowth >= 0 ? a.gmvGrowth : 0}%
            </span>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Gross Merchandise Value</div>
          <div className="text-3xl font-black text-gray-900">{gmvDisplay}</div>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Projection: {formatGMV((a.gmv || 0) * 1.2)} by Month End
          </div>
        </div>

        {/* Bookings */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#fef3c7', color: '#92400e' }}
            >
              +{a.bookingGrowth >= 0 ? a.bookingGrowth : 0}%
            </span>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total Bookings</div>
          <div className="text-3xl font-black text-gray-900">{(a.totalBookings || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-2">
            {a.bookingsThisWeek || 0} bookings this week · {a.fulfillmentRate ?? 0}% Fulfillment rate
          </div>
        </div>

        {/* Active Ecosystem */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Active Ecosystem</div>
            <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-400">Active Hosts</div>
              <div className="text-xl font-black text-gray-900">{(a.activeHosts || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Active Customers</div>
              <div className="text-xl font-black text-gray-900">{(a.activeCustomers || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Safety Rate */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Safety Rate</div>
          <div className="text-3xl font-black" style={{ color: safetyRate < 0.15 ? '#dc2626' : '#1A5F45' }}>
            {safetyRate}%
          </div>
          <div className="text-xs mt-1 text-gray-400">
            {safetyRate < 0.15
              ? '✓ Well below the ecosystem threshold of 0.15%'
              : '⚠ Above threshold — action required'}
          </div>
          {a.totalReports > 0 && (
            <div className="mt-2 text-xs font-semibold text-red-500">{a.totalReports} Active Disputes</div>
          )}
        </div>
      </div>

      {/* ── Mid Section: Trends & Revenue Mix ── */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* Booking Trends */}
        <div className="col-span-2 rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-gray-900 text-sm">Booking Trends</div>
              <div className="text-xs text-gray-400">Comparison of current week vs previous performance.</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block rounded" style={{ background: '#1A5F45' }} /> Current Week
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block rounded border-t-2 border-dashed border-gray-400" /> Last Week
              </span>
            </div>
          </div>
          <BookingTrendsChart
            current={a.currentWeekTrends || [0, 0, 0, 0, 0, 0, 0]}
            last={a.lastWeekTrends || [0, 0, 0, 0, 0, 0, 0]}
          />
        </div>

        {/* Revenue Mix */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="font-bold text-gray-900 text-sm mb-4">Revenue Mix</div>
          <div className="flex flex-col gap-3">
            {revMix.map((item, i) => (
              <RevBar key={item.category} label={item.category} pct={item.percentage} color={revColors[i % revColors.length]} />
            ))}
          </div>
          {a.topPerformer && (
            <div className="mt-4 p-3 rounded-xl" style={{ background: '#f0f5f1', border: '1px solid #d1e8d9' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Top Performer</div>
              <div className="text-sm font-bold text-gray-900">{a.topPerformer}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Section: Safety Reports & Pipeline ── */}
      <div className="grid grid-cols-3 gap-5">
        {/* Urgent Safety Reports */}
        <div className="col-span-2 rounded-2xl overflow-hidden" style={{ background: '#fff7f7', border: '2px solid #fecaca', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2.5">
              <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="font-bold text-red-700 text-sm">Urgent Safety Reports</span>
            </div>
            {a.totalReports > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#dc2626', color: '#fff' }}>
                {a.totalReports} Action Required
              </span>
            )}
          </div>
          <div className="px-5 pb-4">
            {disputes.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <svg className="w-10 h-10 mx-auto mb-2 text-green-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                No active disputes or safety flags.
              </div>
            ) : (
              disputes.map((d, i) => (
                <SafetyItem
                  key={d._id || i}
                  title={d.experience?.title || 'Booking Dispute'}
                  desc={`Booking #${(d._id || '').toString().slice(-6).toUpperCase()} — ${d.disputeReason || 'Reported dispute'}`}
                  time={(() => {
                    const diff = Math.round((Date.now() - new Date(d.createdAt)) / 60000);
                    return diff < 60 ? `${diff}m ago` : `${Math.round(diff / 60)}h ago`;
                  })()}
                  type={i % 2 === 0 ? 'weather' : 'medical'}
                />
              ))
            )}
          </div>
        </div>

        {/* Verification Pipeline */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-gray-900 text-sm">Verification Pipeline</div>
            <Link to="/partners" className="text-xs font-semibold text-[#1A5F45] hover:underline cursor-pointer">View All</Link>
          </div>
          <div className="flex flex-col">
            <PipelineItem
              icon={
                <svg width="16" height="16" fill="none" stroke="#1A5F45" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              }
              label="Host Onboarding"
              desc="New profiles awaiting KYC"
              count={a.pipeline?.hostOnboarding ?? 0}
              accent="#1A5F45"
            />
            <PipelineItem
              icon={
                <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth={2} viewBox="0 0 24 24">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                </svg>
              }
              label="Pending Experiences"
              desc="Safety & pricing audit required"
              count={a.pipeline?.pendingExperiences ?? 0}
              accent="#f59e0b"
            />
            <PipelineItem
              icon={
                <svg width="16" height="16" fill="none" stroke="#3b82f6" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M6 14h.01M10 14h.01"/>
                </svg>
              }
              label="Large Payouts"
              desc="Approval for &gt;₹5L transactions"
              count={a.pipeline?.largePayouts ?? 0}
              accent="#3b82f6"
            />
          </div>
          <button
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#052618 0%,#1A5F45 100%)' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Enter Verification Blitz Mode
          </button>
        </div>
      </div>
    </div>
  );
}