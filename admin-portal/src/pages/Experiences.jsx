import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/* ── Status badge ─────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    live:               { bg: '#d1fae5', text: '#065f46', label: 'LIVE' },
    pending:            { bg: '#fef3c7', text: '#92400e', label: 'PENDING' },
    suspended:          { bg: '#fee2e2', text: '#991b1b', label: 'FLAGGED' },
    rejected:           { bg: '#fee2e2', text: '#991b1b', label: 'REJECTED' },
    changes_requested:  { bg: '#e0e7ff', text: '#3730a3', label: 'CHANGES' },
    paused:             { bg: '#f3f4f6', text: '#374151', label: 'PAUSED' },
    draft:              { bg: '#f9fafb', text: '#6b7280', label: 'DRAFT' },
  };
  const cfg = map[status] || { bg: '#f3f4f6', text: '#374151', label: status?.toUpperCase() || '—' };
  return (
    <span
      className="inline-block text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

/* ── Verification check icons ─────────────────── */
function VerifIcons({ exp }) {
  const checks = [
    { icon: '📍', title: 'Location set', ok: !!exp.location?.city },
    { icon: '🍽', title: 'Inclusions listed', ok: exp.includes?.length > 0 },
    { icon: '👤', title: 'Host verified', ok: exp.hostVerified },
    { icon: '📅', title: 'Dates available', ok: exp.availableDates?.length > 0 },
  ];
  return (
    <div className="flex gap-1.5 items-center">
      {checks.map((c, i) => (
        <span
          key={i}
          title={c.title}
          className="text-base"
          style={{ opacity: c.ok ? 1 : 0.25, filter: c.ok ? 'none' : 'grayscale(1)' }}
        >
          {c.icon}
        </span>
      ))}
    </div>
  );
}

/* ── Star rating ──────────────────────────────── */
function Stars({ rating }) {
  const r = parseFloat(rating) || 0;
  return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
      ★ {r > 0 ? r.toFixed(1) : 'New'}
    </span>
  );
}

