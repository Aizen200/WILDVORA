import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Settings() {
  const { user } = useAuth();
  
  // Local form states
  const [fullName, setFullName] = useState('Alex Riverton');
  const [email, setEmail] = useState('alex@wildvora-expeditions.com');
  const [phone, setPhone] = useState('+1 (555) 234-8901');
  const [bio, setBio] = useState(
    'Lead guide and founder of Wildvora Expeditions. 15 years of experience in high-altitude mountaineering and wilderness survival instruction. Passionate about sustainable tourism and connecting people with the untamed beauty of the Pacific Northwest.'
  );

  const [businessName, setBusinessName] = useState('Wildvora Adventure Operators LLC');
  const [taxId, setTaxId] = useState('XX-XXXX452');
  const [businessAddress, setBusinessAddress] = useState('742 Evergreen Ridge Trail, Bend, OR 97701');
  const [website, setWebsite] = useState('wildvora.com');

  const [notifications, setNotifications] = useState({
    newBookings: true,
    reviews: true,
    payments: true,
    security: true,
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

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Layout>
      <div id="settings-page" className="max-w-6xl mx-auto pb-12">
        {/* Success toast notification */}
        {saveSuccess && (
          <div className="fixed bottom-5 right-5 bg-primary text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-bounce">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="text-sm font-semibold">Settings saved successfully!</span>
          </div>
        )}

        <div className="flex gap-6">
          {/* Settings Local Navigation (Left column) */}
          <div className="w-1/4 space-y-4">
            <h2 className="px-2 font-bold text-2xl text-gray-900">Account Settings</h2>
            
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile Settings', icon: 'person' },
                { id: 'business', label: 'Business Information', icon: 'business_center' },
                { id: 'notifications', label: 'Notifications', icon: 'notifications_active' },
                { id: 'security', label: 'Security & Privacy', icon: 'security' },
              ].map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-white shadow-[0_4px_20px_0_rgba(45,55,72,0.08)] text-primary font-bold border-l-4 border-primary'
                        : 'text-gray-500 hover:bg-white/50 hover:text-[#1A5F45]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Storage Usage Widget */}
            <div className="p-4 rounded-xl bg-[#e7eeff]/40 border border-gray-100 mt-6">
              <p className="text-xs font-bold text-gray-800 mb-2">Storage Usage</p>
              <div className="h-1.5 w-full bg-gray-200/60 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary" style={{ width: '65%' }}></div>
              </div>
              <p className="text-[10px] text-gray-500">6.5 GB of 10 GB used</p>
              <button className="mt-3 text-primary font-semibold text-xs hover:underline">
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* Settings Detail Panels (Right column) */}
          <div className="w-3/4 space-y-6">
            
            {/* Profile Section */}
            <section id="profile" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="pb-5 border-b border-gray-100 flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Profile Settings</h3>
                  <p className="text-xs text-gray-400">Manage your public operator profile and personal details.</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary hover:bg-[#145038] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-12 gap-5">
                {/* Avatar Upload */}
                <div className="col-span-12 flex items-center gap-5 pb-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shadow-sm">
                      <img
                        alt="User Profile Avatar"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqNCU47Mvwga75FFvbl3wUsVNOE7r5s6QrRtSRClMdP2KfT93eBl0iygdsmJfh5CaSsSE3Lq5qFbuG9z6ijIAmxXhQ9fMtaU7MXEBxOTT5HVnb0QXvql9cJ263wJs8reiyU67Ly7UgzeG9kg57Odu6Js4kd-vjbs3sLM0DcmaUa74uyyy3HiZBgqeL9jK77fkVfAoobRBBKBIbgckktVQQVnpzTe9AkQBDtoMSy7uJwxnSlV43ZVL5nNGkG4QW9sshKR2SHGChUrs"
                      />
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full shadow-md hover:scale-105 transition">
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">Profile Photo</h4>
                    <p className="text-[11px] text-gray-400 mb-2.5">JPG, GIF or PNG. Max size of 800K</p>
                    <div className="flex gap-2">
                      <button className="px-3.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition">
                        Upload New
                      </button>
                      <button className="px-3.5 py-1.5 text-red-500 rounded-lg text-xs font-semibold hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="col-span-6 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-6 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-6 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-12 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Professional Bio</label>
                  <textarea
                    rows="4"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                  <p className="text-[10px] text-gray-400 text-right">Character count: {bio.length}/500</p>
                </div>
              </div>
            </section>

            {/* Business Section */}
            <section id="business" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="pb-5 border-b border-gray-100 mb-5">
                <h3 className="text-lg font-bold text-gray-900">Business Information</h3>
                <p className="text-xs text-gray-400">Legal entity details for billing and compliance.</p>
              </div>

              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-8 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Legal Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none"
                  />
                </div>
                <div className="col-span-4 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tax ID / EIN</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none"
                  />
                </div>
                <div className="col-span-12 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business Address</label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none"
                  />
                </div>
                <div className="col-span-12 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Website</label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200">
                    <span className="px-3.5 py-2 bg-gray-100 text-gray-400 border-r border-gray-200 text-xs flex items-center">https://</span>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-55 text-sm text-gray-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications & Security Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Notifications Card */}
              <section id="notifications" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-400">Configure how you receive updates.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'newBookings', label: 'New Bookings', desc: 'Real-time alerts for customer reservations' },
                    { key: 'reviews', label: 'Reviews', desc: 'Get notified when guests leave feedback' },
                    { key: 'payments', label: 'Payments', desc: 'Weekly payout reports and failures' },
                    { key: 'security', label: 'Security', desc: 'Logins from new devices and password changes' },
                  ].map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{notif.label}</p>
                        <p className="text-[10px] text-gray-400">{notif.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(notif.key)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                          notifications[notif.key] ? 'bg-primary' : 'bg-gray-200'
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

              {/* Security Card */}
              <section id="security" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-gray-900">Security</h3>
                    <p className="text-xs text-gray-400">Secure your account and manage access.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-800 mb-0.5">Two-Factor Authentication</p>
                        <p className="text-[9px] text-gray-400 leading-normal">Secure your account with an additional layer.</p>
                      </div>
                      <button className="px-3.5 py-1.5 bg-[#92d8fe]/20 text-[#005f7f] rounded-lg text-xs font-semibold hover:scale-102 transition">
                        Enable 2FA
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-800 mb-0.5">Password</p>
                        <p className="text-[9px] text-gray-400 leading-normal">Last changed 4 months ago</p>
                      </div>
                      <button className="px-3.5 py-1.5 border border-gray-200 text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-50 transition">
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-100 mt-5">
                  <button className="flex items-center gap-1.5 text-red-500 text-xs font-bold hover:scale-102 transition">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Log out of all sessions
                  </button>
                </div>
              </section>
            </div>

            {/* Footer Bottom Actions */}
            <div className="flex justify-end gap-3 pt-4 pb-8">
              <button
                type="button"
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-white transition"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-primary hover:bg-[#145038] text-white rounded-xl text-xs font-semibold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
