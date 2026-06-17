import { useState, useEffect } from 'react';
import api from '../api/axios';

const getKycBadge = (status) => {
  const normalized = status?.toLowerCase();
  if (normalized === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#E6F4EA] text-[#137333] text-[12px] font-semibold px-3 py-1 rounded-full border border-[#D4EDDA]">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
        </svg>
        Verified
      </span>
    );
  } else if (normalized === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#E8F0FE] text-[#1A73E8] text-[12px] font-semibold px-3 py-1 rounded-full border border-[#D2E3FC]">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
        </svg>
        Pending
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#FCE8E6] text-[#C5221F] text-[12px] font-semibold px-3 py-1 rounded-full border border-[#FAD2CF]">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Suspended
      </span>
    );
  }
};

const getPayoutStyle = (status) => {
  const norm = status?.toLowerCase();
  if (norm === 'active' || norm === 'verified') {
    return (
      <div>
        <div className="text-sm font-bold text-gray-900">Active</div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">STRIPE CONNECTED</div>
      </div>
    );
  } else if (norm === 'reviewing' || norm === 'pending') {
    return (
      <div>
        <div className="text-sm font-bold text-gray-900">Reviewing</div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">DOCUMENTS UPLOADED</div>
      </div>
    );
  } else {
    return (
      <div>
        <div className="text-sm font-bold text-[#C5221F]">Frozen</div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">POLICY VIOLATION</div>
      </div>
    );
  }
};

