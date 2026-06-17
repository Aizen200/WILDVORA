import { useState, useEffect } from 'react';
import { FilterIcon, CheckIcon, XCircleIcon, MapPinIcon, CalIcon, EyeIcon } from '../components/Shared.jsx';
import api from '../api/axios';

function RejectionModal({ listing, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Reject Listing</h2>
        <p className="text-gray-500 text-sm mb-4">
          Provide a reason for rejecting <span className="font-semibold text-gray-700">"{listing.name}"</span>.
          The operator will see this feedback.
        </p>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 resize-none focus:outline-none focus:border-emerald-400"
          rows={4}
          placeholder="e.g., Missing safety certifications, images are unclear, description is too vague..."
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
              if (!reason.trim()) { alert('Please provide a rejection reason.'); return; }
              onConfirm(reason.trim());
            }}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer"
          >
            Reject Listing
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ listing, onClose, onApprove, onReject }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="relative">
          <img
            src={listing.img}
            alt={listing.name}
            className="w-full h-52 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-white shadow cursor-pointer"
          >
            ✕
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
            {listing.difficulty && <span>📊 {listing.difficulty}</span>}
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
                    ✓ {inc}
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
                    ✕ {exc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {listing.availableDates?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Dates</h3>
              <div className="flex flex-wrap gap-1.5">
                {listing.availableDates.map((d, i) => (
                  <span key={i} className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-full border border-gray-200">
                    {d}
                  </span>
                ))}
              </div>
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

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all cursor-pointer"
          >
            <CheckIcon /> Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-500 bg-white hover:bg-red-50 transition-all cursor-pointer"
          >
            <XCircleIcon /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListingsApprovalQueue() {
  const [listings, setListings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [detailListing, setDetailListing] = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [actionMsg, setActionMsg]         = useState('');

  const fetchPendingListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/listings/pending');
      if (res.data?.success) {
        setListings(res.data.listings.map(l => ({
          _id:            l._id,
          name:           l.title,
          host:           l.host?.name || l.hostName || 'Operator',
          operatorEmail:  l.host?.email || '',
          kycStatus:      l.host?.kyc || '',
          date:           new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          location:       l.location ? `${l.location.city || ''}, ${l.location.country || ''}` : '—',
          img:            l.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=260&fit=crop',
          price:          l.price,
          duration:       l.duration,
          difficulty:     l.difficulty,
          description:    l.description,
          includes:       l.includes || [],
          exclusions:     l.exclusions || [],
          availableDates: l.availableDates || [],
        })));
      }
    } catch (err) {
      console.error('Failed to fetch pending listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingListings(); }, []);

  const flash = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3500);
  };

  const handleApprove = async (listing) => {
    try {
      const res = await api.patch(`/admin/listings/${listing._id}/approve`);
      if (res.data?.success) {
        setListings(prev => prev.filter(l => l._id !== listing._id));
        setDetailListing(null);
        flash(`✓ "${listing.name}" approved and is now live in the customer app.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve listing.');
    }
  };

  const handleRejectConfirm = async (listing, reason) => {
    try {
      const res = await api.patch(`/admin/listings/${listing._id}/reject`, { status: 'rejected', reason });
      if (res.data?.success) {
        setListings(prev => prev.filter(l => l._id !== listing._id));
        setRejectTarget(null);
        setDetailListing(null);
        flash(`✕ "${listing.name}" rejected. Feedback sent to operator.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject listing.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8" style={{ backgroundColor: '#f5f1ea' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pending Review</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading
              ? 'Loading...'
              : listings.length === 0
              ? 'All listings have been reviewed — nothing pending.'
              : `${listings.length} listing${listings.length > 1 ? 's' : ''} awaiting approval, newest first.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPendingListings}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 transition-all cursor-pointer"
          >
            ↻ Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 transition-all cursor-pointer">
            <FilterIcon /> Filter
          </button>
        </div>
      </div>

      {/* Flash message */}
      {actionMsg && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
          actionMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading pending listings...</div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-gray-600 font-semibold">All listings reviewed</p>
          <p className="text-gray-400 text-sm mt-1">New operator submissions will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {listings.map((l) => (
            <div
              key={l._id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
            >
              {/* Image */}
              <div className="relative">
                <img src={l.img} alt={l.name} className="w-full h-44 object-cover" />
                <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200 tracking-wide">
                  EXPERIENCE
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-gray-900 font-bold text-sm mb-1 truncate">{l.name}</h3>
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium mb-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {l.host}
                  {l.kycStatus && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
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

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(l)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    <CheckIcon /> Approve
                  </button>
                  <button
                    onClick={() => setRejectTarget(l)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 bg-white hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <XCircleIcon /> Reject
                  </button>
                  <button
                    onClick={() => setDetailListing(l)}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <EyeIcon /> Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
          onReject={() => { setRejectTarget(detailListing); setDetailListing(null); }}
        />
      )}

      {/* Rejection reason modal */}
      {rejectTarget && (
        <RejectionModal
          listing={rejectTarget}
          onConfirm={(reason) => handleRejectConfirm(rejectTarget, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
