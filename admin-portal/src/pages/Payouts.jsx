import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Payouts() {
  const { user } = useAuth();
  
  // DB states
  const [dbSettlements, setDbSettlements] = useState([]);
  const [dbLogs, setDbLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sorting & Overrides state
  const [sortOption, setSortOption] = useState('Highest Amount');
  const [filterText, setFilterText] = useState('');
  const [overrideAmounts, setOverrideAmounts] = useState({});
  const [showOverrideInput, setShowOverrideInput] = useState({});
  const [releasingIds, setReleasingIds] = useState({});

  // Pagination for Payout Logs
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch Payouts data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [settlementsRes, logsRes] = await Promise.all([
        api.get('/admin/payouts/pending'),
        api.get('/admin/payouts/logs')
      ]);

      if (settlementsRes.data.success) {
        setDbSettlements(settlementsRes.data.settlements || []);
      }
      if (logsRes.data.success) {
        setDbLogs(logsRes.data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching admin payouts data:', err);
      setError('Failed to fetch payout records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute dynamic stats
  const pendingTotal = dbSettlements.reduce((sum, s) => sum + s.totalPrice, 0);
  const activeHostsCount = new Set(dbSettlements.map(s => s.experience?.host?._id || s.experience?.host)).size;

  // Release payout handler
  const handleReleasePayout = async (settlement) => {
    const settlementId = settlement._id;
    const finalAmount = overrideAmounts[settlementId] !== undefined 
      ? Number(overrideAmounts[settlementId]) 
      : settlement.totalPrice;

    setReleasingIds(prev => ({ ...prev, [settlementId]: 'releasing' }));

    // Real DB payout release
    try {
      const res = await api.post('/admin/payouts/release', { 
        bookingId: settlement._id, 
        overrideAmount: finalAmount 
      });

      if (res.data.success) {
        setReleasingIds(prev => ({ ...prev, [settlementId]: 'completed' }));
        setTimeout(async () => {
          await fetchData();
          setReleasingIds(prev => {
            const copy = { ...prev };
            delete copy[settlementId];
            return copy;
          });
        }, 800);
      }
    } catch (err) {
      console.error('Error releasing payout:', err);
      alert(err.response?.data?.message || 'Failed to release payout. Verify that the Host Payout Status is Verified in their KYC.');
      setReleasingIds(prev => {
        const copy = { ...prev };
        delete copy[settlementId];
        return copy;
      });
    }
  };

  // Sort queue helper
  const sortSettlements = (list) => {
    if (sortOption === 'Highest Amount') {
      return [...list].sort((a, b) => b.totalPrice - a.totalPrice);
    }
    return list;
  };

  // Convert real DB settlements to UI format
  const mappedDbSettlements = dbSettlements.map(s => ({
    _id: s._id,
    experience: {
      title: s.experience?.title || 'Outdoor Adventure',
      imageUrl: s.experience?.images?.[0] || null,
      hostName: s.experience?.host?.name || s.experience?.hostName || 'Operator'
    },
    host: {
      name: s.experience?.host?.name || s.experience?.hostName || 'Operator',
      email: s.experience?.host?.email || 'operator@wildvora.com'
    },
    bookingNumber: `#BK-${s._id.slice(-6).toUpperCase()}`,
    totalPrice: s.totalPrice,
    statusText: s.experience?.host?.payoutStatus === 'verified' ? 'Verified' : 'Pending Verification',
    statusStyle: s.experience?.host?.payoutStatus === 'verified' 
      ? 'bg-secondary-container text-on-secondary-fixed-variant' 
      : 'bg-error-container text-on-error-container'
  }));

  const sortedSettlementsQueue = sortSettlements(mappedDbSettlements).filter(s =>
    s.experience.title.toLowerCase().includes(filterText.toLowerCase()) ||
    s.host.name.toLowerCase().includes(filterText.toLowerCase()) ||
    s.bookingNumber.toLowerCase().includes(filterText.toLowerCase())
  );

  // Convert real DB logs to UI format
  const mappedDbLogs = dbLogs.map(l => ({
    _id: l._id,
    transactionId: l.transactionId || `#TR-${l._id.slice(-6).toUpperCase()}`,
    operator: { name: l.operator?.name || 'Operator' },
    method: l.booking?.paymentMethod === 'apple_pay' ? 'Apple Pay' : 
            l.booking?.paymentMethod === 'google_pay' ? 'Google Pay' : 'Stripe',
    releasedAt: new Date(l.releasedAt || l.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }),
    amount: l.amount,
    status: l.status === 'processed' ? 'Completed' : 'Processing'
  }));
  
  // Pagination details for logs
  const totalLogsPages = Math.ceil(mappedDbLogs.length / pageSize);
  const logsStartIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = mappedDbLogs.slice(logsStartIndex, logsStartIndex + pageSize);

  return (
    <div className="p-margin-desktop space-y-stack-lg max-w-container-max mx-auto w-full flex-grow relative pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Payouts Control</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Review and release settlements for host bookings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Relocated Search Bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]" data-icon="search">search</span>
            <input 
              className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-full text-body-md focus:ring-2 focus:ring-primary/20 w-64 focus:w-80 transition-all duration-200" 
              placeholder="Search settlements..." 
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-highest text-on-surface font-label-md text-label-md rounded-lg hover:shadow-md transition-all cursor-pointer"
          >
            ↻ Refresh Queue
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_-4px_rgba(96,77,63,0.12)] border-t-4 border-secondary">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Pending Settlements</p>
          <h3 className="font-display-lg text-secondary mt-1">₹{pendingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p className="text-xs text-on-surface-variant mt-2">Sum of pending completed bookings</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_-4px_rgba(96,77,63,0.12)] border-t-4 border-primary">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Hosts</p>
          <h3 className="font-display-lg text-primary mt-1">{activeHostsCount}</h3>
          <p className="text-xs text-on-surface-variant mt-2">Awaiting disbursement</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_-4px_rgba(96,77,63,0.12)] border-t-4 border-tertiary">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Avg. Hold Time</p>
          <h3 className="font-display-lg text-tertiary mt-1">2.4d</h3>
          <p className="text-xs text-on-surface-variant mt-2">Target: Under 3.0 days</p>
        </div>
        <div className="bg-primary-container p-5 rounded-xl shadow-[0_4px_20px_-4px_rgba(96,77,63,0.2)] flex flex-col justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-primary-container uppercase tracking-wider">Payout Compliance</p>
            <h3 className="font-headline-md text-headline-md text-on-primary mt-1">Completion Guard</h3>
          </div>
          <p className="text-xs text-on-primary/80 mt-2">Payouts release only after booking completion and resolving disputes.</p>
        </div>
      </div>

      {/* PENDING SETTLEMENTS QUEUE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined" data-icon="pending_actions">pending_actions</span>
            Pending Settlements
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-body-md text-on-surface-variant">Sort by:</span>
            <select 
              className="bg-transparent border-none text-label-md font-bold text-primary focus:ring-0 cursor-pointer"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option>Highest Amount</option>
              <option>Oldest First</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-outline-variant/30">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl mr-2">sync</span>
            <span className="text-sm font-semibold text-on-surface-variant">Syncing pending queue...</span>
          </div>
        ) : sortedSettlementsQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-outline-variant/30 text-on-surface-variant text-center">
            <span className="material-symbols-outlined text-4xl mb-2 text-emerald-600">done_all</span>
            <span className="text-sm font-bold">No Pending Settlements</span>
            <span className="text-xs text-gray-400 mt-1">All eligible completed host payouts have been cleared.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {sortedSettlementsQueue.map(item => {
              const status = releasingIds[item._id];
              const displayPrice = overrideAmounts[item._id] !== undefined 
                ? Number(overrideAmounts[item._id]) 
                : item.totalPrice;

              return (
                <div 
                  key={item._id} 
                  className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative"
                >
                  <div className="relative w-full md:w-32 h-32 flex-shrink-0">
                    {item.experience.imageUrl ? (
                      <img 
                        alt={item.experience.title} 
                        className="w-full h-full object-cover rounded-lg" 
                        src={item.experience.imageUrl} 
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-[#f0f5f1] flex items-center justify-center border border-[#e4e8e4]">
                        <svg className="w-8 h-8 text-[#052618]/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-label-md text-label-md text-primary flex items-center gap-1.5">
                          {item.experience.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-1">Host: {item.host.name} • {item.bookingNumber}</p>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${item.statusStyle || 'bg-secondary-container text-on-secondary-fixed-variant'}`}>
                        {item.statusText}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant/60">Settlement Amount</p>
                        <div className="flex items-center gap-2 mt-1 relative">
                          <span className="font-headline-md text-headline-md text-primary">
                            ₹{displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          
                          {/* Override Button Wrapper */}
                          <div className="relative">
                            <button 
                              onClick={() => setShowOverrideInput(prev => ({ ...prev, [item._id]: !prev[item._id] }))}
                              className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-[18px] cursor-pointer"
                              title="Override Settlement Amount"
                            >
                              edit_note
                            </button>
                            
                            {showOverrideInput[item._id] && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-surface-container-highest rounded-lg shadow-xl text-xs z-20 border border-outline-variant/50">
                                <label className="block mb-1 font-bold text-gray-900">Override Amount (₹):</label>
                                <div className="flex gap-1.5">
                                  <input 
                                    className="w-full bg-surface p-1 border border-outline rounded text-xs focus:ring-1 focus:ring-primary text-gray-900 font-semibold" 
                                    type="number" 
                                    step="0.01"
                                    value={overrideAmounts[item._id] !== undefined ? overrideAmounts[item._id] : item.totalPrice}
                                    onChange={(e) => setOverrideAmounts(prev => ({ ...prev, [item._id]: e.target.value }))}
                                  />
                                  <button 
                                    onClick={() => setShowOverrideInput(prev => ({ ...prev, [item._id]: false }))}
                                    className="px-2 py-1 bg-primary text-on-primary rounded text-[9px] font-bold cursor-pointer"
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        disabled={status === 'releasing' || status === 'completed'}
                        onClick={() => handleReleasePayout(item)}
                        className={`px-5 py-2 rounded-lg font-label-md text-label-md transition-all flex items-center gap-2 cursor-pointer ${
                          status === 'completed' 
                            ? 'bg-secondary text-on-secondary' 
                            : 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary'
                        }`}
                      >
                        {status === 'releasing' ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[18px]" data-icon="sync">sync</span> 
                            Processing...
                          </>
                        ) : status === 'completed' ? (
                          <>
                            Released
                            <span className="material-symbols-outlined text-[18px]" data-icon="done_all">done_all</span>
                          </>
                        ) : (
                          <>
                            Release Payout
                            <span className="material-symbols-outlined text-[18px]" data-icon="check_circle">check_circle</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PAYOUT LOG HISTORY TABLE */}
      <section className="space-y-4">
        <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" data-icon="history_edu">history_edu</span>
          Payout Log
        </h3>
        
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30">
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Transaction ID</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Host</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Method</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Date</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Amount</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400 text-sm">
                      No payout logs available.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-secondary-fixed/10 transition-colors">
                      <td className="px-6 py-4 font-label-md text-label-md">{log.transactionId}</td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                          {log.operator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="font-body-md text-body-md">
                          {log.operator.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
                          <span className="material-symbols-outlined text-[18px]" data-icon="account_balance">
                            {log.method === 'Stripe' ? 'credit_card' : 'account_balance'}
                          </span>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-body-md">{log.releasedAt}</td>
                      <td className="px-6 py-4 font-bold text-primary">₹{log.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          log.status === 'Completed' 
                            ? 'bg-primary-fixed text-on-primary-fixed' 
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'Completed' ? 'bg-primary' : 'bg-secondary'}`}></span>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalLogsPages > 1 && (
            <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/30">
              <p className="text-xs text-on-surface-variant font-label-md">
                Showing {logsStartIndex + 1} to {Math.min(logsStartIndex + pageSize, mappedDbLogs.length)} of {mappedDbLogs.length} entries
              </p>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 hover:bg-white disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]" data-icon="chevron_left">chevron_left</span>
                </button>
                {Array.from({ length: totalLogsPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded font-bold text-xs cursor-pointer ${currentPage === page ? 'bg-primary text-on-primary' : 'border border-outline-variant/50 hover:bg-white'}`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalLogsPages))}
                  disabled={currentPage === totalLogsPages}
                  className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 hover:bg-white disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]" data-icon="chevron_right">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      
      <footer className="mt-auto p-6 text-center border-t border-outline-variant/20 bg-surface-container-low/20">
        <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-[0.2em] font-bold">WildReserve Financial Compliance • Protected by End-to-End Encryption</p>
      </footer>
    </div>
  );
}
