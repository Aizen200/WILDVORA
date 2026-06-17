import { useState, useEffect } from 'react';
import { FilterIcon, CheckIcon, XCircleIcon, MapPinIcon, CalIcon, EyeIcon } from '../components/Shared.jsx';
import api from '../api/axios';

// Helper to generate safety guidelines dynamically for review if not stored on DB
function getSafetyGuidelines(category, difficulty, location) {
  const diff = difficulty || 'Moderate';
  const cat = category || 'Trekking';
  const city = location || 'the location';

  let checklist = ['Comfortable outdoor shoes', 'Drinking water (1L+)', 'Sunscreen / Cap'];
  let medicalAdvisories = ['Consult a doctor if you have knee/joint issues or balance conditions.'];
  let emergencyContact = '+91 98765 43210';
  let nearestFacility = `${city.split(',')[0]} Emergency Clinic (8 km)`;

  if (cat === 'Trekking' || cat === 'Climbing') {
    if (diff === 'Hard' || diff === 'Expert') {
      checklist = ['Trekking boots with grip', 'Warm layers / windproof jacket', 'Headlamp / Flashlight', 'Hydration pack (2L+)', 'Energy snacks'];
      medicalAdvisories = ['Not recommended for cardiovascular issues, severe asthma, or pregnant women.', 'High altitude acclimation warning.'];
    } else {
      checklist = ['Sturdy walking shoes', 'Backpack (15-20L)', 'Rain coat', 'Water bottle (1.5L)'];
      medicalAdvisories = ['Be mindful of knee strain. Stay hydrated to avoid heat exhaustion.'];
    }
  } else if (cat === 'Water Sports') {
    checklist = ['Swimwear / quick-dry clothes', 'Life jacket (certified)', 'Waterproof pouch for phone', 'Change of dry clothes'];
    medicalAdvisories = ['Basic swimming ability required.', 'Avoid if you have history of seizures or recent shoulder/back injuries.'];
  } else if (cat === 'Skiing') {
    checklist = ['Thermal innerwear', 'Ski gloves and goggles', 'Waterproof snow suit', 'Helmets'];
    medicalAdvisories = ['Not recommended for osteoporosis or severe joint instability.', 'Cold environment warning.'];
  } else if (cat === 'Camping') {
    checklist = ['Personal toiletries', 'Warm socks & jacket', 'Power bank', 'Flashlight', 'Personal medication'];
    medicalAdvisories = ['Carry insect repellent. Keep warm layers handy for temperature drop at night.'];
  }

  return { checklist, medicalAdvisories, emergencyContact, nearestFacility };
}

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
  const safety = getSafetyGuidelines(listing.category, listing.difficulty, listing.location);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="relative">
          {listing.img ? (
            <img
              src={listing.img}
              alt={listing.name}
              className="w-full h-52 object-cover"
            />
          ) : (
            <div className="w-full h-52 bg-gradient-to-br from-[#052618] to-[#0a4028] flex items-center justify-center">
              <svg className="w-14 h-14 text-white/20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
              </svg>
            </div>
          )}
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

          {/* Safety Review Panel */}
          <div className="mb-5 border border-amber-200 rounded-xl p-4 bg-amber-50/15">
            <h3 className="text-sm font-bold text-amber-900 mb-2.5 flex items-center gap-1.5">
              🛡️ Safety & Compliance Review
            </h3>
            <div className="space-y-3.5 text-xs text-gray-700">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Difficulty Rating:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                  {listing.difficulty || 'Moderate'}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-1">Safety Checklist:</span>
                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                  {safety.checklist.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-1">Medical Advisories:</span>
                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                  {safety.medicalAdvisories.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-amber-200/50">
                <div>
                  <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Emergency Contact:</span>
                  <span className="text-gray-600 font-mono font-semibold">{safety.emergencyContact}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Nearest Medical Facility:</span>
                  <span className="text-gray-600 font-semibold">{safety.nearestFacility}</span>
                </div>
              </div>
            </div>
          </div>

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
            ⚠️ Request Changes
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

export default function ListingsApprovalQueue() {
  const [listings, setListings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [detailListing, setDetailListing] = useState(null);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [actionMsg, setActionMsg]         = useState('');

  const fetchPendingListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/listings/pending');
      if (res.data?.success) {
        setListings(res.data.listings.map(l => ({
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
        flash(`✓ "${listing.name}" approved and is now live.`);
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
        flash(status === 'rejected' ? `✕ "${listing.name}" rejected.` : `⚠️ Changes requested for "${listing.name}".`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
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
          <p className="text-gray-600 font-semibold text-lg">No Pending Reviews</p>
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

              {/* Content */}
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

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-1.5 mt-2">
                  <button
                    onClick={() => {
                      if (window.confirm(`Approve "${l.name}"?`)) {
                        handleApprove(l);
                      }
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
