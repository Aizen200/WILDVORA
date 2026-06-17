import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CATEGORIES = ['All Categories', 'Camping', 'Trekking', 'Water Sports', 'Jungle', 'Cycling', 'Climbing', 'Safari', 'Skiing'];
const STATUSES   = ['All Status', 'live', 'pending', 'draft', 'paused', 'rejected', 'changes_requested'];
const PER_PAGE   = 10;

const STATUS_CONFIG = {
  live:               { label: 'Approved',        cls: 'bg-green-50 text-green-700 border border-green-200' },
  pending:            { label: 'Pending Review',   cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  draft:              { label: 'Draft',            cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
  paused:             { label: 'Paused',           cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  rejected:           { label: 'Rejected',         cls: 'bg-red-50 text-red-600 border border-red-200' },
  changes_requested:  { label: 'Changes Needed',   cls: 'bg-orange-50 text-orange-600 border border-orange-200' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// Icons
const EditIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;
const RefreshIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>;
const PlusIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/></svg>;

export default function Listings() {
  const navigate = useNavigate();
  const [listings,    setListings]    = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [actionId,    setActionId]    = useState(null); // id currently being acted on
  const [flashMsg,    setFlashMsg]    = useState(null); // { type: 'success'|'error', text }

  const flash = (type, text) => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg(null), 4000);
  };

  const reload = () => {
    setLoading(true);
    hostAPI.getListings()
      .then(r => { setListings(r.data.experiences || []); })
      .catch(() => flash('error', 'Failed to refresh listings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []); // eslint-disable-line

  useEffect(() => {
    let r = [...listings];
    if (search) r = r.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All Categories') r = r.filter(l => l.category === category);
    if (statusFilter !== 'All Status') r = r.filter(l => l.status === statusFilter);
    setFiltered(r);
    setPage(1);
  }, [search, category, statusFilter, listings]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const pendingCount  = listings.filter(l => l.status === 'pending').length;
  const rejectedCount = listings.filter(l => ['rejected', 'changes_requested'].includes(l.status)).length;

  const handleDelete = async (exp) => {
    if (exp.status === 'live') {
      flash('error', `Cannot delete "${exp.title}" — it's live. Pause it first.`);
      return;
    }
    if (!window.confirm(`Delete "${exp.title}"? This cannot be undone.`)) return;
    setActionId(exp._id);
    try {
      await hostAPI.deleteListing(exp._id);
      setListings(prev => prev.filter(l => l._id !== exp._id));
      flash('success', `"${exp.title}" deleted.`);
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to delete listing.');
    } finally {
      setActionId(null);
    }
  };

  const handleResubmit = async (exp) => {
    if (!window.confirm(`Resubmit "${exp.title}" for admin review?`)) return;
    setActionId(exp._id);
    try {
      await hostAPI.resubmitListing(exp._id);
      flash('success', `"${exp.title}" resubmitted — awaiting admin review.`);
      reload();
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to resubmit listing.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <Layout>
      <div id="listings-page" className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          <span>Portal</span><span>›</span>
          <span className="text-[#1A5F45] font-medium">Listings</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Listings</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-lg">
              New listings go to <strong>Pending Review</strong> until an admin approves them. Only approved listings are visible to customers.
            </p>
          </div>
          <button
            onClick={() => navigate('/listings/new')}
            className="flex items-center gap-2 bg-[#1A5F45] hover:bg-[#145038] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex-shrink-0 shadow-sm"
          >
            <PlusIcon /> Create New Listing
          </button>
        </div>

        {/* Flash message */}
        {flashMsg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
            flashMsg.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {flashMsg.text}
          </div>
        )}

        {/* Status banners */}
        {pendingCount > 0 && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            <svg className="w-4 h-4 flex-shrink-0 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>
              <strong>{pendingCount} listing{pendingCount > 1 ? 's' : ''}</strong> awaiting admin approval — not yet visible to customers.
            </span>
          </div>
        )}
        {rejectedCount > 0 && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            <svg className="w-4 h-4 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>
              <strong>{rejectedCount} listing{rejectedCount > 1 ? 's' : ''}</strong> require your attention — edit and resubmit to re-enter the review queue.
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text" placeholder="Filter by name..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="text-sm bg-transparent text-gray-700 placeholder-gray-400 outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">Category</span>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 outline-none focus:border-[#1A5F45] cursor-pointer">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">Status</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 outline-none focus:border-[#1A5F45] cursor-pointer">
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s]?.label || s}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={reload} title="Refresh" className="p-2.5 text-gray-400 hover:text-[#1A5F45] hover:bg-gray-50 rounded-xl border border-gray-200 transition">
              <RefreshIcon />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-7 h-7 border-4 border-[#1A5F45] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 w-2/5">Listing</th>
                    <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5">Category</th>
                    <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5">Price</th>
                    <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5">Status</th>
                    <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-12 text-sm">No listings found.</td>
                    </tr>
                  ) : paginated.map(exp => {
                    const isRejected = ['rejected', 'changes_requested'].includes(exp.status);
                    const isPending  = exp.status === 'pending';
                    const busy       = actionId === exp._id;
                    return (
                      <>
                        <tr key={exp._id} className={`hover:bg-gray-50/50 transition ${isRejected ? 'bg-red-50/30' : ''}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                <img
                                  src={exp.images?.[0] || FALLBACK_IMAGES[exp.category] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80'}
                                  className="w-full h-full object-cover"
                                  alt={exp.title}
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{exp.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {typeof exp.location === 'object'
                                    ? `${exp.location?.city || ''}${exp.location?.country ? ', ' + exp.location.country : ''}`
                                    : exp.location}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-semibold text-gray-900">&#8377;{exp.price}</span>
                            <span className="text-xs text-gray-400"> / {exp.duration || 'trip'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={exp.status} />
                              {isPending && (
                                <span className="text-[10px] text-yellow-600">Under review</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Resubmit — only for rejected */}
                              {isRejected && (
                                <button
                                  onClick={() => handleResubmit(exp)}
                                  disabled={busy}
                                  title="Resubmit for review"
                                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition disabled:opacity-40"
                                >
                                  {busy ? (
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  ) : <RefreshIcon />}
                                </button>
                              )}

                              {/* Edit — disabled while pending */}
                              <button
                                onClick={() => !isPending && navigate(`/listings/${exp._id}/edit`)}
                                title={isPending ? 'Cannot edit — awaiting review' : 'Edit'}
                                className={`p-2 rounded-lg transition ${
                                  isPending
                                    ? 'text-gray-200 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <EditIcon />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(exp)}
                                disabled={busy}
                                title="Delete"
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                              >
                                {busy ? (
                                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : <TrashIcon />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Rejection reason row */}
                        {isRejected && exp.rejectionReason && (
                          <tr key={`${exp._id}-reason`} className="bg-red-50/50">
                            <td colSpan={5} className="px-5 pb-3 pt-0">
                              <div className="flex items-start gap-2 bg-white border border-red-200 rounded-xl px-4 py-2.5">
                                <span className="text-red-500 font-bold text-sm mt-0.5">✕</span>
                                <div>
                                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide mb-0.5">Admin Feedback</p>
                                  <p className="text-sm text-red-800">{exp.rejectionReason}</p>
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    Edit your listing to address this feedback, then click <strong>Resubmit</strong>.
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {filtered.length > PER_PAGE && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/30">
                  <span className="text-xs text-gray-500">
                    Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} listings
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition text-sm">
                      &#8249;
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setPage(n)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                          page === n ? 'bg-[#1A5F45] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}>
                        {n}
                      </button>
                    ))}
                    {totalPages > 5 && <span className="text-gray-400 px-1 text-xs">…</span>}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition text-sm">
                      &#8250;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