/* ── Modal ─────────────────────────────────────── */
function ActionModal({ exp, type, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const isReject = type === 'rejected';
  const isChanges = type === 'changes_requested';
  const isSuspend = type === 'suspended';

  if (!exp) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {isSuspend ? 'Suspend Listing' : isChanges ? 'Request Changes' : 'Reject Listing'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Provide a reason for {isSuspend ? 'suspending' : isChanges ? 'requesting changes to' : 'rejecting'}{' '}
          <span className="font-semibold text-gray-800">"{exp.title}"</span>.
        </p>
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/40 transition"
          rows={4}
          placeholder="Reason..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => { if (!reason.trim()) { alert('Please provide a reason.'); return; } onConfirm(reason.trim()); }}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white transition cursor-pointer ${isSuspend ? 'bg-red-600 hover:bg-red-700' : isChanges ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isSuspend ? 'Suspend' : isChanges ? 'Request Changes' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────── */
export default function Experiences() {
  const [tab, setTab] = useState('all'); // 'all' | 'pending' | 'live'
  const [allExp, setAllExp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [modal, setModal] = useState(null); // { exp, type }
  const [flash, setFlash] = useState('');

  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [liveRes, pendRes] = await Promise.all([
        api.get('/admin/listings/live'),
        api.get('/admin/listings/pending'),
      ]);
      const live = liveRes.data?.success ? liveRes.data.listings : [];
      const pend = pendRes.data?.success ? pendRes.data.listings : [];
      // Merge, dedupe by _id
      const merged = [...pend, ...live.filter(l => !pend.find(p => p._id === l._id))];
      setAllExp(merged);
    } catch (e) {
      console.error('Experiences load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* Derived stats */
  const pendingCount    = allExp.filter(e => e.status === 'pending').length;
  const liveCount       = allExp.filter(e => e.status === 'live').length;
  const flaggedCount    = allExp.filter(e => e.status === 'suspended').length;
  const avgRating       = allExp.filter(e => e.rating > 0).length
    ? (allExp.filter(e => e.rating > 0).reduce((s, e) => s + e.rating, 0) / allExp.filter(e => e.rating > 0).length).toFixed(2)
    : '—';

  /* Unique categories for filter */
  const cats = ['All Categories', ...Array.from(new Set(allExp.map(e => e.category).filter(Boolean)))];
  const statuses = ['All Status', 'live', 'pending', 'suspended', 'paused', 'rejected'];

  /* Filtered */
  const filtered = allExp.filter(e => {
    const matchTab = tab === 'all' || e.status === tab;
    const matchSearch = !search || [e.title, e.hostName, e.location?.city].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchCat = catFilter === 'All Categories' || e.category === catFilter;
    const matchStatus = statusFilter === 'All Status' || e.status === statusFilter;
    return matchTab && matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* Actions */
  const handleApprove = async (exp) => {
    try {
      await api.patch(`/admin/listings/${exp._id}/approve`);
      setAllExp(prev => prev.map(e => e._id === exp._id ? { ...e, status: 'live' } : e));
      showFlash(`"${exp.title}" approved and is now live.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (exp, type, reason) => {
    try {
      if (type === 'suspended') {
        await api.patch(`/admin/listings/${exp._id}/suspend`, { reason });
        setAllExp(prev => prev.map(e => e._id === exp._id ? { ...e, status: 'suspended' } : e));
        showFlash(`"${exp.title}" suspended.`);
      } else {
        await api.patch(`/admin/listings/${exp._id}/reject`, { status: type, reason });
        setAllExp(prev => prev.map(e => e._id === exp._id ? { ...e, status: type } : e));
        showFlash(type === 'rejected' ? `"${exp.title}" rejected.` : `Changes requested for "${exp.title}".`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setModal(null);
    }
  };

  const handleReactivate = async (exp) => {
    try {
      await api.patch(`/admin/listings/${exp._id}/reactivate`);
      setAllExp(prev => prev.map(e => e._id === exp._id ? { ...e, status: 'live' } : e));
      showFlash(`"${exp.title}" reactivated.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="min-h-screen px-8 py-8" style={{ background: '#f4f6f4' }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Experience Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">
            Reviewing {liveCount + pendingCount} active and pending expeditions across the Indian sub-continent.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#1A5F45] text-white hover:bg-[#144d38] transition shadow cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            New Template
          </button>
        </div>
      </div>

      {/* Flash message */}
      {flash && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {flash}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-white p-5 border" style={{ borderColor: '#e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pending Approval</div>
          <div className="text-4xl font-black text-gray-900">{pendingCount}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 border" style={{ borderColor: '#e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Live Experiences</div>
          <div className="text-4xl font-black text-gray-900">{liveCount.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 border" style={{ borderColor: '#e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Avg. Quality Rating</div>
          <div className="text-4xl font-black text-amber-500">{avgRating} ★</div>
        </div>
        <div className="rounded-2xl bg-white p-5 border border-red-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Safety Flagged</div>
          <div className="text-4xl font-black text-red-600">{flaggedCount}</div>
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="flex items-center gap-3 mb-4">
        {/* Category */}
        <select
          value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none cursor-pointer"
        >
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none cursor-pointer"
        >
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        {/* Search */}
        <div className="relative ml-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search experiences, hosts..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 rounded-xl text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/30 w-64 transition"
          />
        </div>
        <button onClick={loadData} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition cursor-pointer">
          ↻ Refresh
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: '#e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Table header */}
        <div
          className="grid px-5 py-3 text-[11px] font-black uppercase tracking-wider text-gray-400 border-b"
          style={{ gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 1.2fr 0.8fr 1.5fr', borderColor: '#f3f4f6' }}
        >
          <span>Experience Title</span>
          <span>Host</span>
          <span>Category</span>
          <span>Status</span>
          <span>Verification</span>
          <span>Rating</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#1A5F45] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading experiences...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <p className="text-sm font-medium">No experiences match your criteria.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#f9fafb' }}>
            {paginated.map(exp => {
              const isFlagged = exp.status === 'suspended';
              return (
                <div
                  key={exp._id}
                  className="grid items-center px-5 py-4 hover:bg-gray-50/70 transition-all"
                  style={{
                    gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 1.2fr 0.8fr 1.5fr',
                    background: isFlagged ? '#fff9f9' : 'transparent',
                  }}
                >
                  {/* Title */}
                  <div className="flex items-center gap-3">
                    {exp.images?.[0] || exp.coverImage ? (
                      <img
                        src={exp.images?.[0] || exp.coverImage}
                        alt={exp.title}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#052618] to-[#1A5F45] flex items-center justify-center">
                        <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth={1.5} viewBox="0 0 24 24">
                          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className={`text-sm font-bold leading-snug ${isFlagged ? 'text-red-700' : 'text-gray-900'}`}>
                        {exp.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {exp.location?.city || ''}{exp.location?.state ? `, ${exp.location.state}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Host */}
                  <span className="text-sm text-gray-700 font-medium">{exp.host?.name || exp.hostName || '—'}</span>

                  {/* Category */}
                  <span className="text-sm text-gray-600">{exp.category || '—'}</span>

                  {/* Status */}
                  <StatusBadge status={exp.status} />

                  {/* Verification */}
                  <div className="flex items-center gap-1">
                    {isFlagged ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                        Safety Review
                      </span>
                    ) : (
                      <VerifIcons exp={exp} />
                    )}
                  </div>

                  {/* Rating */}
                  <Stars rating={exp.rating} />

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {exp.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(exp)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1A5F45] text-white hover:bg-[#144d38] transition cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setModal({ exp, type: 'rejected' })}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {exp.status === 'live' && (
                      <button
                        onClick={() => setModal({ exp, type: 'suspended' })}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                      >
                        Suspend
                      </button>
                    )}
                    {exp.status === 'suspended' && (
                      <button
                        onClick={() => handleReactivate(exp)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: '#f3f4f6' }}>
            <span className="text-xs text-gray-400 font-medium">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} results
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-sm font-semibold border transition cursor-pointer"
                  style={{
                    background: page === p ? '#1A5F45' : '#fff',
                    color: page === p ? '#fff' : '#374151',
                    borderColor: page === p ? '#1A5F45' : '#e5e7eb',
                  }}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && <span className="text-sm text-gray-400 px-1">...</span>}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Verification protocol callout ── */}
      <div className="mt-6 flex items-start gap-4 p-5 rounded-2xl border border-red-200" style={{ background: '#fff7f7' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#fee2e2' }}>
          <svg width="18" height="18" fill="none" stroke="#dc2626" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="font-bold text-gray-900 text-sm mb-0.5">Verification Integrity Check</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            High-altitude expeditions (over 4,000m) currently require a minimum of 3 manual verification checkmarks before going Live. Ensure "Guide" certifications are valid for 2024.
          </div>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0 transition cursor-pointer" style={{ background: '#1A5F45' }}>
          View Protocol
        </button>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <ActionModal
          exp={modal.exp}
          type={modal.type}
          onConfirm={(reason) => handleReject(modal.exp, modal.type, reason)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
