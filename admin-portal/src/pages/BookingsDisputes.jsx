import { useState } from 'react'
import { FilterIcon, DownloadIcon, TrendUp, TrendDown } from '../components/shared.jsx'

const bookingRows = [
  {
    id: '#WR-82910',
    initials: 'EM', color: 'bg-pink-400',
    customer: 'Elena Miller', customerType: 'Pro Member',
    host: 'Grand Canyon Glamping',
    date: 'Oct 12–15, 2023',
    amount: '₹1,20,750',
    status: 'Disputed',
  },
  {
    id: '#WR-82911',
    initials: 'JD', color: 'bg-blue-400',
    customer: 'James David', customerType: 'Verified',
    host: 'Olympic Forest Cabin',
    date: 'Oct 14–18, 2023',
    amount: '₹69,900',
    status: 'Confirmed',
  },
  {
    id: '#WR-82912',
    initials: 'SL', color: 'bg-gray-400',
    customer: 'Sarah L.', customerType: 'New User',
    host: 'Yosemite Valley Dome',
    date: 'Oct 15–17, 2023',
    amount: '₹99,900',
    status: 'Flagged',
  },
  {
    id: '#WR-82913',
    initials: 'TK', color: 'bg-teal-400',
    customer: 'Tom King', customerType: 'Guest',
    host: 'Zion Cliffhouse Suite',
    date: 'Oct 20–22, 2023',
    amount: '₹54,100',
    status: 'Pending',
  },
]

function StatusBadge({ status }) {
  const cfg = {
    Disputed:  { cls: 'bg-red-50 text-red-500 border-red-200',      icon: '⚠' },
    Confirmed: { cls: 'bg-blue-50 text-blue-600 border-blue-200',    icon: '✓' },
    Flagged:   { cls: 'bg-orange-50 text-orange-500 border-orange-200', icon: '!' },
    Pending:   { cls: 'bg-gray-100 text-gray-500 border-gray-200',   icon: '○' },
  }
  const { cls, icon } = cfg[status] || { cls: 'bg-gray-100 text-gray-500 border-gray-200', icon: '•' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <span>{icon}</span> {status}
    </span>
  )
}

const recentAlerts = [
  { dot: 'bg-red-500',    text: 'New dispute on #WR-82910',       time: '2 mins ago' },
  { dot: 'bg-gray-400',   text: 'Payment flagged for audit',       time: '15 mins ago' },
  { dot: 'bg-blue-500',   text: 'Refund processed for #WR-81222', time: '1 hour ago' },
]

const sparkHeights = [20, 40, 30, 60, 45, 70, 55, 85, 65, 75, 50, 90, 60, 72]

function SparkBar() {
  return (
    <div className="flex items-end gap-1 h-16 mt-2">
      {sparkHeights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all hover:opacity-80"
          style={{ height: `${h}%`, backgroundColor: '#2d6a4f', opacity: 0.7 }}
        />
      ))}
    </div>
  )
}

const topStats = [
  { label: 'ACTIVE BOOKINGS',      value: '1,284', badge: '+12%',        badgeClass: 'text-emerald-600' },
  { label: 'OPEN DISPUTES',        value: '24',    tag: 'High Priority',  tagClass: 'text-red-500' },
  { label: 'WEEKLY REVENUE',       value: '₹3,54,100', sub: 'v. Target',   subClass: 'text-emerald-600' },
  { label: 'AVG. RESOLUTION TIME', value: '4.2h',  badge: '-15%',        badgeClass: 'text-red-500' },
]