export default function Hosts() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isGrowthMapOpen, setIsGrowthMapOpen] = useState(false);
  const [regions, setRegions] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (isGrowthMapOpen) {
      const fetchGrowthMap = async () => {
        setMapLoading(true);
        try {
          const res = await api.get('/admin/analytics/growth-map');
          if (res.data.success) {
            setRegions(res.data.regions);
          }
        } catch (err) {
          console.error('Failed to load growth map data:', err);
        } finally {
          setMapLoading(false);
        }
      };
      fetchGrowthMap();
    }
  }, [isGrowthMapOpen]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatusMessage(null);
    try {
      const res = await api.post('/admin/hosts/email', { subject, message });
      if (res.data.success) {
        setStatusMessage({ type: 'success', text: res.data.message || 'Email broadcast sent successfully!' });
        setSubject('');
        setMessage('');
        setTimeout(() => {
          setIsEmailModalOpen(false);
          setStatusMessage(null);
        }, 2000);
      } else {
        setStatusMessage({ type: 'error', text: res.data.message || 'Failed to send broadcast.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'An error occurred while sending.' });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const res = await api.get('/admin/hosts');
        if (res.data.success) {
          const dbHosts = res.data.hosts.map(h => ({
            _id: h._id,
            name: h.name,
            email: h.email,
            businessName: h.name === 'Amit Operator' ? 'Pine Valley Retreat' : 'Lakeside Camping',
            location: 'India',
            kyc: h.kyc,
            payoutStatus: h.payoutStatus === 'verified' ? 'active' : 'reviewing',
            listings: h.name === 'Amit Operator' ? 15 : 4,
            revenue: h.name === 'Amit Operator' ? '₹4,36,500' : '₹99,900',
            isActive: h.isActive,
            isDb: true
          }));

          const mockHosts = [
            {
              _id: 'mock-1',
              name: 'Julian Thorne',
              businessName: 'Highlands Lodge',
              location: 'Scotland',
              kyc: 'approved',
              payoutStatus: 'active',
              listings: 12,
              revenue: '₹3,77,000',
              isActive: true,
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80'
            },
            {
              _id: 'mock-2',
              name: 'Elena Rodriguez',
              businessName: 'Patagonia Eco-Resort',
              location: 'Patagonia',
              kyc: 'pending',
              payoutStatus: 'reviewing',
              listings: 3,
              revenue: '₹70,350',
              isActive: true,
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80'
            },
            {
              _id: 'mock-3',
              name: 'Marcus Vane',
              businessName: 'Boreal Tents',
              location: 'Finland',
              kyc: 'rejected',
              payoutStatus: 'frozen',
              listings: 0,
              revenue: '₹0',
              isActive: false,
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80'
            },
            {
              _id: 'mock-4',
              name: 'Sarah Jenkins',
              businessName: 'Aspen Peaks Resort',
              location: 'USA',
              kyc: 'approved',
              payoutStatus: 'active',
              listings: 22,
              revenue: '₹9,33,000',
              isActive: true,
              avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80'
            }
          ];

          setHosts([...dbHosts, ...mockHosts]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHosts();
  }, []);

  const handleToggleStatus = async (hostId, isDb, currentStatus) => {
    setHosts(prev => prev.map(h => h._id === hostId ? { ...h, isActive: !h.isActive } : h));
    if (isDb) {
      try {
        await api.patch(`/admin/users/${hostId}/toggle-status`);
      } catch (err) {
        setHosts(prev => prev.map(h => h._id === hostId ? { ...h, isActive: currentStatus } : h));
        console.error(err);
      }
    }
  };

  return (
    <div className="px-8 py-8 flex flex-col gap-8 select-none font-sans bg-[#F5F0EB]">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Host Directory</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage and monitor 1,240 active partners across the globe.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition shadow-sm cursor-pointer">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <button className="bg-[#052618] hover:bg-[#073622] text-white text-sm font-semibold rounded-lg px-4 py-2.5 flex items-center gap-2 transition shadow-sm cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Onboard New Host
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Hosts</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-gray-900">1,240</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              +12% this month
            </span>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">KYC Pending</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-gray-900">14</span>
            <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              Action required
            </span>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Listings</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-gray-900">842</span>
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V8.5a.5.5 0 01.5-.5h.5m-6-3h.01M12 21a9 9 0 110-18 9 9 0 010 18z" /></svg>
              Across 12 countries
            </span>
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg. Payout Time</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-gray-900">2.4 Days</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
              Optimal
            </span>
          </div>
        </div>
      </div>

      {/* Host Directory Table Container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4.5">Host Details</th>
              <th className="px-6 py-4.5">KYC Status</th>
              <th className="px-6 py-4.5">Payout Account</th>
              <th className="px-6 py-4.5">Listings</th>
              <th className="px-6 py-4.5">Revenue (YTD)</th>
              <th className="px-6 py-4.5">Status Toggle</th>
              <th className="px-6 py-4.5 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hosts.map(host => (
              <tr key={host._id} className="hover:bg-gray-50/50 transition">
                {/* Host Details */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-700 text-white flex items-center justify-center font-bold text-sm border border-gray-100 flex-shrink-0">
                      {host.avatar ? (
                        <img src={host.avatar} alt={host.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{host.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{host.name}</div>
                      <div className="text-[11px] text-gray-500 font-semibold mt-0.5">{host.businessName}, {host.location}</div>
                    </div>
                  </div>
                </td>

                {/* KYC Status */}
                <td className="px-6 py-4 align-middle">
                  {getKycBadge(host.kyc)}
                </td>

                {/* Payout Account */}
                <td className="px-6 py-4 align-middle">
                  {getPayoutStyle(host.payoutStatus)}
                </td>

                {/* Listings */}
                <td className="px-6 py-4 align-middle text-sm font-bold text-gray-900">
                  {host.listings} {host.listings === 1 ? 'Unit' : 'Units'}
                </td>

                {/* Revenue (YTD) */}
                <td className="px-6 py-4 align-middle text-sm font-bold text-gray-900">
                  {host.revenue}
                </td>

                {/* Status Toggle */}
                <td className="px-6 py-4 align-middle">
                  <button
                    onClick={() => handleToggleStatus(host._id, host.isDb, host.isActive)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      host.isActive ? 'bg-[#052618]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        host.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </td>

                {/* Actions Icon */}
                <td className="px-6 py-4 align-middle text-right text-gray-400">
                  <button className="hover:text-gray-900 transition p-1 cursor-pointer">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Showing 1 to {hosts.length} of 1,240 hosts</span>
          <div className="flex items-center gap-2">
            <button className="bg-white border border-gray-200 text-[13px] font-semibold text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">Previous</button>
            <button className="bg-white border border-gray-200 text-[13px] font-semibold text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">Next</button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Compliance banner + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Compliance Updates Card (8/12 width) */}
        <div className="lg:col-span-8 bg-[#052618] rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm select-none border border-[#083622]">
          {/* Abstract SVG overlay background elements */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
              <rect x="20" y="20" width="200" height="200" rx="30" stroke="#FFF" strokeWidth="8" />
              <rect x="50" y="50" width="200" height="200" rx="30" stroke="#FFF" strokeWidth="8" />
              <rect x="80" y="80" width="200" height="200" rx="30" stroke="#FFF" strokeWidth="8" />
            </svg>
          </div>

          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Host Compliance Updates</h2>
            <p className="text-sm text-[#9FB5A9] font-medium leading-relaxed mt-3">
              New European Union KYC regulations are taking effect next month. Review your pending host documentation to ensure uninterrupted payouts.
            </p>
          </div>

          <div className="mt-6 relative z-10">
            <button className="bg-[#C6F6D5] hover:bg-[#A3ECAE] text-[#052618] text-sm font-bold rounded-full px-6 py-3 transition duration-150 cursor-pointer shadow-sm">
              Run Compliance Check
            </button>
          </div>
        </div>

        {/* Quick Actions Panel (4/12 width) */}
        <div className="lg:col-span-4 flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</span>
          <div className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-150">
            {/* Action 1 */}
            <div 
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center justify-between p-4.5 hover:bg-gray-50/50 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-gray-400 group-hover:text-gray-800 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition">Email All Hosts</span>
              </div>
              <span className="text-gray-300 group-hover:text-gray-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>

            {/* Action 2 */}
            <div className="flex items-center justify-between p-4.5 hover:bg-gray-50/50 transition cursor-pointer group">
              <div className="flex items-center gap-3.5">
                <span className="text-gray-400 group-hover:text-gray-800 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition">Export Directory</span>
              </div>
              <span className="text-gray-300 group-hover:text-gray-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>

            {/* Action 3 */}
            <div 
              onClick={() => setIsGrowthMapOpen(true)}
              className="flex items-center justify-between p-4.5 hover:bg-gray-50/50 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-gray-400 group-hover:text-gray-800 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition">View Growth Map</span>
              </div>
              <span className="text-gray-300 group-hover:text-gray-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-150 transform scale-100 transition-all mx-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Email All Hosts</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  This will send an in-app notification and log a simulated email to the console.
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsEmailModalOpen(false);
                  setSubject('');
                  setMessage('');
                  setStatusMessage(null);
                }} 
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
              {statusMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold border ${
                  statusMessage.type === 'success' 
                    ? 'bg-[#E6F4EA] text-[#137333] border-[#D4EDDA]' 
                    : 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]'
                }`}>
                  {statusMessage.text}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Subject</label>
                <input 
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Important Updates regarding EU KYC Regulations"
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#052618] focus:border-transparent transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Message</label>
                <textarea 
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your broadcast message here..."
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#052618] focus:border-transparent transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setSubject('');
                    setMessage('');
                    setStatusMessage(null);
                  }}
                  className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={sending}
                  className="bg-[#052618] hover:bg-[#073622] text-white text-sm font-bold rounded-xl px-6 py-3 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGrowthMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl border border-gray-150 transform scale-100 transition-all mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">India Market Growth Map</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Geographical distribution of active experiences and operator partners across India.
                </p>
              </div>
              <button 
                onClick={() => setIsGrowthMapOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Map Graphic (7/12 width on desktop) */}
              <div className="lg:col-span-7 bg-[#052618]/5 rounded-2xl p-6 border border-[#052618]/10 min-h-[350px] flex flex-col justify-between relative overflow-hidden">
                <span className="text-[10px] font-bold text-[#052618] uppercase tracking-wider mb-2">Live India Heatmap</span>
                
                {/* Abstract India Map Graphic */}
                <div className="relative w-full h-64 flex items-center justify-center">
                  <svg className="w-full h-full opacity-40 text-[#052618]" viewBox="0 0 400 400" fill="currentColor">
                    <path d="M190,40 L210,40 L220,70 L210,90 L230,110 L210,130 L220,150 L270,150 L290,165 L270,180 L280,210 L250,210 L230,230 L220,270 L200,310 L195,340 L190,360 L185,340 L180,310 L160,270 L165,240 L140,230 L115,220 L105,190 L120,170 L140,170 L130,150 L145,130 L155,100 L175,80 Z" />
                  </svg>
                  
                  {/* Glowing Hotspots based on DB data */}
                  {regions.map((reg, idx) => {
                    const stateCoords = {
                      'Himachal Pradesh': { top: '22%', left: '46%' },
                      'Uttarakhand': { top: '28%', left: '49%' },
                      'Goa': { top: '65%', left: '38%' },
                      'Karnataka': { top: '72%', left: '42%' },
                      'Kerala': { top: '85%', left: '44%' },
                      'Maharashtra': { top: '55%', left: '41%' },
                      'Rajasthan': { top: '38%', left: '34%' },
                      'Sikkim': { top: '40%', left: '68%' },
                      'Ladakh': { top: '12%', left: '48%' },
                      'Jammu & Kashmir': { top: '15%', left: '44%' }
                    };
                    const coords = stateCoords[reg.state] || { top: `${30 + (idx * 12) % 50}%`, left: `${40 + (idx * 15) % 40}%` };
                    return (
                      <div 
                        key={reg.state} 
                        style={{ top: coords.top, left: coords.left }}
                        className="absolute flex items-center justify-center group/spot"
                      >
                        <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                        <span className="relative rounded-full h-3 w-3 bg-[#052618] border-2 border-white"></span>
                        <div className="absolute hidden group-hover/spot:block bg-white text-[#052618] text-[10px] font-extrabold px-2 py-1 rounded shadow-lg border border-gray-150 whitespace-nowrap z-20 -translate-y-8">
                          {reg.state}: {reg.tripsCount} {reg.tripsCount === 1 ? 'trip' : 'trips'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[#052618] text-white p-4 rounded-xl flex items-center justify-between text-xs mt-4">
                  <div>
                    <span className="opacity-75 uppercase text-[9px] font-bold tracking-widest block">Active Markets</span>
                    <span className="font-extrabold text-sm block mt-0.5">{regions.length} Indian States</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">
                      {regions.reduce((sum, r) => sum + r.tripsCount, 0)} Total Live Trips
                    </span>
                    <span className="opacity-75 text-[10px] block">Across database</span>
                  </div>
                </div>
              </div>

              {/* Region Stats (5/12 width) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">State-wise Breakdown</span>
                
                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {mapLoading ? (
                    <div className="text-sm text-gray-500 font-medium text-center py-8">Loading state data...</div>
                  ) : regions.length === 0 ? (
                    <div className="text-sm text-gray-500 font-medium text-center py-8">No live experiences found.</div>
                  ) : (
                    regions.map(reg => (
                      <div key={reg.state} className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex justify-between items-center hover:bg-gray-100/70 transition">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{reg.state}</div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">
                            {reg.operatorCount} {reg.operatorCount === 1 ? 'OPERATOR' : 'OPERATORS'} • {reg.tripsCount} {reg.tripsCount === 1 ? 'TRIP' : 'TRIPS'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-[#052618]">{reg.avgPriceRange}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
