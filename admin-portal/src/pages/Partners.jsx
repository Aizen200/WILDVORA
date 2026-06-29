import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/* ── KYC badge ───────────────────────────────── */
function KYCBadge({ status }) {
  const map = {
    approved: { bg: '#d1fae5', text: '#065f46', dot: '#10b981', label: '✓ Verified' },
    pending:  { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: '⟳ Pending' },
    rejected: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444', label: '✕ Rejected' },
  };
  const cfg = map[status] || map.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

/* ── Partner type tab ────────────────────────── */
const PARTNER_TYPES = ['Hosts', 'Guides', 'Photographers', 'Equipment', 'Transport'];
const PARTNER_TYPE_MAP = {
  Hosts:         'host',
  Guides:        'guide',
  Photographers: 'photographer',
  Equipment:     'equipment',
  Transport:     'transport',
};

/* ── Avatar ──────────────────────────────────── */
function Avatar({ name, avatar }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
      />
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
      style={{ background: 'linear-gradient(135deg,#052618 0%,#1A5F45 100%)', color: '#c6f6d5' }}
    >
      {initials}
    </div>
  );
}

/* ── Detail Modal ────────────────────────────── */
function PartnerDetailModal({ partner, onClose, onKYCUpdate }) {
  const [kycAction, setKycAction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!partner) return null;

  const handleKYC = async (status) => {
    setSubmitting(true);
    try {
      await onKYCUpdate(partner._id, status);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Partner Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition cursor-pointer">✕</button>
        </div>
        <div className="px-6 py-5">
          {/* Top info */}
          <div className="flex items-start gap-4 mb-5">
            <Avatar name={partner.name} avatar={partner.avatar} />
            <div>
              <div className="font-black text-gray-900 text-lg leading-snug">{partner.name}</div>
              <div className="text-sm text-gray-500">{partner.email}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <KYCBadge status={partner.kyc} />
                {partner.payoutStatus === 'verified' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    Payout Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-5">
            {[
              { label: 'Phone', value: partner.phone || '—' },
              { label: 'City', value: partner.city || '—' },
              { label: 'Joined', value: partner.createdAt ? new Date(partner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
              { label: 'Account Status', value: partner.isActive ? 'Active' : 'Suspended' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">{label}</div>
                <div className="font-semibold text-gray-800">{value}</div>
              </div>
            ))}
          </div>

          {/* KYC update actions */}
          {partner.kyc !== 'approved' && (
            <div className="mb-4">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Update KYC Status</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleKYC('approved')}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                >
                  ✓ Approve KYC
                </button>
                <button
                  onClick={() => handleKYC('rejected')}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                >
                  ✕ Reject KYC
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Onboard Partner Modal ───────────────────── */
function OnboardModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Onboard New Partner</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition cursor-pointer">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Partners self-register through the Operator App. Use this panel to send an invitation or track a partner's onboarding status.
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Partner email address"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/40"
          />
          <button className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#1A5F45] text-white hover:bg-[#144d38] transition cursor-pointer">
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────── */
export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('Hosts');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [detailPartner, setDetailPartner] = useState(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [flash, setFlash] = useState('');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/hosts');
      if (res.data?.success) setPartners(res.data.hosts);
    } catch (e) {
      console.error('Partners load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const handleKYCUpdate = async (id, status) => {
    try {
      await api.patch(`/admin/hosts/${id}/kyc`, { status });
      setPartners(prev => prev.map(p => p._id === id ? { ...p, kyc: status } : p));
      showFlash(`KYC status updated to "${status}".`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update KYC');
    }
  };

  const handleToggleStatus = async (partner) => {
    try {
      const res = await api.patch(`/admin/users/${partner._id}/toggle-status`);
      if (res.data?.success) {
        setPartners(prev => prev.map(p => p._id === partner._id ? { ...p, isActive: !p.isActive } : p));
        showFlash(`${partner.name} ${!partner.isActive ? 'activated' : 'suspended'}.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  /* Derived stats */
  const totalPartners  = partners.length;
  const pendingKYC     = partners.filter(p => p.kyc === 'pending').length;
  const verifiedCount  = partners.filter(p => p.kyc === 'approved').length;
  const avgRating = 4.8; // Computed from listings not directly from host model

  /* Filter + search */
  const filtered = partners.filter(p => {
    const q = search.toLowerCase();
    return !q || (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="min-h-screen px-8 py-8" style={{ background: '#f4f6f4' }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Partner Ecosystem</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and verify the professional outdoor service network across India.</p>
        </div>
        <button
          onClick={() => setShowOnboard(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1A5F45] text-white hover:bg-[#144d38] transition shadow cursor-pointer"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <line x1="21" y1="11" x2="21" y2="17"/><line x1="18" y1="14" x2="24" y2="14"/>
          </svg>
          Onboard New Partner
        </button>
      </div>

      {/* Flash */}
      {flash && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{flash}</div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-white p-5 border" style={{ borderColor: '#e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total Partners</div>
          <div className="text-4xl font-black text-gray-900">{totalPartners.toLocaleString()}</div>
          <div className="text-xs text-emerald-600 font-bold mt-1">+{verifiedCount} verified</div>
        </div>
        <div className="rounded-2xl bg-white p-5 border border-amber-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pending KYC</div>
          <div className="text-4xl font-black text-gray-900">{pendingKYC}</div>
          {pendingKYC > 0 && (
            <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">ACTION REQ</span>
          )}
        </div>
        <div className="rounded-2xl bg-white p-5 border" style={{ borderColor: '#e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Avg. Response</div>
          <div className="text-4xl font-black text-gray-900">1.4h</div>
          <div className="text-xs text-emerald-600 font-bold mt-1">-15m↓ vs last week</div>
        </div>
        <div className="rounded-2xl bg-white p-5 border" style={{ borderColor: '#e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Safety Rating</div>
          <div className="text-4xl font-black text-amber-500">
            {avgRating} {'★'.repeat(Math.round(avgRating))}
          </div>
        </div>
      </div>

      {/* ── Partner Type Tabs ── */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {/* Tab bar */}
        <div className="flex items-center border-b px-2 pt-3" style={{ borderColor: '#f3f4f6' }}>
          {PARTNER_TYPES.map(t => (
            <button
              key={t}
              onClick={() => { setActiveType(t); setPage(1); }}
              className={`relative px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer rounded-t-lg mr-1 ${
                activeType === t
                  ? 'text-[#052618] border-b-2 border-[#052618]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pb-2 pr-2">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search partners, KYC IDs..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1A5F45]/30 w-56 transition"
              />
            </div>
            <button onClick={loadPartners} className="px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition cursor-pointer">↻</button>
          </div>
        </div>

        {/* Table header */}
        <div
          className="grid px-5 py-3 text-[11px] font-black uppercase tracking-wider text-gray-400 border-b"
          style={{ gridTemplateColumns: '2fr 1.5fr 1.2fr 0.8fr 0.8fr 1fr 1.5fr', borderColor: '#f9fafb' }}
        >
          <span>Partner Name</span>
          <span>Partner Type</span>
          <span>KYC Status</span>
          <span>Listings</span>
          <span>Rating</span>
          <span>Response</span>
          <span>Actions</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-[#1A5F45] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading partners...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            <p className="text-gray-400 text-sm font-medium">No partners found.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#f9fafb' }}>
            {paginated.map(p => {
              const responseTime = p.responseTime || '1.2h';
              const listingsCount = p.listingsCount ?? 0;
              const partnerType = p.partnerType || 'Mountain Guide';
              return (
                <div
                  key={p._id}
                  className="grid items-center px-5 py-4 hover:bg-gray-50/60 transition-all"
                  style={{ gridTemplateColumns: '2fr 1.5fr 1.2fr 0.8fr 0.8fr 1fr 1.5fr' }}
                >
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} avatar={p.avatar} />
                    <div>
                      <div className="text-sm font-bold text-gray-900 leading-snug">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.city || 'India'}</div>
                    </div>
                  </div>

                  {/* Type */}
                  <span className="text-sm text-gray-600 font-medium">{partnerType}</span>

                  {/* KYC */}
                  <KYCBadge status={p.kyc} />

                  {/* Listings */}
                  <span className="text-sm font-bold text-gray-700">{listingsCount}</span>

                  {/* Rating */}
                  <span className="text-sm font-bold text-amber-500">
                    {p.kyc === 'approved' && p.avgRating > 0 ? `${p.avgRating.toFixed(1)} ★` : 'N/A'}
                  </span>

                  {/* Response */}
                  <span className="text-sm text-gray-600">{responseTime}</span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDetailPartner(p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                    >
                      Details
                    </button>
                    {p.kyc === 'pending' && (
                      <button
                        onClick={() => setDetailPartner(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                      >
                        Review KYC
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        p.isActive
                          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      }`}
                    >
                      {p.isActive ? 'Suspend' : 'Activate'}
                    </button>
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
              Showing {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} partners
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className="w-8 h-8 rounded-lg text-sm font-semibold border transition cursor-pointer"
                  style={{ background: page === n ? '#1A5F45' : '#fff', color: page === n ? '#fff' : '#374151', borderColor: page === n ? '#1A5F45' : '#e5e7eb' }}
                >
                  {n}
                </button>
              ))}
              {totalPages > 5 && <span className="text-sm text-gray-400 px-1">...</span>}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >›</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Panels ── */}
      <div className="grid grid-cols-2 gap-5 mt-6">
        {/* Review KYC CTA */}
        <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg,#052618 0%,#0a4028 100%)' }}>
          <div className="font-bold text-white text-base">Review KYC Documents</div>
          <div className="text-sm text-white/70 leading-relaxed">
            There are <span className="font-bold text-amber-300">{pendingKYC}</span> pending applications waiting for your verification. Process these to expand the Wildvora network.
          </div>
          <button
            onClick={() => setDetailPartner(partners.find(p => p.kyc === 'pending') || null)}
            className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-white/30 hover:bg-white/10 transition cursor-pointer"
          >
            Open Review Queue →
          </button>
        </div>

        {/* Safety Training */}
        <div className="rounded-2xl p-6 flex flex-col items-center text-center gap-3 border bg-white" style={{ borderColor: '#e6eae6' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f0f5f1' }}>
            <svg width="22" height="22" fill="none" stroke="#1A5F45" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div className="font-bold text-gray-900">Safety Training Workflow</div>
          <div className="text-sm text-gray-500 leading-relaxed">
            Assign verified partners to mandatory safety protocols and wilderness first-aid training programs.
          </div>
          <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-800 border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
            Assign to Training
          </button>
        </div>
      </div>

      {/* Modals */}
      {detailPartner && (
        <PartnerDetailModal
          partner={detailPartner}
          onClose={() => setDetailPartner(null)}
          onKYCUpdate={handleKYCUpdate}
        />
      )}
      {showOnboard && <OnboardModal onClose={() => setShowOnboard(false)} />}
    </div>
  );
}
