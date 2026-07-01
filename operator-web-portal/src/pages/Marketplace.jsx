import { useState, useEffect } from 'react';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const TYPE_META = {
  guide:        { label: 'Local Guide',         icon: '🧭', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  photographer: { label: 'Photographer',         icon: '📸', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  transport:    { label: 'Transport Provider',   icon: '🚙', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  rental:       { label: 'Equipment Rental',     icon: '⛺', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  cafe:         { label: 'Local Café',           icon: '☕', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  homestay:     { label: 'Homestay',             icon: '🏡', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const ALL_TYPES = ['all', 'guide', 'photographer', 'transport', 'rental', 'cafe', 'homestay'];

export default function Marketplace() {
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [search, setSearch]       = useState('');
  const [linking, setLinking]     = useState({});
  const [toast, setToast]         = useState('');

  const fetchServices = () => {
    setLoading(true);
    hostAPI.getMarketplace()
      .then(res => { if (res.data.success) setServices(res.data.services); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleToggle = async (svc) => {
    setLinking(prev => ({ ...prev, [svc._id]: true }));
    try {
      if (svc.collaborating) {
        await hostAPI.unlinkService(svc._id);
        setServices(prev => prev.map(s => s._id === svc._id ? { ...s, collaborating: false } : s));
        showToast(`Unlinked from ${svc.name}`);
      } else {
        await hostAPI.linkService(svc._id);
        setServices(prev => prev.map(s => s._id === svc._id ? { ...s, collaborating: true } : s));
        showToast(`Linked with ${svc.name}! 🎉`);
      }
    } catch (e) {
      showToast('Action failed. Please try again.');
    } finally {
      setLinking(prev => ({ ...prev, [svc._id]: false }));
    }
  };

  const filtered = services.filter(s => {
    const typeMatch = activeType === 'all' || s.type === activeType;
    const searchMatch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.location?.toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  const linked = services.filter(s => s.collaborating);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Toast */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 bg-[#1A5F45] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg transition-all">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Local Services Marketplace</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Collaborate with nearby guides, photographers, transport providers, gear shops, cafés & homestays.
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or location…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/20 focus:border-[#1A5F45]"
            />
          </div>
        </div>

        {/* Active collaborations banner */}
        {linked.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-emerald-700 mr-1">Your active collaborations:</span>
            {linked.map(s => (
              <span key={s._id} className="text-xs bg-white border border-emerald-200 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
                {TYPE_META[s.type]?.icon} {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Type filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {ALL_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeType === t
                  ? 'bg-[#1A5F45] text-white border-[#1A5F45]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {t === 'all' ? '🌐 All' : `${TYPE_META[t]?.icon} ${TYPE_META[t]?.label}`}
            </button>
          ))}
        </div>

        {/* Services grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-[#1A5F45] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm font-medium">No local services match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(svc => {
              const meta = TYPE_META[svc.type] || {};
              const isLinking = linking[svc._id];
              return (
                <div
                  key={svc._id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col gap-3 transition-all hover:shadow-md ${
                    svc.collaborating ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl">
                        {meta.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{svc.name}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    {svc.collaborating && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                        ✓ Linked
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{svc.description}</p>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {svc.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      {svc.rating?.toFixed(1)} ({svc.reviewsCount} reviews)
                    </span>
                  </div>

                  {/* Price + contact row */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <div>
                      <p className="text-base font-extrabold text-gray-900">
                        ₹{svc.price?.toLocaleString('en-IN')}
                        <span className="text-xs font-medium text-gray-400">/{svc.priceUnit}</span>
                      </p>
                      <p className="text-[10px] text-gray-400">{svc.contact}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(svc)}
                      disabled={isLinking}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        svc.collaborating
                          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          : 'bg-[#1A5F45] text-white border-[#1A5F45] hover:bg-[#15503B]'
                      } ${isLinking ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {isLinking
                        ? '…'
                        : svc.collaborating
                        ? 'Unlink'
                        : '+ Collaborate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
