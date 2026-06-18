import { useState, useEffect } from 'react';
import { FilterIcon } from '../components/Shared.jsx';
import api from '../api/axios';

const STATUS_CFG = {
  completed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  confirmed: { cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500' },
  ongoing:   { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500' },
  postponed: { cls: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500' },
  cancelled: { cls: 'bg-red-50 text-red-700 border-red-200',            dot: 'bg-red-500' },
  pending:   { cls: 'bg-gray-100 text-gray-600 border-gray-200',        dot: 'bg-gray-400' },
};

function StatusBadge({ status, disputed }) {
  if (disputed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        Disputed
      </span>
    );
  }
  const key = (status || 'pending').toLowerCase();
  const { cls, dot } = STATUS_CFG[key] || STATUS_CFG.pending;
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}

const VALID_STATUSES = ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled', 'postponed'];

function OverrideStatusModal({ booking, onClose, onDone }) {
  const [status, setStatus]   = useState(booking?.status || 'confirmed');
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.patch(`/admin/bookings/${booking._id}/status`, { status, statusNote: note });
      if (res.data?.success) { onDone(); onClose(); }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to override status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Override Trip Status</h3>
        <p className="text-sm text-gray-500 mb-4">
          Booking <span className="font-mono font-semibold">#{booking._id.slice(-8).toUpperCase()}</span>
          {' '}&mdash; {booking.experience?.title}
        </p>

        <label className="block text-xs font-semibold text-gray-500 mb-1">New Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 mb-4 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {VALID_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <label className="block text-xs font-semibold text-gray-500 mb-1">Note (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Reason for override..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 mb-4 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Saving...' : 'Apply Override'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingsDisputes() {
  const [bookings, setBookings]           = useState([]);
  const [staleTrips, setStaleTrips]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('All Bookings');
  const [searchQuery, setSearchQuery]     = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [overrideModal, setOverrideModal]     = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const [bRes, sRes] = await Promise.all([
        api.get('/admin/bookings'),
        api.get('/admin/bookings/stale').catch(() => ({ data: { bookings: [] } })),
      ]);
      if (bRes.data?.success) setBookings(bRes.data.bookings || []);
      setStaleTrips(sRes.data?.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleToggleDispute = async (bookingId, currentDisputed) => {
    try {
      const reason = !currentDisputed ? window.prompt('Enter reason for dispute:') : '';
      if (!currentDisputed && reason === null) return;
      const res = await api.patch(`/admin/bookings/${bookingId}/dispute`, {
        disputed: !currentDisputed,
        disputeReason: reason || '',
      });
      if (res.data?.success) fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update dispute status.');
    }
  };

  const handleRefund = async (bookingId) => {
    if (!window.confirm('Issue a full refund and cancel this booking?')) return;
    try {
      const res = await api.post(`/bookings/${bookingId}/refund`);
      if (res.data?.success) { fetchBookings(); alert('Refund issued.'); }
    } catch {
      try {
        const adminRes = await api.post(`/admin/bookings/${bookingId}/refund`);
        if (adminRes.data?.success) { fetchBookings(); alert('Refund issued.'); }
      } catch (adminErr) {
        alert(adminErr.response?.data?.message || 'Failed to issue refund.');
      }
    }
  };

  const displayBookings = activeTab === 'Stale Trips' ? staleTrips : bookings;

  const filteredBookings = displayBookings.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (b.experience?.title || '').toLowerCase().includes(q) ||
      (b.user?.name || '').toLowerCase().includes(q) ||
      (b._id || '').toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (activeTab === 'Disputed')  return b.disputed === true;
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    const matchPayment = paymentFilter === 'All' || b.paymentStatus === paymentFilter;
    return matchPayment;
  });

  const totalDisputes  = bookings.filter(b => b.disputed).length;
  const totalRevenue   = bookings
    .filter(b => b.status === 'completed' && b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const activeFilterCount = paymentFilter !== 'All' ? 1 : 0;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8" style={{ backgroundColor: '#f5f1ea' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings & Disputes</h1>
          <p className="text-gray-500 text-sm mt-1">Oversee global transactions and resolve platform conflicts.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search booking ID, customer or listing..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64"
          />

          <div className="relative">
            <button
              onClick={() => setShowFilterPanel(p => !p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FilterIcon />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-emerald-700 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 top-full mt-2 z-35 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter Bookings</span>
                  <button onClick={() => setPaymentFilter('All')} className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer">
                    Clear All
                  </button>
                </div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Payment Status</p>
                <div className="flex gap-1.5">
                  {['All', 'paid', 'unpaid'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setPaymentFilter(opt)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition ${
                        paymentFilter === opt
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {opt === 'All' ? 'All' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-400 text-xs font-semibold tracking-widest mb-2 uppercase">Total Bookings</div>
          <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-400 text-xs font-semibold tracking-widest mb-2 uppercase">Active Disputes</div>
          <div className={`text-2xl font-bold ${totalDisputes > 0 ? 'text-red-600' : 'text-gray-900'}`}>{totalDisputes}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-400 text-xs font-semibold tracking-widest mb-2 uppercase">Completed Revenue</div>
          <div className="text-2xl font-bold text-emerald-700">&#8377;{totalRevenue.toLocaleString()}</div>
        </div>
        <div
          className={`rounded-xl p-5 border shadow-sm cursor-pointer transition hover:shadow-md ${
            staleTrips.length > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'
          }`}
          onClick={() => setActiveTab('Stale Trips')}
        >
          <div className="text-gray-400 text-xs font-semibold tracking-widest mb-2 uppercase">Stale Trips</div>
          <div className={`text-2xl font-bold ${staleTrips.length > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
            {staleTrips.length}
          </div>
          {staleTrips.length > 0 && (
            <p className="text-amber-600 text-[11px] font-semibold mt-1">7+ days past end date</p>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            {['All Bookings', 'Disputed', 'Cancelled', 'Stale Trips'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'Disputed' && totalDisputes > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                {t === 'Stale Trips' && staleTrips.length > 0 && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />}
                {t}
              </button>
            ))}
          </div>
          <div className="ml-auto text-gray-400 text-xs">
            Showing {filteredBookings.length} booking(s)
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="font-bold text-gray-600 text-lg">No Bookings Found</p>
            <p className="text-gray-400 text-sm mt-1">No records match the selected view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Booking ID', 'Customer', 'Listing', 'Dates', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map(b => (
                  <tr key={b._id} className="hover:bg-gray-50/60 transition-all">
                    <td className="px-5 py-4 text-gray-700 text-xs font-mono font-semibold">
                      #{b._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                          {(b.user?.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-800 text-sm font-semibold leading-tight">{b.user?.name || 'Customer'}</div>
                          <div className="text-gray-400 text-xs">{b.user?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-sm max-w-xs truncate">{b.experience?.title || '—'}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs leading-relaxed">
                      <div>{b.startDate || '—'}</div>
                      {b.endDate && b.endDate !== b.startDate && <div className="text-gray-400">&rarr; {b.endDate}</div>}
                    </td>
                    <td className="px-5 py-4 text-gray-900 font-bold text-sm">&#8377;{(b.totalPrice || 0).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} disputed={b.disputed} />
                      {b.statusNote && (
                        <p className="text-[10px] text-gray-400 mt-1 max-w-[140px] truncate" title={b.statusNote}>
                          {b.statusNote}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setOverrideModal(b)}
                          className="text-xs px-2.5 py-1 rounded-md font-semibold border bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                        >
                          Override Status
                        </button>
                        <button
                          onClick={() => handleToggleDispute(b._id, b.disputed)}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold transition border cursor-pointer ${
                            b.disputed
                              ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {b.disputed ? 'Resolve Dispute' : 'Flag Dispute'}
                        </button>
                        {b.paymentStatus === 'paid' && b.status !== 'cancelled' && (
                          <button
                            onClick={() => handleRefund(b._id)}
                            className="text-xs text-rose-600 border border-rose-200 px-2.5 py-1 rounded-md hover:bg-rose-50 font-semibold transition cursor-pointer"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {overrideModal && (
        <OverrideStatusModal
          booking={overrideModal}
          onClose={() => setOverrideModal(null)}
          onDone={fetchBookings}
        />
      )}
    </div>
  );
}