export default function BookingsDisputes() {
  const [activeTab, setActiveTab] = useState('All Bookings')
  const tabs = ['All Bookings', 'Disputed', 'Flagged']

  const tabStatusMap = { Disputed: 'Disputed', Flagged: 'Flagged' }
  const filteredRows =
    activeTab === 'All Bookings'
      ? bookingRows
      : bookingRows.filter(b => b.status === tabStatusMap[activeTab])

  return (
    // Light cream content
    <div className="flex-1 overflow-y-auto px-8 py-8" style={{ backgroundColor: '#f5f1ea' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings & Disputes</h1>
          <p className="text-gray-500 text-sm mt-1">Oversee global transactions and resolve platform conflicts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <DownloadIcon /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow"
            style={{ backgroundColor: '#1a3a26' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#14301f'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#1a3a26'}
          >
            <FilterIcon /> Advanced Filters
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {topStats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold tracking-widest mb-2">{s.label}</div>
            <div className="flex items-end gap-2 flex-wrap">
              <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              {s.badge && <span className={`text-xs font-bold mb-0.5 ${s.badgeClass}`}>{s.badge}</span>}
              {s.tag   && <span className={`text-xs font-bold mb-0.5 ${s.tagClass}`}>{s.tag}</span>}
              {s.sub   && <span className={`text-xs font-semibold mb-0.5 ${s.subClass}`}>{s.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        {/* Tabs row */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'Disputed' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                {t === 'Flagged'  && <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />}
                {t}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">‹</button>
            <button className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">›</button>
            <span className="text-gray-400 text-xs ml-2">Showing 1–10 of 1,284</span>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Booking ID', 'Customer', 'Host', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.map((b, i) => (
              <tr key={i} className="hover:bg-gray-50/60 transition-all">
                <td className="px-5 py-4 text-gray-700 text-sm font-mono font-semibold">{b.id}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${b.color}`}>
                      {b.initials}
                    </div>
                    <div>
                      <div className="text-gray-800 text-sm font-semibold leading-tight">{b.customer}</div>
                      <div className="text-gray-400 text-xs">{b.customerType}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-600 text-sm">{b.host}</td>
                <td className="px-5 py-4 text-gray-500 text-xs leading-relaxed">{b.date}</td>
                <td className="px-5 py-4 text-gray-900 font-bold text-sm">{b.amount}</td>
                <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => alert(`Initiated communication channel between customer (${b.customer}) and host (${b.host}) for booking ${b.id}.`)}
                      className="text-xs text-gray-600 border border-gray-300 px-2.5 py-1 rounded-md hover:bg-gray-50 font-semibold transition-all shadow-sm cursor-pointer"
                    >
                      Contact
                    </button>
                    {(b.status === 'Disputed' || b.status === 'Flagged') && (
                      <button 
                        onClick={() => alert(`Issued full refund for booking ${b.id} to customer ${b.customer}.`)}
                        className="text-xs text-rose-600 border border-rose-200 px-2.5 py-1 rounded-md hover:bg-rose-50 font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        Refund
                      </button>
                    )}
                    {b.status === 'Confirmed' && (
                      <button 
                        onClick={() => alert(`Flagged booking ${b.id} as Disputed for administrative review.`)}
                        className="text-xs text-amber-600 border border-amber-200 px-2.5 py-1 rounded-md hover:bg-amber-50 font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        Flag Dispute
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-3.5 flex items-center justify-between border-t border-gray-100">
          <span className="text-gray-400 text-xs">Page 1 of 128</span>
          <div className="flex items-center gap-1.5">
            <button className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium">Previous</button>
            {[1, 2, 3, '…', 128].map((p, i) => (
              <button
                key={i}
                className={`w-7 h-7 rounded-md text-xs font-semibold transition-all ${
                  p === 1
                    ? 'text-white shadow'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
                style={p === 1 ? { backgroundColor: '#1a3a26' } : {}}
              >
                {p}
              </button>
            ))}
            <button className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium">Next</button>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Dispute Trends */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-gray-900 font-bold text-sm">Dispute Trends</h3>
            <span className="text-gray-400 text-xs">Last 30 Days</span>
          </div>
          <SparkBar />
          <div className="flex justify-between text-gray-300 text-xs mt-3">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-gray-900 font-bold text-sm mb-4">Recent Alerts</h3>
          <div className="space-y-4">
            {recentAlerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.dot}`} />
                <div>
                  <div className="text-gray-700 text-sm font-medium">{a.text}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}