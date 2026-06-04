import { useState } from 'react';

export default function Settings() {
  const [commission, setCommission] = useState(12);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('alerts@wildvora.in');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }, 800);
  };

  return (
    <div className="px-8 py-8 flex flex-col font-sans max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Configure global platform thresholds, billing settings, and notifications.</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-250 text-[#1A5F45] text-xs font-bold rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          System configuration successfully updated.
        </div>
      )}

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6">
        {/* Marketplace Fees */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">Marketplace Commission</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Commission (%)</label>
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1A5F45]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Alerts Email</label>
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1A5F45]"
              />
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">System Control</h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/40 border border-red-100/50">
            <div>
              <p className="text-xs font-bold text-gray-800">Maintenance Mode</p>
              <p className="text-[10px] text-gray-400 leading-normal mt-0.5">Redirect public explorer app and host portals to system offline page.</p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                maintenanceMode ? 'bg-[#ba1a1a]' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform duration-200 ${
                  maintenanceMode ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* API Credentials */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">API Keys</h2>
          <div className="p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-3 bg-gray-50/20">
            <div>
              <p className="text-xs font-bold text-gray-850">Mapbox SDK Key</p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">pk.eyJ1Ijoid2lsZHZvcmEiLCJhIjoiY2... (production)</p>
            </div>
            <button className="px-3 py-1.5 border border-gray-200 text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">
              Reveal
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#1A5F45] hover:bg-[#124230] text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
