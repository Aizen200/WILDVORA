import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const mockCustomers = [
  {
    _id: 'mock-1',
    name: 'Eleanor Litchfield',
    email: 'eleanor.l@example.com',
    createdAt: '2023-10-12T00:00:00.000Z',
    bookingsCount: 12,
    health: 'Excellent',
    isActive: true,
    isMock: true
  },
  {
    _id: 'mock-2',
    name: 'Julian Marsland',
    email: 'j.mars@reserve.com',
    createdAt: '2024-01-05T00:00:00.000Z',
    bookingsCount: 4,
    health: 'Good',
    isActive: true,
    isMock: true
  },
  {
    _id: 'mock-3',
    name: 'Sarah Dunning',
    email: 'sarah.d@web.net',
    createdAt: '2023-11-22T00:00:00.000Z',
    bookingsCount: 21,
    health: 'At Risk',
    isActive: true,
    isMock: true,
    isFlagged: true
  },
  {
    _id: 'mock-4',
    name: 'Marcus Kane',
    email: 'm.kane@outdoors.com',
    createdAt: '2024-03-02T00:00:00.000Z',
    bookingsCount: 2,
    health: 'New',
    isActive: true,
    isMock: true
  }
];

export default function Customers() {
  const { user, logout } = useAuth();
  const [dbCustomers, setDbCustomers] = useState([]);
  const [dbBookings, setDbBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Pagination states
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Booking history modal states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersRes, bookingsRes] = await Promise.all([
          api.get('/admin/customers'),
          api.get('/admin/bookings')
        ]);
        
        if (customersRes.data.success) {
          setDbCustomers(customersRes.data.customers || []);
        }
        if (bookingsRes.data.success) {
          setDbBookings(bookingsRes.data.bookings || []);
        }
      } catch (err) {
        console.error('Error fetching admin customers data:', err);
        setError('Failed to fetch directory data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Compute stats dynamically
  const totalCustomersCount = 12842 + dbCustomers.length;
  const activeBookingsCount = 1205 + dbBookings.filter(b => b.status === 'confirmed').length;
  const flaggedCount = 24 + dbCustomers.filter(c => !c.isActive).length;
  
  // Calculate specific customer bookings count and health status
  const getCustomerStats = (customer) => {
    const customerBookingsList = dbBookings.filter(b => 
      b.user && (b.user._id === customer._id || b.user === customer._id)
    );
    const count = customerBookingsList.length;
    
    let health = 'New';
    let isFlagged = !customer.isActive;
    
    if (isFlagged) {
      health = 'Suspended';
    } else {
      const hasDisputes = customerBookingsList.some(b => b.disputed);
      if (hasDisputes) {
        health = 'At Risk';
      } else if (count > 5) {
        health = 'Excellent';
      } else if (count > 0) {
        health = 'Good';
      }
    }

    return { bookingsCount: count, health, isFlagged };
  };

  // Format Join Date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Get Initials for Avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Get Avatar Color
  const getAvatarColorClass = (name, index) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), index);
    const classes = [
      'bg-primary-fixed text-on-primary-fixed font-bold',
      'bg-secondary-container text-on-secondary-container font-bold',
      'bg-error-container text-on-error-container font-bold',
      'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
    ];
    return classes[hash % classes.length];
  };

  // Flag/Unflag or Activate/Suspend User
  const handleToggleStatus = async (customer) => {
    if (customer.isMock) {
      alert("This is a template customer. Real database modifications can only be performed on real users.");
      return;
    }

    const actionText = customer.isActive ? 'suspend' : 'activate';
    const confirmed = window.confirm(`Are you sure you want to ${actionText} user "${customer.name}"?`);
    if (!confirmed) return;

    try {
      const res = await api.patch(`/admin/users/${customer._id}/toggle-status`);
      if (res.data.success) {
        setDbCustomers(prev => prev.map(c => 
          c._id === customer._id ? { ...c, isActive: !c.isActive } : c
        ));
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert(err.response?.data?.message || 'Failed to update customer status.');
    }
  };

  // View Booking History Click
  const handleViewBookings = async (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);

    if (customer.isMock) {
      // Simulate mock bookings for the template users
      setCustomerBookings([
        {
          _id: 'm-bk-1',
          experience: { title: 'Rishikesh River Rafting Adventure' },
          startDate: '2023-11-15',
          totalPrice: 150,
          status: 'completed',
          paymentStatus: 'paid'
        },
        {
          _id: 'm-bk-2',
          experience: { title: 'Manali Solang Valley Paragliding' },
          startDate: '2024-02-10',
          totalPrice: 200,
          status: 'confirmed',
          paymentStatus: 'paid'
        }
      ]);
      return;
    }

    // Load real customer bookings
    try {
      setLoadingBookings(true);
      const res = await api.get(`/admin/customers/${customer._id}/bookings`);
      if (res.data.success) {
        setCustomerBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setCustomerBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Process data for the list
  const processedDbCustomers = dbCustomers.map(c => {
    const stats = getCustomerStats(c);
    return {
      ...c,
      bookingsCount: stats.bookingsCount,
      health: stats.health,
      isFlagged: stats.isFlagged,
      isMock: false
    };
  });

  const allCustomers = [...processedDbCustomers, ...mockCustomers];

  // Filter based on search query
  const filteredCustomers = allCustomers.filter(c => 
    c.name.toLowerCase().includes(filterText.toLowerCase()) ||
    c.email.toLowerCase().includes(filterText.toLowerCase())
  );

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex">
      
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-primary dark:bg-primary-container shadow-sm flex flex-col p-6 space-y-2 z-50">
        <div className="mb-10">
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-primary tracking-tight">WildReserve</h1>
          <p className="font-label-md text-label-md text-on-primary/60">Admin Console</p>
        </div>
        <nav className="flex-grow space-y-2">
          <Link className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" to="/">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Overview</span>
          </Link>
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined">fact_check</span>
            <span className="font-label-md text-label-md">Listings</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined">event_available</span>
            <span className="font-label-md text-label-md">Bookings</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined">badge</span>
            <span className="font-label-md text-label-md">Hosts</span>
          </a>
          {/* Active Tab: Customers */}
          <Link className="flex items-center gap-3 px-4 py-3 text-on-primary-fixed bg-primary-fixed rounded-lg transition-colors scale-95 duration-150 ease-in-out" to="/customers">
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-md text-label-md">Customers</span>
          </Link>
          <Link className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" to="/payouts">
            <span className="material-symbols-outlined">payments</span>
            <span className="font-label-md text-label-md">Payouts</span>
          </Link>
        </nav>
        <div className="pt-6 border-t border-on-primary/10 space-y-2">
          <button className="w-full py-3 px-4 bg-on-primary text-primary font-bold rounded-lg mb-4 hover:bg-primary-fixed transition-all cursor-pointer">
            New Support Ticket
          </button>
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span class="material-symbols-outlined">settings</span>
            <span className="font-label-md text-label-md">Settings</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-md text-label-md">Help Center</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-[280px] flex-1 min-h-screen flex flex-col">
        
        {/* TopNavBar */}
        <header className="sticky top-0 right-0 z-40 flex items-center justify-between h-16 px-gutter border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <span className="font-headline-md text-headline-md font-black text-primary">WildReserve Admin</span>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                className="pl-10 pr-4 py-1.5 bg-surface-container-low border-none rounded-full text-body-md focus:ring-2 focus:ring-primary/20 w-64 transition-all focus:w-80" 
                placeholder="Search customers..." 
                type="text"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 mr-6">
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">Dashboard</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">Logs</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">Reports</a>
            </nav>
            <button className="hover:bg-surface-container-high rounded-full p-2 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <button className="hover:bg-surface-container-high rounded-full p-2 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant">dark_mode</span>
            </button>
            
            {/* Authenticated Admin Identity */}
            <div className="flex items-center gap-3 pl-2 border-l border-outline-variant/50">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-gray-900 leading-tight">{user?.name}</div>
                <div className="text-[10px] text-gray-500">{user?.email}</div>
              </div>
              <button 
                onClick={logout} 
                className="hover:bg-red-50 text-red-600 rounded-full p-1.5 transition-all cursor-pointer"
                title="Logout"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="p-margin-desktop max-w-container-max w-full mx-auto flex-1">
          
          {/* Header Section */}
          <div className="mb-stack-lg flex justify-between items-end">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary">Customer Directory</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Manage and monitor community engagement and safety.</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                Filters
              </button>
              <button 
                onClick={() => alert('CSV Export Started...')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-on-secondary hover:opacity-90 transition-all font-label-md text-label-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">file_download</span>
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Overview - Bento Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-stack-lg">
            <div className="p-6 rounded-xl glass-card border-t-4 border-primary">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Customers</p>
              <h3 className="font-headline-lg text-headline-lg mt-2">{totalCustomersCount.toLocaleString()}</h3>
              <p className="text-primary font-label-md text-label-sm mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span> +14% this month
              </p>
            </div>
            <div className="p-6 rounded-xl glass-card border-t-4 border-secondary">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Bookings</p>
              <h3 class="font-headline-lg text-headline-lg mt-2">{activeBookingsCount.toLocaleString()}</h3>
              <p className="text-secondary font-label-md text-label-sm mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">event</span> Current peak season
              </p>
            </div>
            <div className="p-6 rounded-xl glass-card border-t-4 border-secondary-container">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Avg. Account Health</p>
              <h3 className="font-headline-lg text-headline-lg mt-2">98.2%</h3>
              <p className="text-on-secondary-container font-label-md text-label-sm mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span> Excellent standing
              </p>
            </div>
            <div className="p-6 rounded-xl glass-card border-t-4 border-error">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Flagged Accounts</p>
              <h3 className="font-headline-lg text-headline-lg mt-2">{flaggedCount}</h3>
              <p className="text-error font-label-md text-label-sm mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">report</span> Requires review
              </p>
            </div>
          </div>

          {/* Customer Table Section */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-4xl mb-2">sync</span>
                <span className="text-sm font-medium">Loading customer records...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-error">
                <span className="material-symbols-outlined text-4xl mb-2 flex items-center justify-center">report</span>
                <span className="text-sm font-bold">{error}</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30">
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Customer Name</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Join Date</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Total Bookings</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Account Health</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginatedCustomers.map((customer, idx) => {
                    const isAtRisk = customer.health === 'At Risk' || customer.health === 'Suspended';
                    return (
                      <tr 
                        key={customer._id}
                        className={`hover:bg-surface-container-low/50 transition-all group duration-200 hover:translate-x-1 ${isAtRisk ? 'bg-error-container/5' : ''}`}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getAvatarColorClass(customer.name, idx)}`}>
                              {getInitials(customer.name)}
                            </div>
                            <div>
                              <p className="font-label-md text-label-md text-on-surface flex items-center gap-1.5">
                                {customer.name}
                                {!customer.isMock && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full uppercase font-bold tracking-wider">
                                    DB User
                                  </span>
                                )}
                              </p>
                              <p className="text-label-sm font-label-sm text-on-surface-variant">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-body-md text-body-md text-on-surface-variant">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm">
                            {customer.bookingsCount} Bookings
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isAtRisk ? 'bg-error' : 'bg-primary'}`}></div>
                            <span className={`font-label-md text-label-sm ${isAtRisk ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                              {customer.health}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end items-center gap-4">
                            <button 
                              onClick={() => handleViewBookings(customer)}
                              className="text-secondary hover:underline font-label-md text-label-md cursor-pointer"
                            >
                              View Booking History
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(customer)}
                              className={`transition-colors p-2 rounded-full hover:bg-error-container/20 group-hover:opacity-100 opacity-0 cursor-pointer ${customer.isFlagged ? 'text-error bg-error-container/30 opacity-100' : 'text-error/70 hover:text-error'}`}
                              title={customer.isActive ? "Flag customer" : "Unflag / Activate customer"}
                            >
                              <span 
                                className="material-symbols-outlined"
                                style={{ fontVariationSettings: customer.isFlagged ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                flag
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {!loading && !error && (
              <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant/20 flex items-center justify-between">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredCustomers.length)} of {filteredCustomers.length} customers
                </p>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-label-md text-label-md cursor-pointer ${currentPage === page ? 'bg-primary text-on-primary' : 'border border-outline-variant hover:bg-surface-container-high'}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contextual Help / Action Cards */}
          <div className="mt-stack-lg grid grid-cols-1 md:grid-cols-2 gap-gutter mb-8">
            <div className="relative overflow-hidden rounded-xl p-8 bg-primary-container text-on-primary">
              <div className="relative z-10">
                <h4 className="font-headline-md text-headline-md mb-2">Automated Policy Enforcement</h4>
                <p className="font-body-md text-body-md opacity-80 mb-6 max-w-md">Our AI systems monitor for account abuse and suspicious activity. You can manually override any flag or review detailed behavior logs here.</p>
                <button 
                  onClick={() => alert('Redirecting to Safety Rules Configuration...')}
                  className="px-6 py-2 bg-on-primary text-primary font-bold rounded-lg hover:bg-primary-fixed transition-colors cursor-pointer"
                >
                  Configure Safety Rules
                </button>
              </div>
              <div className="absolute right-[-10%] top-[-10%] opacity-10 pointer-events-none scale-150">
                <span className="material-symbols-outlined text-[300px]" style={{ fontVariationSettings: "'wght' 700" }}>security</span>
              </div>
            </div>
            <div className="rounded-xl border-2 border-dashed border-outline-variant p-8 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-outline-variant text-[48px] mb-4">group_add</span>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Invite New Enterprise Customer</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6 max-w-sm">Bring on travel agencies and corporate partners with custom reservation limits and discounted pricing tiers.</p>
              <button 
                onClick={() => {
                  const email = prompt("Enter enterprise customer's email address:");
                  if (email) alert(`Invitation sent to ${email}`);
                }}
                className="px-6 py-2 bg-secondary text-on-secondary font-bold rounded-lg hover:opacity-90 transition-colors cursor-pointer"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Booking History Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-xl border border-outline-variant/30 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/30">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Booking History</h3>
                <p className="text-sm text-gray-500 mt-1">Showing reservations for {selectedCustomer.name}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6">
              {loadingBookings ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary">sync</span>
                  <span className="text-sm font-medium text-gray-500">Retrieving booking records...</span>
                </div>
              ) : customerBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                  <p className="text-sm">No reservations found for this customer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerBookings.map(bk => (
                    <div 
                      key={bk._id} 
                      className="border border-outline-variant/20 rounded-xl p-4 bg-surface-container-lowest hover:bg-surface-container-low/20 transition-all duration-150"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{bk.experience?.title || 'Adventure Experience'}</h4>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">calendar_today</span>
                              {bk.startDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">payments</span>
                              ${bk.totalPrice}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            bk.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            bk.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            bk.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {bk.status}
                          </span>
                          {bk.paymentStatus === 'refunded' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                              Refunded
                            </span>
                          )}
                          {bk.disputed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>report</span>
                              Disputed
                            </span>
                          )}
                        </div>
                      </div>
                      {bk.disputeReason && (
                        <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs text-red-700">
                          <strong className="block mb-0.5 font-bold">Dispute Reason:</strong>
                          {bk.disputeReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-outline-variant/30 flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
