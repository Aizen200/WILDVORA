import { useState, useEffect } from 'react';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

export default function Payouts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');

  const [bankAccount, setBankAccount] = useState({
    holderName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: ''
  });

  const fetchPayoutData = () => {
    setLoading(true);
    hostAPI.getPayouts()
      .then(res => {
        setData(res.data);
        if (res.data.bankAccount) {
          setBankAccount({
            holderName: res.data.bankAccount.holderName || '',
            accountNumber: res.data.bankAccount.accountNumber || '',
            bankName: res.data.bankAccount.bankName || '',
            ifscCode: res.data.bankAccount.ifscCode || ''
          });
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load payouts data');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const res = await hostAPI.updateBankAccount(bankAccount);
      setSuccess('Bank account details updated successfully!');
      setData(prev => ({ ...prev, bankAccount: res.data.bankAccount }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bank details');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-full pb-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor your adventure earnings, payouts schedule, and bank credentials.</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl px-4 py-2.5 text-sm shadow-sm hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V3m0 0L8 7m4-4l4 4"/>
            </svg>
            <span>Export statement</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm" role="alert">
            {success}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-500 font-semibold">Loading payouts overview...</div>
        ) : (
          <div className="space-y-6">
            {/* Earnings Summary Row */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Earnings</span>
                <div className="text-3xl font-black text-gray-900 mt-2">₹{(data?.earnings?.totalEarnings || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-[#1A5F45]">Pending Payouts</span>
                <div className="text-3xl font-black text-gray-900 mt-2">₹{(data?.earnings?.pendingPayouts || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-blue-600">Settled Payouts</span>
                <div className="text-3xl font-black text-gray-900 mt-2">₹{(data?.earnings?.completedPayouts || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Split layout: Settlement History + Bank account */}
            <div className="grid grid-cols-3 gap-6">
              {/* Payout Settlements (Span 2) */}
              <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Settlement History</h2>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5 mb-4">View recent releases and direct deposit records.</p>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="py-2.5 px-4">Released Date</th>
                        <th className="py-2.5 px-4">Reference ID</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data?.settlementHistory?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">No payout releases logged yet.</td>
                        </tr>
                      ) : (
                        data?.settlementHistory?.map(p => (
                          <tr key={p._id} className="hover:bg-gray-50/50 transition">
                            <td className="py-3 px-4 font-semibold text-gray-600">
                              {new Date(p.releasedAt || p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-400">
                              {p.transactionId || 'TXN-PENDING'}
                            </td>
                            <td className="py-3 px-4 font-black text-gray-800">
                              ₹{p.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                p.status === 'processed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payout / Bank Account Settings (Span 1) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-50">Bank Account Details</h3>
                <form onSubmit={handleBankSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Account Holder Name</label>
                    <input 
                      type="text" 
                      name="holderName" 
                      required
                      value={bankAccount.holderName} 
                      onChange={handleBankChange}
                      placeholder="e.g. John Doe"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 outline-none focus:ring-1 focus:ring-[#1A5F45] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Account Number</label>
                    <input 
                      type="text" 
                      name="accountNumber" 
                      required
                      value={bankAccount.accountNumber} 
                      onChange={handleBankChange}
                      placeholder="501002392812"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 outline-none focus:ring-1 focus:ring-[#1A5F45] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bank Name</label>
                    <input 
                      type="text" 
                      name="bankName" 
                      required
                      value={bankAccount.bankName} 
                      onChange={handleBankChange}
                      placeholder="HDFC Bank"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 outline-none focus:ring-1 focus:ring-[#1A5F45] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">IFSC Code / Routing</label>
                    <input 
                      type="text" 
                      name="ifscCode" 
                      required
                      value={bankAccount.ifscCode} 
                      onChange={handleBankChange}
                      placeholder="HDFC0000124"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 outline-none focus:ring-1 focus:ring-[#1A5F45] transition"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={updating}
                    className="w-full py-2.5 bg-[#1A5F45] hover:bg-[#145038] text-white text-xs font-bold rounded-xl shadow-sm transition mt-2"
                  >
                    {updating ? 'Saving...' : 'Update Settings'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
