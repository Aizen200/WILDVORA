import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const mockSettlements = [
  {
    _id: 'mock-set-1',
    isMock: true,
    experience: {
      title: 'Mountain Peak Lodge',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5n4LWOu_oTlelEk-IX5evN5xfDEyGNjtbggDucKnN8a7THGr3c0RzRxZVkp44G4H_EUO932KSQjUluwAu0gdb3J_v2TiGdnO--8wUX8eFhDS3Nqmgn0KNDBO3tBWnQS0PXQSD9w__-B_j5cIflIJ0M6a1Glz63RHBaVTrSYSM5cEeSE4Ea1HYqhCFPn17IVFmW3mFLMduzdsn7iLbvgFF0UfT9XHfCHlmHmye4-567bceNfWbbxrgwSOA7XsumjaK_iNHONXIovwe',
      hostName: 'Julian Thorne'
    },
    host: {
      name: 'Julian Thorne',
      email: 'j.thorne@example.com'
    },
    bookingNumber: '#BK-99281',
    totalPrice: 1240.00,
    statusText: 'Verified',
    statusStyle: 'bg-secondary-container text-on-secondary-fixed-variant'
  },
  {
    _id: 'mock-set-2',
    isMock: true,
    experience: {
      title: 'Silver Stream Sanctuary',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDU1xIPVQXtjW_p-aEDomnbUhMrhUwmLBVgka8aHne7Bj7MpJVjxs1PtA6EIfufxtfmhKG5Loe0bbiWOeAMhDiR598YvyuQVMkorosZZbPsBcloO90VZaIjb1nnReUMDwHyCLMdj6q97QbymMnJu7UKBFugbE-cT8Oip62t6knSQi4VgPFJ6QGdH2vl4EI6h1zZivlnK4luC6bsQtw6pi1wZM8HMAcp3yzDYrZOCrrCwarNjVvUtdpCrCq0jU0bBE3Tud9U6IgnHiTN',
      hostName: 'Elena Rodriguez'
    },
    host: {
      name: 'Elena Rodriguez',
      email: 'e.rod@example.com'
    },
    bookingNumber: '#BK-99285',
    totalPrice: 850.50,
    statusText: 'New Host',
    statusStyle: 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
  }
];

const mockLogs = [
  {
    _id: 'mock-log-1',
    transactionId: '#TR-550921',
    operator: { name: 'Marcus Kane' },
    method: 'Bank Trans.',
    releasedAt: 'Oct 24, 2023',
    amount: 2450.00,
    status: 'Completed'
  },
  {
    _id: 'mock-log-2',
    transactionId: '#TR-550918',
    operator: { name: 'Sarah Williams' },
    method: 'Stripe',
    releasedAt: 'Oct 23, 2023',
    amount: 980.25,
    status: 'Processing'
  },
  {
    _id: 'mock-log-3',
    transactionId: '#TR-550882',
    operator: { name: 'David Brooks' },
    method: 'Bank Trans.',
    releasedAt: 'Oct 22, 2023',
    amount: 3120.00,
    status: 'Completed'
  }
];

