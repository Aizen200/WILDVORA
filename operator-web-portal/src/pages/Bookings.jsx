import { useState, useEffect } from 'react';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

// Status → visual config
const STATUS_CFG = {
  pending:   { cls: 'bg-amber-50 text-amber-700 border border-amber-200',   dot: 'bg-amber-500',   label: 'Pending' },
  confirmed: { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', label: 'Confirmed' },
  ongoing:   { cls: 'bg-blue-50 text-blue-700 border border-blue-200',      dot: 'bg-blue-500',    label: 'Ongoing' },
  completed: { cls: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500', label: 'Completed' },
  cancelled: { cls: 'bg-red-50 text-red-700 border border-red-200',         dot: 'bg-red-500',     label: 'Cancelled' },
  postponed: { cls: 'bg-orange-50 text-orange-700 border border-orange-200', dot: 'bg-orange-500', label: 'Postponed' },
};

function StatusBadge({ status }) {
  const key = (status || 'pending').toLowerCase();
  const cfg = STATUS_CFG[key] || { cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', label: key };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// Allowed operator transitions
const TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['ongoing', 'completed', 'postponed', 'cancelled'],
  ongoing:   ['completed', 'postponed', 'cancelled'],
  postponed: ['confirmed', 'ongoing', 'completed', 'cancelled'],
};

const ACTION_LABELS = {
  confirmed: 'Confirm',
  ongoing:   'Start Trip',
  completed: 'Mark Completed',
  postponed: 'Postpone',
  cancelled: 'Cancel',
};

const ACTION_STYLE = {
  confirmed: 'bg-[#1A5F45] hover:bg-[#145038] text-white',
  ongoing:   'bg-blue-600 hover:bg-blue-700 text-white',
  completed: 'bg-purple-600 hover:bg-purple-700 text-white',
  postponed: 'bg-orange-500 hover:bg-orange-600 text-white',
  cancelled: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
};

const NEEDS_NOTE = ['cancelled', 'postponed'];

const avatarColors = [
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
];
const getAvatarCls = (name) => avatarColors[(name?.[0]?.charCodeAt(0) || 0) % avatarColors.length];

const TABS = ['All Bookings', 'Pending', 'Active', 'Completed', 'Cancelled'];

export default function Bookings() {
  const [bookings,  setBookings]  = useState([]);
  const [tab,       setTab]       = useState('All Bookings');
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [updating,  setUpdating]  = useState(false);
  const [page,      setPage]      = useState(1);

  // Note modal state
  const [noteModal, setNoteModal] = useState(null); // { bookingId, targetStatus }
  const [note,      setNote]      = useState('');

  const PER_PAGE = 10;

  const fetchBookings = async (currentTab) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (currentTab === 'Pending')   params.status = 'pending';
      if (currentTab === 'Active')    params.status = 'ongoing';
      if (currentTab === 'Completed') params.status = 'completed';
      if (currentTab === 'Cancelled') params.status = 'cancelled';
      const res = await hostAPI.getBookings(params);
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(tab); setPage(1); setSelected(null); }, [tab]);

  const applyStatusChange = async (bookingId, targetStatus, statusNote) => {
    setUpdating(true);
    try {
      const res = await hostAPI.updateBookingStatus(bookingId, targetStatus, statusNote);
      const updated = res.data.booking;
      setBookings(prev => prev.map(b => b._id === bookingId ? updated : b));
      setSelected(updated);
      setNoteModal(null);
      setNote('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAction = (bookingId, targetStatus) => {
    if (NEEDS_NOTE.includes(targetStatus)) {
      setNote('');
      setNoteModal({ bookingId, targetStatus });
    } else {
      applyStatusChange(bookingId, targetStatus, '');
    }
  };

  const handleExportBookings = () => {
    if (bookings.length === 0) { alert('No bookings to export.'); return; }
    let csv = 'Customer,Email,Booking ID,Experience,Start Date,Amount,Status\n';
    bookings.forEach(b => {
      const row = [
        b.user?.name || '',
        b.user?.email || '',
        `WV-${b._id?.slice(-4).toUpperCase()}`,
        b.experience?.title || '',
        b.startDate ? new Date(b.startDate).toLocaleDateString('en-IN') : '',
        `${b.totalPrice || 0}`,
        b.status || '',
      ].map(f => `"${String(f).replace(/"/g, '""')}"`).join(',');
      csv += row + '\n';
    });
    const link = document.createElement('a');
    link.href = encodeURI('data:text/csv;charset=utf-8,' + csv);
    link.download = 'wildvora_bookings.csv';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // Client-side search on top of tab-filtered results from API
  const searchFiltered = search.trim()
    ? bookings.filter(b => {
        const q = search.toLowerCase();
        return (
          b.user?.name?.toLowerCase().includes(q) ||
          b.user?.email?.toLowerCase().includes(q) ||
          b.experience?.title?.toLowerCase().includes(q) ||
          b._id?.slice(-4).toLowerCase().includes(q)
        );
      })
    : bookings;

  const paginated  = searchFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(searchFiltered.length / PER_PAGE);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const ongoingCount = bookings.filter(b => b.status === 'ongoing').length;

  return (
    <Layout>
      <div className="relative min-h-full flex gap-0">

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and update trip statuses for all your bookings.</p>
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

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Bookings', value: bookings.length, accent: 'border-l-[#1A5F45]' },
              { label: 'Pending Review', value: pendingCount,    accent: 'border-l-amber-400' },
              { label: 'Active Trips',   value: ongoingCount,    accent: 'border-l-blue-400' },
              { label: 'Completed',      value: bookings.filter(b => b.status === 'completed').length, accent: 'border-l-purple-400' },
            ].map(m => (
              <div key={m.label} className={`bg-white p-5 rounded-2xl border-l-4 ${m.accent} shadow-sm`}>
                <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">{m.label}</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Search Bar */}
            <div className="px-6 pt-4 pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by customer, experience, or booking ID…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="flex-1 text-sm bg-transparent text-gray-700 placeholder-gray-400 outline-none"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1); }} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div className="flex gap-6">
                {TABS.map(t => (
                  <button key={t}
                    onClick={() => { setTab(t); setPage(1); setSelected(null); setSearch(''); }}
                    className={`pb-1 text-sm font-semibold border-b-2 transition ${
                      tab === t ? 'border-[#1A5F45] text-[#1A5F45]' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t}
                    {t === 'Pending' && pendingCount > 0 && (
                      <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                    )}
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-400">
                Showing {searchFiltered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, searchFiltered.length)} of {searchFiltered.length}
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-7 h-7 border-4 border-[#1A5F45] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : paginated.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                {search ? `No bookings match "${search}".` : 'No bookings found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Customer', 'Booking ID', 'Experience', 'Dates', 'Amount', 'Status', ''].map(h => (
                        <th key={h} className="py-3 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map(b => (
                      <tr key={b._id}
                        onClick={() => setSelected(b)}
                        className={`hover:bg-gray-50/60 cursor-pointer transition ${selected?._id === b._id ? 'bg-gray-50' : ''}`}
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarCls(b.user?.name)}`}>
                              {b.user?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{b.user?.name || '—'}</div>
                              <div className="text-[11px] text-gray-400">{b.user?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-xs font-semibold text-gray-400 font-mono">
                          #WV-{b._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-4 px-5 text-sm font-semibold text-gray-700 max-w-[200px] truncate">
                          {b.experience?.title || '—'}
                        </td>
                        <td className="py-4 px-5 text-xs text-gray-600">
                          <div>{b.startDate || '—'}</div>
                          {b.endDate && b.endDate !== b.startDate && <div className="text-gray-400">&rarr; {b.endDate}</div>}
                        </td>
                        <td className="py-4 px-5 text-sm font-bold text-gray-900">&#8377;{(b.totalPrice || 0).toLocaleString()}</td>
                        <td className="py-4 px-5">
                          <StatusBadge status={b.status} />
                          {b.statusNote && (
                            <p className="text-[10px] text-gray-400 mt-1 max-w-[140px] truncate" title={b.statusNote}>{b.statusNote}</p>
                          )}
                        </td>
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
          <div className="w-[380px] ml-4 flex-shrink-0 bg-white border border-gray-100 rounded-2xl shadow-lg flex flex-col p-6 max-h-[calc(100vh-120px)] overflow-y-auto sticky top-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-gray-900">Booking Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Current status */}
            <div className="mb-4">
              <StatusBadge status={selected.status} />
              {selected.statusNote && (
                <p className="text-xs text-gray-500 mt-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  {selected.statusNote}
                </p>
              )}
            </div>

            {/* Customer */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getAvatarCls(selected.user?.name)}`}>
                {selected.user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selected.user?.name || 'Customer'}</h3>
                <p className="text-xs text-gray-400">{selected.user?.email || ''}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {(selected.adults || 1)} adult{(selected.adults || 1) > 1 ? 's' : ''}
                  {selected.children > 0 ? `, ${selected.children} child${selected.children > 1 ? 'ren' : ''}` : ''}
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Booking ID</span>
                <strong className="text-xs text-gray-800">#WV-{selected._id.slice(-6).toUpperCase()}</strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start Date</span>
                <strong className="text-xs text-gray-800">{selected.startDate || '—'}</strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">End Date</span>
                <strong className="text-xs text-gray-800">{selected.endDate || '—'}</strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Amount Paid</span>
                <strong className="text-xs text-gray-800">&#8377;{(selected.totalPrice || 0).toLocaleString()}</strong>
              </div>
            </div>

            {/* Experience */}
            <div className="mb-5">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Experience</span>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                {selected.experience?.images?.[0] && (
                  <img src={selected.experience.images[0]} alt="" className="w-full h-28 object-cover rounded-lg mb-2" />
                )}
                <h4 className="text-xs font-bold text-gray-800">{selected.experience?.title || '—'}</h4>
                {selected.experience?.location?.city && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{selected.experience.location.city}, {selected.experience.location.country}</p>
                )}
              </div>
            </div>

            {/* Status history */}
            {selected.statusHistory?.length > 0 && (
              <div className="mb-5">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Status History</span>
                <div className="space-y-2">
                  {[...selected.statusHistory].reverse().map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${STATUS_CFG[h.status]?.dot || 'bg-gray-400'}`} />
                      <div>
                        <span className="text-[11px] font-semibold text-gray-700">
                          {STATUS_CFG[h.status]?.label || h.status}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-2">
                          {new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {h.note && <p className="text-[10px] text-gray-400 mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons based on current status */}
            {(() => {
              const actions = TRANSITIONS[selected.status] || [];
              if (actions.length === 0) return null;

              // Primary action is first in the list (e.g. confirm, start trip, complete)
              // Destructive (cancel) is always last
              const primary    = actions.filter(a => a !== 'cancelled');
              const destructive = actions.includes('cancelled') ? ['cancelled'] : [];

              return (
                <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Update Trip Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {primary.map(targetStatus => (
                      <button key={targetStatus}
                        disabled={updating}
                        onClick={() => handleAction(selected._id, targetStatus)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 ${ACTION_STYLE[targetStatus] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {updating ? '...' : ACTION_LABELS[targetStatus]}
                      </button>
                    ))}
                  </div>
                  {destructive.map(targetStatus => (
                    <button key={targetStatus}
                      disabled={updating}
                      onClick={() => handleAction(selected._id, targetStatus)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 ${ACTION_STYLE[targetStatus]}`}
                    >
                      {updating ? '...' : ACTION_LABELS[targetStatus]}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Note modal for cancel / postpone */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {noteModal.targetStatus === 'cancelled' ? 'Cancel Booking' : 'Postpone Trip'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {noteModal.targetStatus === 'cancelled'
                ? 'Provide a reason for the customer (optional).'
                : 'Let the customer know why this trip is being postponed (optional).'}
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 mb-4 resize-none focus:outline-none focus:ring-1 focus:ring-[#1A5F45]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => applyStatusChange(noteModal.bookingId, noteModal.targetStatus, note)}
                disabled={updating}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 ${
                  noteModal.targetStatus === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {updating ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={() => { setNoteModal(null); setNote(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
