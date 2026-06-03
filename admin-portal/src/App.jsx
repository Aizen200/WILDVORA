<<<<<<< Updated upstream
import { useState } from 'react'
import { Sidebar, Topbar } from './components/shared.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ListingsApprovalQueue from './pages/ListingsApprovalQueue.jsx'
import BookingsDisputes from './pages/BookingsDisputes.jsx'

function ComingSoon({ title }) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#f5f1ea' }}>
      <div className="text-center">
        <div className="text-4xl mb-3">🚧</div>
        <div className="text-gray-400 text-sm font-medium">{title} — coming soon</div>
      </div>
    </div>
  )
=======
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Hosts from './pages/Hosts';
import AdminLayout from './components/AdminLayout';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F0EB]">
        <div className="text-lg font-medium text-gray-600">Loading admin console...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected routes wrapped in AdminLayout */}
      <Route path="/"                element={<ProtectedLayout><Navigate to="/hosts" replace /></ProtectedLayout>} />
      <Route path="/hosts"           element={<ProtectedLayout><Hosts /></ProtectedLayout>} />
      
      {/* Interactive placeholder pages for other sidebar links */}
      <Route path="/overview"        element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Overview Dashboard</h1><p className="text-gray-500 mt-2">Platform insights and real-time operations console.</p></div></ProtectedLayout>} />
      <Route path="/listings"        element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Experience Listings</h1><p className="text-gray-500 mt-2">Moderation queue and active operator inventory.</p></div></ProtectedLayout>} />
      <Route path="/bookings"        element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Bookings Manager</h1><p className="text-gray-500 mt-2">Platform-wide customer bookings ledger.</p></div></ProtectedLayout>} />
      <Route path="/customers"       element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Customer Directory</h1><p className="text-gray-500 mt-2">Registered customer profiles and dispute flags.</p></div></ProtectedLayout>} />
      <Route path="/payouts"         element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Payout Settlements</h1><p className="text-gray-500 mt-2">Settlement releases and payment overrides.</p></div></ProtectedLayout>} />
      <Route path="/settings"        element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Settings</h1><p className="text-gray-500 mt-2">Global system configuration and API credentials.</p></div></ProtectedLayout>} />
      <Route path="/help"            element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Help Center</h1><p className="text-gray-500 mt-2">Internal documentation and support ticket console.</p></div></ProtectedLayout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
>>>>>>> Stashed changes
}

export default function App() {
  const [page, setPage] = useState('dashboard')

  const pageTitles = {
    dashboard: 'Dashboard',
    listings:  'Listings Approval Queue',
    bookings:  'Bookings & Disputes',
    hosts:     'Host Management',
    customers: 'Customer Management',
    payouts:   'Payouts Control',
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />
      case 'listings':  return <ListingsApprovalQueue />
      case 'bookings':  return <BookingsDisputes />
      default:          return <ComingSoon title={pageTitles[page]} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={page} onNav={setPage} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar page={page} />
        {renderPage()}
      </div>
    </div>
  )
}