export default function Payouts() {
  const { user, logout } = useAuth();
  
  // DB states
  const [dbSettlements, setDbSettlements] = useState([]);
  const [dbLogs, setDbLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state for local mock settlements (to support dismissal upon release)
  const [activeMockSettlements, setActiveMockSettlements] = useState(mockSettlements);
  const [activeMockLogs, setActiveMockLogs] = useState(mockLogs);

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

  // Compute dynamic stats (combining DB + Mock magnitude)
  const dbPendingTotal = dbSettlements.reduce((sum, s) => sum + s.totalPrice, 0);
  const mockPendingTotal = activeMockSettlements.reduce((sum, s) => sum + s.totalPrice, 0);
  const pendingTotal = 42850.00 - (1240.00 + 850.50) + dbPendingTotal + mockPendingTotal;

  const dbActiveHostsCount = new Set(dbSettlements.map(s => s.experience?.host?._id || s.experience?.host)).size;
  const mockActiveHostsCount = new Set(activeMockSettlements.map(s => s.host?.name)).size;
  const activeHostsCount = 128 - 2 + dbActiveHostsCount + mockActiveHostsCount;

  // Release payout handler
  const handleReleasePayout = async (settlement) => {
    const settlementId = settlement._id;
    const finalAmount = overrideAmounts[settlementId] !== undefined 
      ? Number(overrideAmounts[settlementId]) 
      : settlement.totalPrice;

    setReleasingIds(prev => ({ ...prev, [settlementId]: 'releasing' }));

    if (settlement.isMock) {
      // Simulate success for mock items
      setTimeout(() => {
        setReleasingIds(prev => ({ ...prev, [settlementId]: 'completed' }));
        setTimeout(() => {
          // Remove from mock pending settlements list
          setActiveMockSettlements(prev => prev.filter(s => s._id !== settlementId));
          // Prepend to mock logs
          const newMockLog = {
            _id: `m-log-rel-${Date.now()}`,
            transactionId: `#TR-${Math.floor(100000 + Math.random() * 900000)}`,
            operator: { name: settlement.host?.name },
            method: 'Stripe',
            releasedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            amount: finalAmount,
            status: 'Completed'
          };
          setActiveMockLogs(prev => [newMockLog, ...prev]);
          setReleasingIds(prev => {
            const copy = { ...prev };
            delete copy[settlementId];
            return copy;
          });
        }, 800);
      }, 1200);
      return;
    }

    // Real DB payout release
    try {
      const res = await api.post('/admin/payouts/release', { 
        bookingId: settlement._id, 
        overrideAmount: finalAmount 
      });

      if (res.data.success) {
        setReleasingIds(prev => ({ ...prev, [settlementId]: 'completed' }));
        setTimeout(async () => {
          // Re-fetch database stats & updates
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
    // Simplistic mapping for Oldest First and Host Rating
    return list;
  };

  // Convert real DB settlements to matches format
  const mappedDbSettlements = dbSettlements.map(s => ({
    _id: s._id,
    isMock: false,
    experience: {
      title: s.experience?.title || 'Outdoor Adventure',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
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

  // Combine real DB pending + active mocks
  const combinedSettlements = [...mappedDbSettlements, ...activeMockSettlements];
  const sortedSettlementsQueue = sortSettlements(combinedSettlements).filter(s =>
    s.experience.title.toLowerCase().includes(filterText.toLowerCase()) ||
    s.host.name.toLowerCase().includes(filterText.toLowerCase()) ||
    s.bookingNumber.toLowerCase().includes(filterText.toLowerCase())
  );

  // Convert real DB logs to matches format
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
    status: l.status === 'processed' ? 'Completed' : 'Processing',
    isMock: false
  }));

  // Combine DB Logs + Mock Logs
  const combinedLogs = [...mappedDbLogs, ...activeMockLogs];
  
  // Pagination details for logs
  const totalLogsPages = Math.ceil(combinedLogs.length / pageSize);
  const logsStartIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = combinedLogs.slice(logsStartIndex, logsStartIndex + pageSize);

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex font-sans">
      
      {/* SIDE NAV BAR */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-primary dark:bg-primary-container shadow-sm flex flex-col p-6 space-y-2 z-50">
        <div className="mb-8">
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-primary tracking-tight">WildReserve</h1>
          <p className="font-label-md text-label-md text-on-primary/60">Admin Console</p>
        </div>
        <nav className="flex-grow space-y-1">
          <Link className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors group" to="/">
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span className="font-label-md text-label-md">Overview</span>
          </Link>
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined" data-icon="fact_check">fact_check</span>
            <span className="font-label-md text-label-md">Listings</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined" data-icon="event_available">event_available</span>
            <span className="font-label-md text-label-md">Bookings</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined" data-icon="badge">badge</span>
            <span className="font-label-md text-label-md">Hosts</span>
          </a>
          <Link className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" to="/customers">
            <span className="material-symbols-outlined" data-icon="group">group</span>
            <span className="font-label-md text-label-md">Customers</span>
          </Link>
          {/* Active State: Payouts */}
          <Link className="flex items-center gap-3 px-4 py-3 text-on-primary-fixed bg-primary-fixed rounded-lg transition-colors shadow-md scale-95 duration-150 ease-in-out" to="/payouts">
            <span className="material-symbols-outlined" data-icon="payments" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            <span className="font-label-md text-label-md">Payouts</span>
          </Link>
        </nav>
        <div className="pt-6 border-t border-on-primary/10 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span className="font-label-md text-label-md">Settings</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined" data-icon="help">help</span>
            <span className="font-label-md text-label-md">Help Center</span>
          </a>
          <button className="w-full mt-4 bg-on-primary text-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary-fixed transition-all active:scale-95 cursor-pointer">
            New Support Ticket
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <main className="ml-[280px] flex-1 min-h-screen flex flex-col">
        
        {/* TOP NAV BAR */}
        <header className="sticky top-0 right-0 z-40 flex items-center justify-between h-16 px-gutter border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <span className="font-headline-md text-headline-md font-black text-primary">WildReserve Admin</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]" data-icon="search">search</span>
              <input 
                className="pl-10 pr-4 py-1.5 bg-surface-container-low border-none rounded-full text-body-md focus:ring-2 focus:ring-primary/20 w-64 focus:w-80 transition-all duration-200" 
                placeholder="Search settlements..." 
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 mr-6">
              <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Dashboard</a>
              <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Logs</a>
              <a className="font-label-md text-label-md text-primary font-bold border-b-2 border-primary pb-1" href="#">Reports</a>
            </nav>
            <button className="hover:bg-surface-container-high rounded-full p-2 transition-all cursor-pointer">
              <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
            </button>
            <button className="hover:bg-surface-container-high rounded-full p-2 transition-all cursor-pointer">
              <span className="material-symbols-outlined" data-icon="dark_mode">dark_mode</span>
            </button>
            <div className="h-8 w-px bg-outline-variant/30 mx-2"></div>
            
            {/* Identity block & logout */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="font-label-md text-label-md leading-none">{user?.name || 'Financial Admin'}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mt-1">Financial Controller</p>
              </div>
              <img 
                alt="Administrator" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-fixed" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxERVG99OmoZSlyfATXd_UcBnsfiP3choMiH7xqOqYH2iK0M8PhYg_zAXS39m8ndFrPWRmr0m2eTPEVFpfDPZLjjGAUeazEznz2NYDyasrS7MkHIENRa3yXvQjPz0PJd-F3mmJlM4OXum2vU8WZv1yfKm758-BzN6TUAgR553cf5Kl57yoEejWdoLAaSgrO6Xgt7eoS80HaMD6R53_19uBShiYTdIlmPCAsCFRaMJM8nuD7I88zNDDjI6Ue5uscoz-9yoV0FO7Qbw2"
              />
              <button 
                onClick={logout} 
                className="text-red-600 hover:bg-red-50 rounded-full p-1.5 transition-all cursor-pointer ml-1"
                title="Logout"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="p-margin-desktop space-y-stack-lg max-w-container-max mx-auto w-full flex-1">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary">Payouts Control</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Review and release settlements for host bookings.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => alert('Exporting payout report...')}
                className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-highest text-on-surface font-label-md text-label-md rounded-lg hover:shadow-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined" data-icon="download">download</span>
                Export Report
              </button>
              <button 
                onClick={() => alert('Initiating Instant Batch Settlement... (real backend settlements released today)')}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:shadow-lg transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined" data-icon="bolt">bolt</span>
                Instant Settlement
              </button>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_-4px_rgba(96,77,63,0.12)] border-t-4 border-secondary">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Pending Total</p>
              <h3 className="font-display-lg text-secondary mt-1">${pendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary" data-icon="trending_up">trending_up</span>
                12% increase from last week
              </p>
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
                <p className="font-label-md text-label-md text-on-primary-container uppercase tracking-wider">Next Batch</p>
                <h3 className="font-headline-md text-headline-md text-on-primary mt-1">Today, 4:00 PM</h3>
              </div>
              <button 
                onClick={() => alert('Batch schedule details: Transfers execute daily at 4:00 PM.')}
                className="text-on-primary font-label-md text-label-md flex items-center gap-2 hover:underline mt-4 cursor-pointer"
              >
                View Schedule <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
              </button>
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
                  <option>Host Rating</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-outline-variant/30">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl mr-2">sync</span>
                <span className="text-sm font-semibold text-on-surface-variant">Syncing pending queue...</span>
              </div>
            ) : sortedSettlementsQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-outline-variant/30 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2">done_all</span>
                <span className="text-sm font-bold">All settlements cleared! No pending disbursements.</span>
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
                        <img 
                          alt={item.experience.title} 
                          className="w-full h-full object-cover rounded-lg" 
                          src={item.experience.imageUrl} 
                        />
                      </div>
                      
                      <div className="flex-grow flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-label-md text-label-md text-primary flex items-center gap-1.5">
                              {item.experience.title}
                              {!item.isMock && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                                  DB Live
                                </span>
                              )}
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
                                ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                    <label className="block mb-1 font-bold text-gray-900">Override Amount ($):</label>
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
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary" data-icon="history_edu">history_edu</span>
                Payout Log
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => alert('Filter log options coming soon...')}
                  className="p-2 border border-outline-variant/50 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined" data-icon="filter_list">filter_list</span>
                </button>
              </div>
            </div>
            
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
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {paginatedLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-secondary-fixed/10 transition-colors">
                        <td className="px-6 py-4 font-label-md text-label-md">{log.transactionId}</td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                            {log.operator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <span className="font-body-md text-body-md flex items-center gap-1.5">
                            {log.operator.name}
                            {!log.isMock && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                                DB Live
                              </span>
                            )}
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
                        <td className="px-6 py-4 font-bold text-primary">${log.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            log.status === 'Completed' 
                              ? 'bg-primary-fixed text-on-primary-fixed' 
                              : 'bg-secondary-container text-on-secondary-container'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'Completed' ? 'bg-primary animate-pulse' : 'bg-secondary'}`}></span>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => alert(`Details for Transaction ${log.transactionId}: Method ${log.method}, settled for ${log.operator.name}`)}
                            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer" 
                            data-icon="more_vert"
                          >
                            more_vert
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/30">
                <p className="text-xs text-on-surface-variant font-label-md">
                  Showing {logsStartIndex + 1} to {Math.min(logsStartIndex + pageSize, combinedLogs.length)} of {combinedLogs.length} entries
                </p>
                {totalLogsPages > 1 && (
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
                )}
              </div>
            </div>
          </section>
        </div>

        {/* FOOTER INFO */}
        <footer className="mt-auto p-6 text-center border-t border-outline-variant/20 bg-surface-container-low/20">
          <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-[0.2em] font-bold">WildReserve Financial Compliance • Protected by End-to-End Encryption</p>
        </footer>
      </main>

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => {
          const bank = prompt("Enter bank details / batch operator name:");
          if (bank) alert(`New batch transfer initialized for ${bank}`);
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 group cursor-pointer"
      >
        <span className="material-symbols-outlined text-[28px]" data-icon="add">add</span>
        <div className="absolute right-full mr-4 px-3 py-1.5 bg-inverse-surface text-inverse-on-surface text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          New Batch Transfer
        </div>
      </button>
    </div>
  );
}
