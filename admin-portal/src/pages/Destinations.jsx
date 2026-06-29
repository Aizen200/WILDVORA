import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/* ── Status badge ────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    'Weather Alert': { bg: '#fee2e2', text: '#991b1b', icon: '⚠' },
    'Peak Season':   { bg: '#d1fae5', text: '#065f46', icon: '◎' },
    'Moderate Rain': { bg: '#fef3c7', text: '#92400e', icon: '🌧' },
    'Heavy Snow':    { bg: '#eff6ff', text: '#1e40af', icon: '❄' },
    'Normal':        { bg: '#f3f4f6', text: '#374151', icon: '●' },
  };
  const cfg = map[status] || map['Normal'];
  return (
    <span
      className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.icon} {status}
    </span>
  );
}

/* ── Road Status dot ─────────────────────────── */
function RoadDot({ status }) {
  const isOpen = status?.toLowerCase().includes('open');
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold">
      <span
        className="w-2 h-2 rounded-full inline-block"
        style={{ background: isOpen ? '#10b981' : '#ef4444' }}
      />
      {status || '—'}
    </span>
  );
}

/* ── Add / Edit Destination Modal ────────────── */
function DestinationModal({ initial, onSave, onClose }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState({
    title:              initial?.title || '',
    state:              initial?.state || '',
    region:             initial?.region || '',
    status:             initial?.status || 'Normal',
    bestSeason:         initial?.bestSeason || '',
    roadStatus:         initial?.roadStatus || 'All Routes Open',
    permitRequirements: initial?.permitRequirements || '',
    emergencyContact:   initial?.emergencyContact || '',
    coverImage:         initial?.coverImage || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async () => {
    if (!form.title || !form.state || !form.region) {
      alert('Title, State, and Region are required.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const statuses = ['Normal', 'Weather Alert', 'Peak Season', 'Moderate Rain', 'Heavy Snow'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Destination' : 'Add New Circuit'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition cursor-pointer">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {[
            { label: 'Destination Name', key: 'title', placeholder: 'e.g. Spiti Valley' },
            { label: 'State', key: 'state', placeholder: 'e.g. Himachal Pradesh' },
            { label: 'Region', key: 'region', placeholder: 'e.g. Northern Himalayas' },
            { label: 'Best Season', key: 'bestSeason', placeholder: 'e.g. June – September' },
            { label: 'Road Status', key: 'roadStatus', placeholder: 'e.g. Kunzum Pass Closed' },
            { label: 'Cover Image URL', key: 'coverImage', placeholder: 'https://...' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/40 transition"
              />
            </div>
          ))}

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Weather / Alert Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/40 transition cursor-pointer"
            >
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Permit Requirements</label>
            <textarea
              rows={2}
              placeholder="Describe any special permits required..."
              value={form.permitRequirements}
              onChange={e => set('permitRequirements', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/40 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Emergency Contact</label>
            <input
              type="text"
              placeholder="e.g. Kaza District Hospital: +91 1906 222218"
              value={form.emergencyContact}
              onChange={e => set('emergencyContact', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/40 transition"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#1A5F45] hover:bg-[#144d38] transition cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Circuit'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Weather Advisory Modal ──────────────────── */
function AdvisoryModal({ destination, onSave, onClose }) {
  const [status, setStatus] = useState(destination?.status || 'Normal');
  const [roadStatus, setRoadStatus] = useState(destination?.roadStatus || 'All Routes Open');
  const [saving, setSaving] = useState(false);

  const statuses = ['Normal', 'Weather Alert', 'Peak Season', 'Moderate Rain', 'Heavy Snow'];

  const handle = async () => {
    setSaving(true);
    try {
      await onSave({ status, roadStatus });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Update Advisory — {destination?.title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition cursor-pointer">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Alert Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/40 transition cursor-pointer"
            >
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Road Status</label>
            <input
              type="text"
              value={roadStatus}
              onChange={e => setRoadStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/40 transition"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
          <button
            onClick={handle}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#1A5F45] hover:bg-[#144d38] transition cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Updating...' : 'Update Advisory'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Destination Card ────────────────────────── */
function DestCard({ dest, onEditAdvisory, onEdit }) {
  const hasImage = !!dest.coverImage;
  return (
    <div className="rounded-2xl overflow-hidden border bg-white" style={{ borderColor: '#e6eae6', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
      {/* Image area */}
      <div className="relative h-48">
        {hasImage ? (
          <img
            src={dest.coverImage}
            alt={dest.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#052618 0%,#0a4028 60%,#1A5F45 100%)' }}
          >
            <svg width="48" height="48" fill="none" stroke="#7ec8a4" strokeWidth={1} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          </div>
        )}
        <StatusBadge status={dest.status} />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}>
          <div className="text-white font-black text-lg leading-snug">{dest.title}</div>
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {dest.state}, {dest.region}
          </div>
        </div>
      </div>

      {/* Info area */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: '#f8faf8', border: '1px solid #eef2ee' }}>
            <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Best Season</div>
            <div className="text-sm font-bold text-gray-800">{dest.bestSeason || '—'}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: '#f8faf8', border: '1px solid #eef2ee' }}>
            <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Road Status</div>
            <RoadDot status={dest.roadStatus} />
          </div>
        </div>

        {dest.permitRequirements && (
          <div className="flex gap-2 text-xs text-gray-600">
            <span className="flex-shrink-0 mt-0.5">📄</span>
            <span className="leading-relaxed">{dest.permitRequirements}</span>
          </div>
        )}

        {dest.emergencyContact && (
          <div className="flex gap-2 text-xs text-gray-600 font-mono">
            <span className="flex-shrink-0 mt-0.5">🆘</span>
            <span className="leading-relaxed">{dest.emergencyContact}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onEditAdvisory(dest)}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer"
            style={{ background: '#1A5F45' }}
          >
            Update Weather Advisory
          </button>
          <button
            onClick={() => onEdit(dest)}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition cursor-pointer flex-shrink-0"
            title="Edit destination details"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────── */
export default function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [addModal, setAddModal]           = useState(false);
  const [editTarget, setEditTarget]       = useState(null);   // for full edit
  const [advisoryTarget, setAdvisoryTarget] = useState(null); // for weather advisory
  const [flash, setFlash]                 = useState('');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/destinations');
      if (res.data?.success) setDestinations(res.data.destinations);
    } catch (e) {
      console.error('Destinations load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    try {
      const res = await api.post('/admin/destinations', form);
      if (res.data?.success) {
        setDestinations(prev => [res.data.destination, ...prev]);
        setAddModal(false);
        showFlash(`"${form.title}" added successfully.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create destination');
    }
  };

  const handleEdit = async (form) => {
    try {
      const res = await api.patch(`/admin/destinations/${editTarget._id}`, form);
      if (res.data?.success) {
        setDestinations(prev => prev.map(d => d._id === editTarget._id ? res.data.destination : d));
        setEditTarget(null);
        showFlash(`"${form.title}" updated successfully.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update destination');
    }
  };

  const handleAdvisory = async (form) => {
    try {
      const res = await api.patch(`/admin/destinations/${advisoryTarget._id}`, form);
      if (res.data?.success) {
        setDestinations(prev => prev.map(d => d._id === advisoryTarget._id ? res.data.destination : d));
        setAdvisoryTarget(null);
        showFlash(`Advisory updated for "${advisoryTarget.title}".`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update advisory');
    }
  };

  /* Derived stats */
  const activeAdvisories = destinations.filter(d => d.status !== 'Normal').length;
  const roadClosures     = destinations.filter(d => d.roadStatus && !d.roadStatus.toLowerCase().includes('open')).length;

  /* Filtered list */
  const filtered = destinations.filter(d => {
    const matchSearch = !search ||
      (d.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.state || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.region || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const allStatuses = ['All', ...Array.from(new Set(destinations.map(d => d.status).filter(Boolean)))];

  return (
    <div className="min-h-screen px-8 py-8" style={{ background: '#f4f6f4' }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Destination Knowledge Platform</h1>
          <p className="text-gray-500 text-sm mt-1">Live operational status and ecological monitoring for Indian outdoor circuits.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1A5F45] text-white hover:bg-[#144d38] transition shadow cursor-pointer"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Add New Circuit
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition shadow cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Regional Report
          </button>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{flash}</div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          {
            label: 'Live Advisories',
            value: `${activeAdvisories} Active`,
            icon: (
              <svg width="22" height="22" fill="none" stroke="#6b7280" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
              </svg>
            ),
          },
          {
            label: 'Road Closures',
            value: `${roadClosures} Regions`,
            highlight: roadClosures > 0,
            icon: (
              <svg width="22" height="22" fill="none" stroke={roadClosures > 0 ? '#ef4444' : '#6b7280'} strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ),
          },
          {
            label: 'Permits Required',
            value: `${destinations.filter(d => d.permitRequirements).length} Circuits`,
            icon: (
              <svg width="22" height="22" fill="none" stroke="#10b981" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            ),
          },
          {
            label: 'Total Monitored Circuits',
            value: `${destinations.length} Circuits`,
            icon: (
              <svg width="22" height="22" fill="none" stroke="#6b7280" strokeWidth={1.5} viewBox="0 0 24 24">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            ),
          },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 bg-white border flex items-start gap-4"
            style={{ borderColor: s.highlight ? '#fca5a5' : '#e6eae6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: s.highlight ? '#fee2e2' : '#f3f4f6' }}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{s.label}</div>
              <div
                className="text-2xl font-black"
                style={{ color: s.highlight ? '#dc2626' : '#111827' }}
              >
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search destinations, terrains, or permits..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/30 w-80 transition"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-2">
          {allStatuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#1A5F45] text-white border-[#1A5F45]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button onClick={load} className="ml-auto px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition cursor-pointer">
          ↻ Refresh
        </button>
      </div>

      {/* ── Destination Grid ── */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#1A5F45] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-medium">Loading destinations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-gray-200">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <p className="text-gray-500 font-semibold text-lg">No destinations found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new circuit.</p>
          <button
            onClick={() => setAddModal(true)}
            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1A5F45] text-white hover:bg-[#144d38] transition cursor-pointer"
          >
            + Add New Circuit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {filtered.map(dest => (
            <DestCard
              key={dest._id}
              dest={dest}
              onEditAdvisory={(d) => setAdvisoryTarget(d)}
              onEdit={(d) => setEditTarget(d)}
            />
          ))}
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setAddModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full text-2xl font-bold text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform cursor-pointer z-40"
        style={{ background: 'linear-gradient(135deg,#052618 0%,#1A5F45 100%)' }}
        title="Add new destination"
      >
        +
      </button>

      {/* ── Modals ── */}
      {addModal && (
        <DestinationModal
          onSave={handleCreate}
          onClose={() => setAddModal(false)}
        />
      )}
      {editTarget && (
        <DestinationModal
          initial={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {advisoryTarget && (
        <AdvisoryModal
          destination={advisoryTarget}
          onSave={handleAdvisory}
          onClose={() => setAdvisoryTarget(null)}
        />
      )}
    </div>
  );
}
