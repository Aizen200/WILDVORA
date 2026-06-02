import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const CATEGORIES = ['All Categories','Camping','Trekking','Kayaking','Cycling','Wildlife','Resorts'];
const STATUSES   = ['All Status','live','draft','pending','paused'];
const PER_PAGE   = 10;

const StatusBadge = ({ status }) => {
  const cls = {
    live:    'bg-green-50 text-green-700 border border-green-200',
    draft:   'bg-gray-100 text-gray-500 border border-gray-200',
    pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    paused:  'bg-red-50 text-red-600 border border-red-200',
  }[status] || 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
};

export default function Listings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All Categories');
  const [status,   setStatus]   = useState('All Status');
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    hostAPI.getListings()
      .then(r => { setListings(r.data.experiences); setFiltered(r.data.experiences); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let r = [...listings];
    if (search)   r = r.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All Categories') r = r.filter(l => l.category === category);
    if (status   !== 'All Status')     r = r.filter(l => l.status   === status);
    setFiltered(r); setPage(1);
  }, [search, category, status, listings]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    setDeleting(id);
    await hostAPI.editListing(id, { status: 'paused' });
    setListings(prev => prev.filter(l => l._id !== id));
    setDeleting(null);
  };

  return (
    <Layout>
      <div id="listings-page" className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          <span>Portal</span>
          <span>›</span>
          <span className="text-[#1A5F45] font-medium">Listings</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Listings</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-lg">
              Manage your outdoor experiences, modify trek details, and monitor booking status across your catalog.
            </p>
          </div>
          <button
            onClick={() => navigate('/listings/new')}
            className="flex items-center gap-2 bg-[#1A5F45] hover:bg-[#145038] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex-shrink-0 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create New Listing
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Filter by name..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="text-sm bg-transparent text-gray-700 placeholder-gray-400 outline-none flex-1" />
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
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 outline-none focus:border-[#1A5F45] cursor-pointer">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
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
                  ) : paginated.map(exp => (
                    <tr key={exp._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                            {exp.images?.[0]
                              ? <img src={exp.images[0]} className="w-full h-full object-cover" alt={exp.title} />
                              : <div className="w-full h-full bg-gradient-to-br from-[#C8E6D4] to-[#78B99A]" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{exp.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{exp.location}</p>
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
                        <span className="text-xs text-gray-400"> / {exp.duration || 'night'}</span>
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={exp.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => navigate(`/listings/${exp._id}/edit`)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button onClick={() => navigate(`/listings/${exp._id}`)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="View">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(exp._id)} disabled={deleting === exp._id}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
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
                  {totalPages > 5 && <span className="text-gray-400 px-1 text-xs">...</span>}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition text-sm">
                    &#8250;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}