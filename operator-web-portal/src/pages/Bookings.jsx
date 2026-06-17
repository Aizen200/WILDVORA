import { useState, useEffect } from 'react';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const TABS = ['All Bookings', 'Requests', 'Canceled'];

const getStatusBadge = (status) => {
  const map = {
    pending:   'bg-blue-50 text-blue-600 border border-blue-100',
    confirmed: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    completed: 'bg-gray-100 text-gray-600 border border-gray-200',
    cancelled: 'bg-red-50 text-red-600 border border-red-100',
  };
  const label = {
    pending: 'PENDING', confirmed: 'CONFIRMED',
    completed: 'COMPLETED', cancelled: 'CANCELLED',
  };
  const cls = map[status?.toLowerCase()] || 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label[status?.toLowerCase()] || status}
    </span>
  );
};

const avatarColors = [
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
];
const getAvatarCls = (name) => avatarColors[(name?.[0]?.charCodeAt(0) || 0) % avatarColors.length];

export default function Bookings() {
  const [bookings,  setBookings]  = useState([]);
  const [tab,       setTab]       = useState('All Bookings');
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [updating,  setUpdating]  = useState(false);
  const [page,      setPage]      = useState(1);
  const PER_PAGE = 10;

  const handleExportBookings = () => {
    if (bookings.length === 0) {
      alert('No bookings to export.');
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,Customer Name,Email,Booking ID,Experience,Start Date,Amount,Status\n";
    bookings.forEach(b => {
      const name = b.user?.name || '';
      const email = b.user?.email || '';
      const bookingId = `WV-${b._id?.slice(-4).toUpperCase() || ''}`;
      const experience = b.experience?.title || '';
      const date = b.startDate ? new Date(b.startDate).toLocaleDateString('en-US') : '';
      const amount = `₹${b.totalPrice || 0}`;
      const status = b.status || '';
      const row = [name, email, bookingId, experience, date, amount, status]
        .map(field => `"${String(field).replace(/"/g, '""')}"`)
        .join(',');
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "wildvora_bookings_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchBookings = async (statusFilter) => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter === 'Requests') params.status = 'pending';
      else if (statusFilter === 'Canceled') params.status = 'cancelled';
      const res = await hostAPI.getBookings(params);
      setBookings(res.data.bookings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(tab); }, [tab]);

  const handleStatus = async (id, status) => {
    setUpdating(true);
    try {
      const res = await hostAPI.updateBookingStatus(id, status);
      setBookings(prev => prev.map(b => b._id === id ? res.data.booking : b));
      setSelected(res.data.booking);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  const paginated   = bookings.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages  = Math.ceil(bookings.length / PER_PAGE);
  const totalCount  = bookings.length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <Layout>
      <div className="relative min-h-full flex gap-0">

        {/* Main Content */}
        <div className="flex-1 min-w-0">

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your upcoming adventure reservations and guest interactions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-600 font-medium shadow-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span>Oct 12 - Oct 28, 2023</span>
              </div>
              <button
                onClick={handleExportBookings}
                className="flex items-center gap-2 bg-[#1A5F45] hover:bg-[#145038] text-white font-semibold rounded-xl px-4 py-2.5 text-sm shadow-sm transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V3m0 0L8 7m4-4l4 4"/>
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Bookings', value: totalCount.toLocaleString(), sub: '+12% from last month', accent: 'border-l-[#1A5F45]' },
              { label: 'Pending',        value: pendingCount,                sub: 'Awaiting review',      accent: 'border-l-blue-400' },
              { label: 'Occupancy Rate', value: '92%',                       sub: 'Peak season trend',    accent: 'border-l-[#C4A482]' },
              { label: 'RevPAR',         value: '₹20,400',                      sub: 'Average per slot',     accent: 'border-l-gray-300' },
            ].map(m => (
              <div key={m.label} className={`bg-white p-5 rounded-2xl border-l-[4px] ${m.accent} shadow-sm`}>
                <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">{m.label}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">{m.value}</span>
                </div>
                <span className="text-xs text-gray-400">{m.sub}</span>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div className="flex gap-6">
                {TABS.map(t => (
                  <button key={t}
                    onClick={() => { setTab(t); setPage(1); setSelected(null); }}
                    className={`pb-1 text-sm font-semibold border-b-2 transition ${
                      tab === t
                        ? 'border-[#1A5F45] text-[#1A5F45]'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-400">
                Showing {Math.min((page - 1) * PER_PAGE + 1, bookings.length)}–{Math.min(page * PER_PAGE, bookings.length)} of {bookings.length}
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-7 h-7 border-4 border-[#1A5F45] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Customer Name', 'Booking ID', 'Experience', 'Dates', 'Amount', 'Status', ''].map(h => (
                        <th key={h} className="py-3 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-gray-400 text-sm">No bookings found.</td>
                      </tr>
                    ) : paginated.map(b => (
                      <tr key={b._id}
                        onClick={() => setSelected(b)}
                        className={`hover:bg-gray-50/60 cursor-pointer transition ${selected?._id === b._id ? 'bg-gray-50' : ''}`}>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarCls(b.user?.name)}`}>
                              {b.user?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{b.user?.name}</div>
                              <div className="text-[11px] text-gray-400">{b.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-sm font-semibold text-gray-400 font-mono">
                          #WV-{b._id.slice(-4).toUpperCase()}
                        </td>
                        <td className="py-4 px-5 text-sm font-semibold text-gray-700">{b.experience?.title}</td>
                        <td className="py-4 px-5">
                          <div className="text-[11px] font-semibold text-gray-600">
                            {new Date(b.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">08:00 AM</div>
                        </td>
                        <td className="py-4 px-5 text-sm font-bold text-gray-900">₹{b.totalPrice?.toFixed(2)}</td>
                        <td className="py-4 px-5">{getStatusBadge(b.status)}</td>
                        <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelected(b)} className="text-gray-300 hover:text-gray-500 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M9 5l7 7-7 7"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/40">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-40 transition">
                  Previous
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
                        page === n ? 'bg-[#1A5F45] text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-40 transition">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Detail Drawer */}
        {selected && (
          <div className="w-[360px] ml-4 flex-shrink-0 bg-white border border-gray-100 rounded-2xl shadow-lg flex flex-col p-6 max-h-[calc(100vh-120px)] overflow-y-auto sticky top-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-gray-900">Booking Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Status */}
            <div className="mb-5">{getStatusBadge(selected.status)}</div>

            {/* Customer */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getAvatarCls(selected.user?.name)}`}>
                {selected.user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selected.user?.name}</h3>
                <p className="text-xs text-gray-400">Verified Adventure Seeker</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-400 text-xs">&#9733;</span>
                  <span className="text-[11px] font-semibold text-gray-500">4.9 (12 Previous Trips)</span>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Booking ID</span>
                <strong className="text-xs text-gray-800">#WV-{selected._id.slice(-4).toUpperCase()}</strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date & Time</span>
                <strong className="text-xs text-gray-800">
                  {new Date(selected.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • 08:00 AM
                </strong>
              </div>
            </div>

            {/* Experience card */}
            <div className="mb-5">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Experience Package</span>
              <div className="flex gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                <img
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=150&q=80"
                  alt=""
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div>
                  <h4 className="text-xs font-bold text-gray-800">{selected.experience?.title}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Intermediate Difficulty &bull; 6 Hours</p>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="mb-6">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Summary</span>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-semibold">Experience Base Fee</span>
                <strong className="text-sm text-gray-900">₹{selected.totalPrice?.toFixed(2)}</strong>
              </div>
            </div>

            {/* Actions */}
            {selected.status === 'pending' && (
              <div className="flex gap-3 mt-auto">
                <button disabled={updating} onClick={() => handleStatus(selected._id, 'cancelled')}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                  Reject Booking
                </button>
                <button disabled={updating} onClick={() => handleStatus(selected._id, 'confirmed')}
                  className="flex-1 py-3 rounded-xl bg-[#1A5F45] hover:bg-[#145038] text-xs font-bold text-white transition">
                  Confirm Booking
                </button>
              </div>
            )}
            {selected.status === 'confirmed' && (
              <div className="flex gap-3 mt-auto">
                <button disabled={updating} onClick={() => handleStatus(selected._id, 'cancelled')}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button disabled={updating} onClick={() => handleStatus(selected._id, 'completed')}
                  className="flex-1 py-3 rounded-xl bg-[#1A5F45] hover:bg-[#145038] text-xs font-bold text-white transition">
                  Mark Completed
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}