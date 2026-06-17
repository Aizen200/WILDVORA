import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Customers() {
  const [dbCustomers, setDbCustomers] = useState([]);
  const [dbBookings, setDbBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected customer panel
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersRes, bookingsRes] = await Promise.all([
          api.get('/admin/customers'),
          api.get('/admin/bookings'),
        ]);
        if (customersRes.data.success) setDbCustomers(customersRes.data.customers || []);
        if (bookingsRes.data.success) setDbBookings(bookingsRes.data.bookings || []);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch customer data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCustomerStats = (customer) => {
    const list = dbBookings.filter(b => b.user && (b.user._id === customer._id || b.user === customer._id));
    const count = list.length;
    let health = 'New';
    if (!customer.isActive) {
      health = 'Suspended';
    } else if (list.some(b => b.disputed)) {
      health = 'At Risk';
    } else if (count > 5) {
      health = 'Excellent';
    } else if (count > 0) {
      health = 'Good';
    }
    return { bookingsCount: count, health };
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';

  const healthColor = (h) => {
    if (h === 'Excellent') return 'bg-emerald-100 text-emerald-800';
    if (h === 'Good') return 'bg-blue-100 text-blue-800';
    if (h === 'At Risk') return 'bg-amber-100 text-amber-800';
    if (h === 'Suspended') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-600';
  };

  const handleRowClick = async (customer) => {
    setSelectedCustomer(customer);
    setShowPanel(true);
    setCustomerBookings([]);
    setLoadingBookings(true);
    try {
      const res = await api.get(`/admin/customers/${customer._id}/bookings`);
      if (res.data.success) setCustomerBookings(res.data.bookings || []);
    } catch {
      setCustomerBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedCustomer) return;
    setTogglingStatus(true);
    try {
      const res = await api.patch(`/admin/users/${selectedCustomer._id}/toggle-status`);
      if (res.data.success) {
        const updated = { ...selectedCustomer, isActive: !selectedCustomer.isActive };
        setSelectedCustomer(updated);
        setDbCustomers(prev => prev.map(c => c._id === selectedCustomer._id ? { ...c, isActive: !c.isActive } : c));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setTogglingStatus(false);
    }
  };

  const allCustomers = dbCustomers.map(c => ({ ...c, ...getCustomerStats(c) }));
  const filtered = allCustomers.filter(c =>
    (c.name || '').toLowerCase().includes(filterText.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(filterText.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalCustomers = dbCustomers.length;
  const activeBookings = dbBookings.filter(b => b.status === 'confirmed').length;
  const flagged = dbCustomers.filter(c => !c.isActive).length;

  return (
    <div className="px-8 py-8 flex flex-col gap-8 select-none font-sans bg-[#F5F0EB] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Customer Directory</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Click any customer to view their profile and past trips.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={filterText}
              onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name or email..."
              className="pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#052618] w-64"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Customers', value: totalCustomers, color: 'border-[#052618]', sub: 'In database' },
          { label: 'Active Bookings', value: activeBookings, color: 'border-blue-400', sub: 'Confirmed reservations' },
          { label: 'Suspended Accounts', value: flagged, color: 'border-red-400', sub: 'Requires review' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white rounded-2xl p-6 shadow-sm border-t-4 ${stat.color}`}>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
            <div className="text-3xl font-extrabold text-gray-900 mt-2">{stat.value}</div>
            <div className="text-xs text-gray-400 font-medium mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading customers...
          </div>
        ) : error ? (
          <div className="text-center p-16 text-red-500 text-sm font-medium">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-16 text-gray-400 text-sm">No customers found.</div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Bookings</th>
                  <th className="px-6 py-4">Account Health</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(customer => {
                  const stats = getCustomerStats(customer);
                  return (
                    <tr
                      key={customer._id}
                      onClick={() => handleRowClick(customer)}
                      className="hover:bg-[#F5F0EB]/60 transition cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#052618] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {getInitials(customer.name)}
                          </div>
                          <div className="text-sm font-bold text-gray-900 group-hover:text-[#052618] transition">{customer.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(customer.createdAt)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{stats.bookingsCount}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${healthColor(stats.health)}`}>
                          {stats.health}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${customer.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {customer.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500 font-medium">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                >Previous</button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                >Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Customer Detail Side Panel */}
      {showPanel && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setShowPanel(false)}>
          <div
            className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col animate-slideIn"
            onClick={e => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="bg-[#052618] px-8 py-8 flex items-start justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center text-xl font-extrabold border-2 border-white/40">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedCustomer.name}</h2>
                  <p className="text-sm text-white/60 font-medium mt-0.5">{selectedCustomer.email}</p>
                  <p className="text-xs text-white/40 mt-1">Joined {formatDate(selectedCustomer.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setShowPanel(false)} className="text-white/60 hover:text-white transition cursor-pointer">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Account Status', value: selectedCustomer.isActive ? 'Active' : 'Suspended', color: selectedCustomer.isActive ? 'text-emerald-600' : 'text-red-600' },
                  { label: 'Phone', value: selectedCustomer.phone || 'Not provided', color: 'text-gray-700' },
                  { label: 'Role', value: selectedCustomer.role || 'customer', color: 'text-gray-700' },
                  { label: 'Total Trips', value: customerBookings.length, color: 'text-[#052618] font-extrabold' },
                ].map(item => (
                  <div key={item.label} className="bg-[#F5F0EB] rounded-xl p-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</div>
                    <div className={`text-sm font-bold mt-1 ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleToggleStatus}
                  disabled={togglingStatus}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition cursor-pointer disabled:opacity-50 ${
                    selectedCustomer.isActive
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {togglingStatus ? 'Updating...' : selectedCustomer.isActive ? '🚫 Suspend Account' : '✅ Activate Account'}
                </button>
              </div>

              {/* Past Trips */}
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest mb-3">Past Trips</h3>
                {loadingBookings ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Loading trips...</div>
                ) : customerBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm font-medium">No trips found for this customer.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {customerBookings.map(bk => (
                      <div key={bk._id} className="bg-[#F5F0EB] border border-gray-150 rounded-xl p-4 hover:bg-gray-100/80 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-gray-900">{bk.experience?.title || 'Adventure Experience'}</div>
                            <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                              <span>📅 {formatDate(bk.startDate)}</span>
                              <span>💰 ₹{bk.totalPrice?.toLocaleString('en-IN') || '—'}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              bk.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              bk.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              bk.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>{bk.status}</span>
                            {bk.disputed && (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠ Disputed</span>
                            )}
                            {bk.paymentStatus === 'refunded' && (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Refunded</span>
                            )}
                          </div>
                        </div>
                        {bk.disputeReason && (
                          <div className="mt-2.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-2">
                            <strong>Dispute: </strong>{bk.disputeReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}
