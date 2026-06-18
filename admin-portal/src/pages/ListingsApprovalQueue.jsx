import { useState, useEffect, useCallback } from 'react';
import { FilterIcon, CheckIcon, XCircleIcon, MapPinIcon, CalIcon, EyeIcon } from '../components/Shared.jsx';
import api from '../api/axios';

const StarIcon = ({ filled }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);


function FeedbackModal({ listing, actionType, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const isRequestChanges = actionType === 'changes_requested';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {isRequestChanges ? 'Request Changes' : 'Reject Listing'}
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Provide a reason for {isRequestChanges ? 'requesting changes to' : 'rejecting'}{' '}
          <span className="font-semibold text-gray-700">"{listing.name}"</span>.
          The operator will see this feedback.
        </p>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 resize-none focus:outline-none focus:border-emerald-400"
          rows={4}
          placeholder={isRequestChanges ? "e.g. Please clarify safety checklist items, update pricing..." : "e.g. Missing safety certifications, images are unclear..."}
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!reason.trim()) { alert('Please provide feedback.'); return; }
              onConfirm(reason.trim());
            }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer ${
              isRequestChanges ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isRequestChanges ? 'Submit Request' : 'Reject Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ listing, onClose, onApprove, onRequestChanges, onReject }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="relative">
          {listing.img ? (
            <img
              src={listing.img}
              alt={listing.name}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-[#052618] to-[#0a4028] flex items-center justify-center">
              <svg className="w-14 h-14 text-white/20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
              </svg>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-white shadow cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{listing.name}</h2>
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium mt-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                {listing.host}
              </div>
            </div>
            {listing.price && (
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">₹{Number(listing.price).toLocaleString()}</div>
                <div className="text-xs text-gray-400">per person</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-gray-500 text-sm mb-4">
            <span className="flex items-center gap-1"><CalIcon /> Submitted {listing.date}</span>
            <span className="flex items-center gap-1"><MapPinIcon /> {listing.location}</span>
            {listing.duration && <span>⏱ {listing.duration}</span>}
            {listing.difficulty && <span>{listing.difficulty}</span>}
          </div>

          {listing.description && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {listing.includes?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Inclusions</h3>
              <div className="flex flex-wrap gap-1.5">
                {listing.includes.map((inc, i) => (
                  <span key={i} className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full border border-emerald-100">
                    {inc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {listing.exclusions?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Exclusions</h3>
              <div className="flex flex-wrap gap-1.5">
                {listing.exclusions.map((exc, i) => (
                  <span key={i} className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full border border-red-100">
                    {exc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Must-Carry Essentials */}
          {listing.requirements?.length > 0 ? (
            <div className="mb-4 border border-blue-100 rounded-xl p-4 bg-blue-50/30">
              <h3 className="text-sm font-semibold text-blue-800 mb-2.5 flex items-center gap-1.5">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Must-Carry Essentials
                <span className="ml-1 text-[10px] font-medium bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{listing.requirements.length} items</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {listing.requirements.map((item, i) => (
                  <span key={i} className="flex items-center gap-1 bg-white text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200 font-medium">
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                No must-carry essentials listed by operator.
              </p>
            </div>
          )}

          {listing.operatorEmail && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Operator Details</h3>
              <p className="text-sm text-gray-700 font-medium">{listing.host}</p>
              <p className="text-sm text-gray-500">{listing.operatorEmail}</p>
              {listing.kycStatus && (
                <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  listing.kycStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  KYC: {listing.kycStatus}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <CheckIcon /> Approve
          </button>
          <button
            onClick={onRequestChanges}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-all cursor-pointer"
          >
            Request Changes
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer"
          >
            <XCircleIcon /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function mapListing(l) {
  return {
    _id:            l._id,
    name:           l.title,
    category:       l.category,
    host:           l.host?.name || l.hostName || 'Operator',
    operatorEmail:  l.host?.email || '',
    kycStatus:      l.host?.kyc || '',
    date:           new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    location:       l.location ? `${l.location.city || ''}, ${l.location.country || ''}` : '—',
    img:            l.images?.[0] || null,
    price:          l.price,
    duration:       l.duration,
    difficulty:     l.difficulty,
    description:    l.description,
    includes:       l.includes || [],
    exclusions:     l.exclusions || [],
    requirements:   l.requirements || [],
    availableDates: l.availableDates || [],
    isFeatured:     l.isFeatured || false,
  };
}

export default function ListingsApprovalQueue() {
  const [activeTab, setActiveTab]         = useState('pending');

  // Pending tab state
  const [listings, setListings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [detailListing, setDetailListing] = useState(null);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [actionMsg, setActionMsg]         = useState('');
  const [actionSuccess, setActionSuccess] = useState(true);

  // Search and Filter states
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Live listings tab state
  const [liveListings, setLiveListings]     = useState([]);
  const [liveLoading, setLiveLoading]       = useState(false);
  const [liveSearch, setLiveSearch]         = useState('');
  const [featuringId, setFeaturingId]       = useState(null);

  const fetchPendingListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/listings/pending');
      if (res.data?.success) {
        setListings(res.data.listings.map(mapListing));
      }
    } catch (err) {
      console.error('Failed to fetch pending listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveListings = useCallback(async () => {
    setLiveLoading(true);
    try {
      const res = await api.get('/admin/listings/live');
      if (res.data?.success) {
        setLiveListings(res.data.listings.map(mapListing));
      }
    } catch (err) {
      console.error('Failed to fetch live listings:', err);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const handleToggleFeatured = async (listing) => {
    setFeaturingId(listing._id);
    try {
      const res = await api.patch(`/admin/listings/${listing._id}/feature`);
      if (res.data?.success) {
        setLiveListings(prev =>
          prev.map(l => l._id === listing._id ? { ...l, isFeatured: res.data.isFeatured } : l)
        );
        flash(
          res.data.isFeatured
            ? `"${listing.name}" is now featured on the customer app.`
            : `"${listing.name}" removed from featured listings.`,
          true
        );
      }
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to update featured status.', false);
    } finally {
      setFeaturingId(null);
    }
  };

  useEffect(() => { fetchPendingListings(); }, []);

  useEffect(() => {
    if (activeTab === 'live') fetchLiveListings();
  }, [activeTab, fetchLiveListings]);

  const flash = (msg, success = true) => {
    setActionMsg(msg);
    setActionSuccess(success);
    setTimeout(() => setActionMsg(''), 3500);
  };

  const handleApprove = async (listing) => {
    try {
      const res = await api.patch(`/admin/listings/${listing._id}/approve`);
      if (res.data?.success) {
        setListings(prev => prev.filter(l => l._id !== listing._id));
        setDetailListing(null);
        flash(`"${listing.name}" approved and is now live.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve listing.');
    }
  };

  const handleActionConfirm = async (listing, status, reason) => {
    try {
      const res = await api.patch(`/admin/listings/${listing._id}/reject`, { status, reason });
      if (res.data?.success) {
        setListings(prev => prev.filter(l => l._id !== listing._id));
        setFeedbackTarget(null);
        setDetailListing(null);
        flash(
          status === 'rejected' ? `"${listing.name}" rejected.` : `Changes requested for "${listing.name}".`,
          false
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  // Derived filtered listings
  const filteredListings = listings.filter(l => {
    const q = searchText.toLowerCase();
    const matchesSearch = !searchText ||
      (l.name || '').toLowerCase().includes(q) ||
      (l.host || '').toLowerCase().includes(q) ||
      (l.location || '').toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'All' || l.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'All' || l.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const activeFilterCount = (categoryFilter !== 'All' ? 1 : 0) + (difficultyFilter !== 'All' ? 1 : 0);

  const filteredLiveListings = liveListings.filter(l => {
    if (!liveSearch) return true;
    const q = liveSearch.toLowerCase();
    return (
      (l.name || '').toLowerCase().includes(q) ||
      (l.host || '').toLowerCase().includes(q) ||
      (l.location || '').toLowerCase().includes(q)
    );
  });

  const featuredCount = liveListings.filter(l => l.isFeatured).length;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8" style={{ backgroundColor: '#f5f1ea' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Listings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage pending approvals and feature live listings on the customer app.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer ${
            activeTab === 'live'
              ? 'border-[#052618] text-[#052618] bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Live Listings
          {featuredCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600">
              <StarIcon filled /> {featuredCount} featured
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'border-[#052618] text-[#052618] bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Review
          {listings.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
              {listings.length}
            </span>
          )}
        </button>
        
      </div>

      {/* Flash message */}
      {actionMsg && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
          actionSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {actionMsg}
        </div>
      )}

      {/* ── Pending Review Tab ── */}
      {activeTab === 'pending' && (
        <>
          <div className="flex items-center justify-between mb-5">
            <p className="text-gray-500 text-sm">
              {loading
                ? 'Loading...'
                : filteredListings.length === 0
                ? 'All listings have been reviewed — nothing pending.'
                : `${filteredListings.length} listing${filteredListings.length > 1 ? 's' : ''} awaiting approval, newest first.`}
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-350 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#052618] w-52 transition"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilterPanel(p => !p)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border shadow-sm transition cursor-pointer ${
                    activeFilterCount > 0
                      ? 'bg-[#052618] text-white border-[#052618]'
                      : 'bg-white text-gray-755 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FilterIcon />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-white text-[#052618] text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {showFilterPanel && (
                  <div className="absolute right-0 top-full mt-2 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter Listings</span>
                      <button
                        onClick={() => { setCategoryFilter('All'); setDifficultyFilter('All'); }}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Category</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['All', 'Trekking', 'Climbing', 'Water Sports', 'Skiing', 'Camping'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setCategoryFilter(opt)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition ${
                              categoryFilter === opt
                                ? 'bg-[#052618] text-white border-[#052618]'
                                : 'bg-gray-50 text-gray-600 border-gray-205 hover:bg-gray-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Difficulty</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['All', 'Easy', 'Moderate', 'Hard', 'Expert'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setDifficultyFilter(opt)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition ${
                              difficultyFilter === opt
                                ? 'bg-[#052618] text-white border-[#052618]'
                                : 'bg-gray-50 text-gray-600 border-gray-205 hover:bg-gray-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={fetchPendingListings}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 transition-all cursor-pointer"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading pending listings...</div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <svg className="w-10 h-10 text-gray-300 mb-3 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <p className="text-gray-600 font-semibold text-lg">No Pending Reviews Match Your Criteria</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search query or filters.</p>
              <button
                onClick={() => { setSearchText(''); setCategoryFilter('All'); setDifficultyFilter('All'); }}
                className="mt-3 text-sm text-[#052618] font-semibold underline cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {filteredListings.map((l) => (
                <div
                  key={l._id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="relative">
                    {l.img ? (
                      <img src={l.img} alt={l.name} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-[#052618] to-[#0a4028] flex items-center justify-center">
                        <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200 tracking-wide">
                      EXPERIENCE
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-gray-900 font-bold text-sm mb-1 truncate">{l.name}</h3>
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium mb-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {l.host}
                      {l.kycStatus && (
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          l.kycStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          KYC: {l.kycStatus}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-xs mb-4">
                      <span className="flex items-center gap-1"><CalIcon /> {l.date}</span>
                      <span className="flex items-center gap-1"><MapPinIcon /> {l.location}</span>
                    </div>
                    {l.price && (
                      <p className="text-gray-700 text-xs font-semibold mb-3">
                        ₹{Number(l.price).toLocaleString()} per person · {l.duration || '—'}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-1.5 mt-2">
                      <button
                        onClick={() => {
                          if (window.confirm(`Approve "${l.name}"?`)) handleApprove(l);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setFeedbackTarget({ listing: l, actionType: 'changes_requested' })}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all cursor-pointer"
                      >
                        Changes
                      </button>
                      <button
                        onClick={() => setFeedbackTarget({ listing: l, actionType: 'rejected' })}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setDetailListing(l)}
                        className="flex items-center justify-center p-1.5 rounded-lg text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 transition-all cursor-pointer"
                        title="Detailed View & Safety Panel"
                      >
                        <EyeIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Live Listings Tab ── */}
      {activeTab === 'live' && (
        <>
          <div className="flex items-center justify-between mb-5">
            <p className="text-gray-500 text-sm">
              {liveLoading
                ? 'Loading...'
                : `${filteredLiveListings.length} live listing${filteredLiveListings.length !== 1 ? 's' : ''}${featuredCount > 0 ? ` · ${featuredCount} featured` : ''}`}
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search live listings..."
                  value={liveSearch}
                  onChange={e => setLiveSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-350 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#052618] w-52 transition"
                />
              </div>
              <button
                onClick={fetchLiveListings}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 transition-all cursor-pointer"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* Featured callout */}
          <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <span className="text-amber-500"><StarIcon filled /></span>
            <span>Featured listings appear in the <span className="font-semibold">"Featured Experiences"</span> section on the customer app home screen. Toggle the star on any live listing to feature or unfeature it.</span>
          </div>

          {liveLoading ? (
            <div className="text-center py-16 text-gray-400">Loading live listings...</div>
          ) : filteredLiveListings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <svg className="w-10 h-10 text-gray-300 mb-3 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <p className="text-gray-600 font-semibold text-lg">No live listings found</p>
              <p className="text-gray-400 text-sm mt-1">Approved listings will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {filteredLiveListings.map((l) => (
                <div
                  key={l._id}
                  className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
                    l.isFeatured ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="relative">
                    {l.img ? (
                      <img src={l.img} alt={l.name} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-[#052618] to-[#0a4028] flex items-center justify-center">
                        <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 tracking-wide">
                      LIVE
                    </span>
                    {l.isFeatured && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-white tracking-wide">
                        <StarIcon filled /> FEATURED
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-gray-900 font-bold text-sm mb-1 truncate">{l.name}</h3>
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium mb-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {l.host}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-xs mb-3">
                      <span className="flex items-center gap-1"><MapPinIcon /> {l.location}</span>
                      {l.duration && <span>⏱ {l.duration}</span>}
                    </div>
                    {l.price && (
                      <p className="text-gray-700 text-xs font-semibold mb-3">
                        ₹{Number(l.price).toLocaleString()} per person
                      </p>
                    )}

                    <button
                      onClick={() => handleToggleFeatured(l)}
                      disabled={featuringId === l._id}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        l.isFeatured
                          ? 'bg-amber-400 text-white hover:bg-amber-500'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300'
                      }`}
                    >
                      <StarIcon filled={l.isFeatured} />
                      {featuringId === l._id
                        ? 'Updating...'
                        : l.isFeatured
                        ? 'Remove from Featured'
                        : 'Mark as Featured'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {detailListing && (
        <DetailModal
          listing={detailListing}
          onClose={() => setDetailListing(null)}
          onApprove={() => {
            if (window.confirm(`Approve "${detailListing.name}"?`)) {
              handleApprove(detailListing);
            }
          }}
          onRequestChanges={() => {
            setFeedbackTarget({ listing: detailListing, actionType: 'changes_requested' });
            setDetailListing(null);
          }}
          onReject={() => {
            setFeedbackTarget({ listing: detailListing, actionType: 'rejected' });
            setDetailListing(null);
          }}
        />
      )}

      {/* Rejection / Request changes reason modal */}
      {feedbackTarget && (
        <FeedbackModal
          listing={feedbackTarget.listing}
          actionType={feedbackTarget.actionType}
          onConfirm={(reason) => handleActionConfirm(feedbackTarget.listing, feedbackTarget.actionType, reason)}
          onCancel={() => setFeedbackTarget(null)}
        />
      )}
    </div>
  );
}
