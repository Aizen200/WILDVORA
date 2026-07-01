import { useState, useEffect, useRef, useCallback } from 'react';
import { hostAPI, messageAPI } from '../api/hostAPI';
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

  // Scheduling & Calendar states
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'timeline'
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 6, 1)); // Default: July 2026 (index 6)
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [bookingIdDragging, setBookingIdDragging] = useState(null);

  // Real guides state loaded from DB
  const [guides, setGuides] = useState([]);

  // Fetch guides
  const fetchGuides = async () => {
    try {
      const res = await hostAPI.getGuides();
      if (res.data.success) {
        setGuides(res.data.guides || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  // Load Google Fonts Material Symbols dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleAssignGuide = async (bookingId, guideId) => {
    if (!bookingId) return;
    try {
      const res = await hostAPI.assignGuide(bookingId, guideId);
      if (res.data.success) {
        setBookings(prev => prev.map(b => b._id === bookingId ? res.data.booking : b));
        if (selected?._id === bookingId) {
          setSelected(res.data.booking);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign guide');
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getBookingLayout = (booking, year, month) => {
    if (!booking.startDate) return null;
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate || booking.startDate);
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    if (end < monthStart || start > monthEnd) return null;
    
    const displayStart = start < monthStart ? monthStart : start;
    const displayEnd = end > monthEnd ? monthEnd : end;
    
    const startDay = displayStart.getDate();
    const endDay = displayEnd.getDate();
    
    return {
      startDay,
      duration: endDay - startDay + 1
    };
  };

  const checkOverlap = (guideBookings) => {
    for (let i = 0; i < guideBookings.length; i++) {
      for (let j = i + 1; j < guideBookings.length; j++) {
        const b1 = guideBookings[i];
        const b2 = guideBookings[j];
        if (b1.startDate && b2.startDate) {
          const s1 = new Date(b1.startDate);
          const e1 = new Date(b1.endDate || b1.startDate);
          const s2 = new Date(b2.startDate);
          const e2 = new Date(b2.endDate || b2.startDate);
          if (s1 <= e2 && s2 <= e1) return true;
        }
      }
    }
    return false;
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Note modal state
  const [noteModal, setNoteModal] = useState(null); // { bookingId, targetStatus }
  const [note,      setNote]      = useState('');

  // Drawer tab: 'details' | 'messages'
  const [drawerTab,   setDrawerTab]   = useState('details');
  const [chatMsgs,    setChatMsgs]    = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatText,    setChatText]    = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef  = useRef(null);
  const chatPollRef = useRef(null);

  const loadMessages = useCallback(async (bookingId, silent = false) => {
    if (!silent) setChatLoading(true);
    try {
      const res = await messageAPI.getByBooking(bookingId);
      if (res.data.success) setChatMsgs(res.data.messages || []);
    } catch (_) {}
    finally { if (!silent) setChatLoading(false); }
  }, []);

  // Load messages + start polling whenever the Messages tab is open for a booking
  useEffect(() => {
    clearInterval(chatPollRef.current);
    if (selected && drawerTab === 'messages') {
      loadMessages(selected._id);
      chatPollRef.current = setInterval(() => loadMessages(selected._id, true), 5000);
    }
    return () => clearInterval(chatPollRef.current);
  }, [selected?._id, drawerTab, loadMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (drawerTab === 'messages') {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [chatMsgs.length, drawerTab]);

  const handleChatSend = async () => {
    if (!chatText.trim() || chatSending || !selected) return;
    const text = chatText.trim();
    setChatText('');
    setChatSending(true);
    try {
      const res = await messageAPI.send(selected._id, text);
      if (res.data.success) {
        setChatMsgs(prev => [...prev, res.data.message]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send message. Please try again.');
      setChatText(text);
    } finally {
      setChatSending(false);
    }
  };

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

  useEffect(() => { fetchBookings(tab); setPage(1); setSelected(null); setDrawerTab('details'); }, [tab]);

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
              <p className="text-sm text-gray-500 mt-1">Manage, schedule, and assign guides to your adventure bookings.</p>
            </div>
            <div className="flex items-center gap-2.5">
              {/* View Switcher Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 shrink-0 border border-gray-200/40">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'list' ? 'bg-white text-[#1A5F45] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <span className="material-symbols-outlined text-[16px]">list</span>
                  List View
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'timeline' ? 'bg-white text-[#1A5F45] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  Timeline
                </button>
              </div>

              {/* Sync Trigger */}
              <button
                onClick={() => setShowSyncModal(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl px-4 py-2.5 text-sm shadow-sm transition"
              >
                <span className="material-symbols-outlined text-[18px] text-gray-500">sync</span>
                Sync Calendar
              </button>

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

          {viewMode === 'list' ? (
            <>
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
                              #WV-{b._id.slice(-4).toUpperCase()}
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
            </>
          ) : (
            <>
              {/* Month Header Navigation */}
              <div className="flex items-center justify-between mb-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm select-none">
                <div className="flex items-center gap-3">
                  <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-50 rounded-lg border border-gray-200 transition">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <span className="text-sm font-bold text-gray-800 min-w-32 text-center">
                    {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-50 rounded-lg border border-gray-200 transition">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide mr-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmed
                    <span className="w-2 h-2 rounded-full bg-blue-500 ml-2" /> Ongoing
                    <span className="w-2 h-2 rounded-full bg-amber-500 ml-2" /> Pending
                  </div>
                </div>
              </div>

              {/* Gantt Timeline Grid */}
              <div className="overflow-x-auto border border-gray-100 rounded-2xl bg-white shadow-sm">
                <div style={{ minWidth: `${220 + daysInMonth * 40}px` }}>
                  
                  {/* Grid Header Row */}
                  <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <div className="w-[220px] shrink-0 p-4 font-bold text-[10px] text-gray-400 uppercase tracking-wider border-r border-gray-100">
                      Guide / Host
                    </div>
                    <div className="flex flex-1">
                      {days.map(d => {
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                        const weekday = date.toLocaleString('en-US', { weekday: 'short' });
                        return (
                          <div key={d} className="w-[40px] shrink-0 text-center py-2 border-r border-gray-100 last:border-r-0 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-gray-700">{d}</span>
                            <span className="text-[8px] font-semibold text-gray-400 uppercase mt-0.5">{weekday}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Rows */}
                  <div className="divide-y divide-gray-100">
                    {/* Guides Rows */}
                    {guides.map(guide => {
                      const guideBookings = bookings.filter(b => (b.assignedGuide?._id || b.assignedGuide) === guide._id);
                      const hasConflict = checkOverlap(guideBookings);
                      return (
                        <div
                          key={guide._id}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleAssignGuide(bookingIdDragging, guide._id)}
                          className="flex hover:bg-gray-50/20 transition group"
                        >
                          <div className="w-[220px] shrink-0 p-4 border-r border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#EEF6F1] text-[#1A5F45] flex items-center justify-center text-[10px] font-bold">
                                {guide.avatar}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-gray-800">{guide.name}</div>
                                <div className="text-[9px] text-gray-400 font-semibold">{guide.specialty}</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {hasConflict && (
                                <span className="text-[8px] font-bold bg-red-50 text-red-600 border border-red-200 px-1 py-0.5 rounded-lg animate-pulse">
                                  CONFLICT
                                </span>
                              )}
                              <span className="text-[9px] font-bold text-gray-400">★ {guide.rating}</span>
                            </div>
                          </div>
                          
                          {/* Timeline day cells */}
                          <div className="flex-1 flex relative h-16 items-center">
                            {days.map(d => (
                              <div key={d} className="w-[40px] h-full shrink-0 border-r border-gray-100 last:border-r-0" />
                            ))}
                            
                            {/* Absolute booking blocks */}
                            {guideBookings.map(b => {
                              const layout = getBookingLayout(b, currentMonth.getFullYear(), currentMonth.getMonth());
                              if (!layout) return null;
                              const left = (layout.startDay - 1) * 40;
                              const width = layout.duration * 40;
                              const isSelected = selected?._id === b._id;
                              
                              return (
                                <div
                                  key={b._id}
                                  draggable
                                  onDragStart={() => setBookingIdDragging(b._id)}
                                  onClick={() => setSelected(b)}
                                  style={{ left: `${left + 4}px`, width: `${width - 8}px` }}
                                  className={`absolute h-10 rounded-xl px-2.5 flex items-center gap-1.5 cursor-pointer border shadow-sm transition-all duration-200 z-10 hover:scale-[1.02] active:scale-[0.98] ${
                                    isSelected
                                      ? 'border-[#1A5F45] ring-2 ring-[#1A5F45]/15'
                                      : ''
                                  } ${
                                    b.status === 'confirmed'
                                      ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
                                      : b.status === 'ongoing'
                                      ? 'bg-blue-50/95 border-blue-200 text-blue-800'
                                      : 'bg-amber-50/95 border-amber-200 text-amber-800'
                                  }`}
                                >
                                  <div className="flex flex-col min-w-0 flex-1 leading-tight justify-center select-none">
                                    <span className="text-[10px] font-bold truncate">{b.experience?.title}</span>
                                    <span className="text-[8px] font-medium opacity-80 truncate mt-0.5">{b.user?.name}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Unassigned Row */}
                    {(() => {
                      const unassignedBookings = bookings.filter(b => !b.assignedGuide);
                      return (
                        <div
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleAssignGuide(bookingIdDragging, 'unassigned')}
                          className="flex bg-gray-50/30 hover:bg-gray-50/50 transition group"
                        >
                          <div className="w-[220px] shrink-0 p-4 border-r border-gray-100 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[18px]">person_off</span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-500">Unassigned Trips</div>
                              <div className="text-[9px] text-gray-400 font-semibold">Needs Guide Assignment</div>
                            </div>
                          </div>
                          
                          <div className="flex-1 flex relative h-16 items-center">
                            {days.map(d => (
                              <div key={d} className="w-[40px] h-full shrink-0 border-r border-gray-100 last:border-r-0" />
                            ))}
                            
                            {unassignedBookings.map(b => {
                              const layout = getBookingLayout(b, currentMonth.getFullYear(), currentMonth.getMonth());
                              if (!layout) return null;
                              const left = (layout.startDay - 1) * 40;
                              const width = layout.duration * 40;
                              const isSelected = selected?._id === b._id;
                              
                              return (
                                <div
                                  key={b._id}
                                  draggable
                                  onDragStart={() => setBookingIdDragging(b._id)}
                                  onClick={() => setSelected(b)}
                                  style={{ left: `${left + 4}px`, width: `${width - 8}px` }}
                                  className={`absolute h-10 rounded-xl px-2.5 flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 bg-white/95 text-gray-600 shadow-sm transition-all duration-200 z-10 hover:scale-[1.02] active:scale-[0.98] ${
                                    isSelected ? 'ring-2 ring-[#1A5F45]/20 border-[#1A5F45]' : ''
                                  }`}
                                >
                                  <div className="flex flex-col min-w-0 flex-1 leading-tight justify-center select-none">
                                    <span className="text-[10px] font-bold truncate text-gray-700">{b.experience?.title}</span>
                                    <span className="text-[8px] font-semibold text-[#1A5F45] truncate mt-0.5">Assign Guide</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Drawer */}
        {selected && (
          <div className="w-[380px] ml-4 flex-shrink-0 bg-white border border-gray-100 rounded-2xl shadow-lg flex flex-col sticky top-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            {/* Drawer header + tab switcher */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setDrawerTab('details')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${drawerTab === 'details' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Details
                </button>
                <button
                  onClick={() => setDrawerTab('messages')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${drawerTab === 'messages' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Messages
                </button>
              </div>
              <button onClick={() => { setSelected(null); setDrawerTab('details'); }} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* ── DETAILS TAB ── */}
            {drawerTab === 'details' && (
              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 flex flex-col">
                <div className="mb-4">
                  <StatusBadge status={selected.status} />
                  {selected.statusNote && (
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      {selected.statusNote}
                    </p>
                  )}
                </div>

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

                {/* Guide Assignment Section */}
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned Guide</label>
                  <select
                    value={selected.assignedGuide?._id || selected.assignedGuide || 'unassigned'}
                    onChange={e => handleAssignGuide(selected._id, e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-[#1A5F45] focus:border-[#1A5F45] transition cursor-pointer"
                  >
                    <option value="unassigned">⚠️ Unassigned (Select a guide...)</option>
                    {guides.map(g => (
                      <option key={g._id} value={g._id}>
                        👤 {g.name} ({g.specialty} | ★{g.rating})
                      </option>
                    ))}
                  </select>
                  {(selected.assignedGuide?._id || selected.assignedGuide) && (() => {
                    const guideId = selected.assignedGuide?._id || selected.assignedGuide;
                    const guide = guides.find(g => g._id === guideId);
                    if (!guide) return null;
                    const assignedCount = bookings.filter(b => (b.assignedGuide?._id || b.assignedGuide) === guide._id).length;
                    return (
                      <div className="mt-2 text-[10px] text-gray-500 bg-[#EEF6F1] text-[#1A5F45] rounded-lg p-2.5 border border-[#1A5F45]/10 leading-relaxed">
                        <strong>Credentials:</strong> Languages: {guide.languages.join(', ')} • Rating: ★{guide.rating} • Capacity: {guide.activeTrips + (assignedCount - 1)}/3 trips active this month.
                      </div>
                    );
                  })()}
                </div>

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

                {(() => {
                  const actions = TRANSITIONS[selected.status] || [];
                  if (actions.length === 0) return null;
                  const primary     = actions.filter(a => a !== 'cancelled');
                  const destructive = actions.includes('cancelled') ? ['cancelled'] : [];
                  return (
                    <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Update Trip Status</p>
                      <div className="flex gap-2 flex-wrap">
                        {primary.map(targetStatus => (
                          <button key={targetStatus} disabled={updating}
                            onClick={() => handleAction(selected._id, targetStatus)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 ${ACTION_STYLE[targetStatus] || 'bg-gray-100 text-gray-700'}`}>
                            {updating ? '...' : ACTION_LABELS[targetStatus]}
                          </button>
                        ))}
                      </div>
                      {destructive.map(targetStatus => (
                        <button key={targetStatus} disabled={updating}
                          onClick={() => handleAction(selected._id, targetStatus)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 ${ACTION_STYLE[targetStatus]}`}>
                          {updating ? '...' : ACTION_LABELS[targetStatus]}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── MESSAGES TAB ── */}
            {drawerTab === 'messages' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Message list */}
                <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#F4F7F5] space-y-3">
                  {chatLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-2 border-[#1A5F45] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : chatMsgs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <svg className="w-9 h-9 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                      </svg>
                      <p className="text-xs text-gray-400">No messages yet for this booking</p>
                    </div>
                  ) : (
                    chatMsgs.map(msg => {
                      const isOp = msg.sender?.role === 'operator' || msg.sender?.role === 'admin';
                      return (
                        <div key={msg._id} className={`flex items-end gap-2 ${isOp ? 'justify-end' : 'justify-start'}`}>
                          {!isOp && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${getAvatarCls(msg.sender?.name)}`}>
                              {msg.sender?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                            isOp
                              ? 'bg-[#1A5F45] text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                          }`}>
                            <p className="text-[12px] leading-5 whitespace-pre-wrap break-words">{msg.text}</p>
                            <p className={`text-[9px] mt-1 text-right ${isOp ? 'text-white/60' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Reply input */}
                <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-end gap-2 flex-shrink-0">
                  <textarea
                    className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/30 focus:border-[#1A5F45] max-h-24"
                    placeholder="Reply to this guest…"
                    rows={1}
                    value={chatText}
                    onChange={e => setChatText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                    maxLength={1000}
                    disabled={chatSending}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatText.trim() || chatSending}
                    className="w-8 h-8 rounded-xl bg-[#1A5F45] hover:bg-[#145038] disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    {chatSending ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
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
      {/* Calendar Sync Modal */}
      {showSyncModal && <CalendarSyncModal onClose={() => setShowSyncModal(false)} />}
    </Layout>
  );
}

function CalendarSyncModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [syncStates, setSyncStates] = useState({
    google: true,
    apple: false,
    outlook: false,
  });

  const iCalUrl = "https://api.wildvora.com/operator/sync/WV-5928x.ics";

  const handleCopy = () => {
    navigator.clipboard.writeText(iCalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleForceSync = () => {
    setSyncing(true);
    setSuccess(false);
    setTimeout(() => {
      setSyncing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 border border-gray-100 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-900">Calendar Sync Integration</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          Sync your Wildvora bookings and guide schedule directly to Google Calendar, Apple Calendar, or Microsoft Outlook. Keep your team on the same page.
        </p>

        {/* iCal Link Field */}
        <div className="mb-5">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">iCal / feed URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={iCalUrl}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-600 outline-none select-all font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-gray-105 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">done</span>
                  Copied
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Auto Sync Toggles */}
        <div className="space-y-3 mb-6">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Auto-Sync Services</label>
          
          {[
            { id: 'google', name: 'Google Calendar Integration', desc: 'Syncs every 15 minutes automatically' },
            { id: 'apple', name: 'Apple Calendar (iCal)', desc: 'Pull-based scheduling for Apple devices' },
            { id: 'outlook', name: 'Outlook / Office 365', desc: 'Enterprise calendar scheduling sync' },
          ].map(s => (
            <label key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-50/80 transition">
              <div>
                <p className="text-xs font-bold text-gray-800">{s.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={syncStates[s.id]}
                onChange={() => setSyncStates(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                className="w-4 h-4 accent-[#1A5F45] cursor-pointer rounded"
              />
            </label>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="flex-1 py-3 bg-[#1A5F45] hover:bg-[#145038] disabled:bg-[#1A5F45]/60 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            {syncing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Syncing...
              </>
            ) : success ? (
              <>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Sync Complete!
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">sync</span>
                Force Sync Now
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 transition"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
