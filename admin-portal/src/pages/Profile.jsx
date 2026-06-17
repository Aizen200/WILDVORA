import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Local form states
  const [fullName, setFullName] = useState(user?.name || 'Admin User');
  const [email, setEmail] = useState(user?.email || 'admin@wildvora.com');
  const [phone, setPhone] = useState('+1 (555) 000-9999');
  const [role, setRole] = useState('Super Administrator');

  const [notifications, setNotifications] = useState({
    loginAlerts: true,
    weeklyReports: true,
    systemUpdates: true,
  });

  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load Google Fonts Material Symbols dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleToggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleLogout = async () => {
    if (logout) {
      await logout();
      navigate('/login');
    }
  };

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="px-8 py-8 flex flex-col font-sans">
      <div id="profile-page" className="max-w-6xl mx-auto w-full pb-12">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Profile</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage your administrative account and system preferences.</p>
        </div>

        {/* Success toast notification */}
        {saveSuccess && (
          <div className="fixed bottom-5 right-5 bg-[#1A5F45] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-bounce">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="text-sm font-semibold">Profile saved successfully!</span>
          </div>
        )}

        <div className="flex gap-6">
          {/* Settings Local Navigation (Left column) */}
          <div className="w-1/4 space-y-4">
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Personal Information', icon: 'person' },
                { id: 'security', label: 'Security & Access', icon: 'security' },
                { id: 'notifications', label: 'Alert Preferences', icon: 'notifications_active' },
              ].map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white shadow-[0_4px_20px_0_rgba(45,55,72,0.08)] text-[#1A5F45] font-bold border-l-4 border-[#1A5F45]'
                        : 'text-gray-500 hover:bg-white hover:text-[#1A5F45]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Role Widget */}
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100 mt-6 shadow-sm">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Current Role</p>
              <div className="text-lg font-black text-[#1A5F45]">{role}</div>
              <p className="text-xs text-emerald-600 mt-2 font-medium">Full access to hosts, payouts, and platform settings.</p>
            </div>
          </div>

          {/* Profile Detail Panels (Right column) */}
          <div className="w-3/4 space-y-6">
            
            {/* Profile Section */}
            <section id="profile" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="pb-5 border-b border-gray-100 flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                  <p className="text-xs text-gray-400">Update your internal admin directory profile.</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#1A5F45] hover:bg-[#124230] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-12 gap-5">
                  {/* Avatar: always use initials, no photo */}
                  <div className="col-span-12 flex items-center gap-5 pb-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl bg-[#052618] border border-[#083622] shadow-sm flex items-center justify-center">
                        <span className="text-3xl font-black text-white">{fullName.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">Profile Avatar</h4>
                      <p className="text-[11px] text-gray-400 mb-2.5">Your avatar is generated from your display name.</p>
                    </div>
                  </div>

                {/* Form Fields */}
                <div className="col-span-6 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1A5F45]"
                  />
                </div>
                <div className="col-span-6 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1A5F45]"
                  />
                </div>
                <div className="col-span-6 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1A5F45]"
                  />
                </div>
              </div>
            </section>

            {/* Security & Notifications Grid */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Security Card */}
              <section id="security" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-5 border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-900">Security</h3>
                    <p className="text-xs text-gray-400 mt-1">Manage credentials and sessions.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-800 mb-0.5">Admin 2FA</p>
                        <p className="text-[10px] text-gray-400 leading-normal">Currently enforced</p>
                      </div>
                      <button className="px-3.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold cursor-not-allowed">
                        Enabled
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-800 mb-0.5">Password</p>
                        <p className="text-[10px] text-gray-400 leading-normal">Last changed 2 months ago</p>
                      </div>
                      <button className="px-3.5 py-1.5 border border-gray-200 text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-100 mt-6">
                  <button onClick={handleLogout} className="flex items-center gap-1.5 text-red-500 text-sm font-bold hover:scale-102 transition cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Sign Out of Admin Console
                  </button>
                </div>
              </section>

              {/* Notifications Card */}
              <section id="notifications" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="mb-5 border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900">Alert Preferences</h3>
                  <p className="text-xs text-gray-400 mt-1">Email and dashboard alerts.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'loginAlerts', label: 'Suspicious Logins', desc: 'Alerts for failed admin logins' },
                    { key: 'weeklyReports', label: 'Weekly Summary', desc: 'Host growth and payout reports' },
                    { key: 'systemUpdates', label: 'System Status', desc: 'Downtime and maintenance alerts' },
                  ].map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{notif.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{notif.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(notif.key)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                          notifications[notif.key] ? 'bg-[#1A5F45]' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform duration-200 ${
                            notifications[notif.key] ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Footer Bottom Actions */}
            <div className="flex justify-end gap-3 pt-4 pb-8">
              <button
                type="button"
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-white transition cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#1A5F45] hover:bg-[#124230] text-white rounded-xl text-xs font-semibold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
