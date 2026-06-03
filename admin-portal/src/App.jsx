import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Hosts from './pages/Hosts';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import ListingsApprovalQueue from './pages/ListingsApprovalQueue';
import BookingsDisputes from './pages/BookingsDisputes';

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
      <Route path="/overview"        element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/listings"        element={<ProtectedLayout><ListingsApprovalQueue /></ProtectedLayout>} />
      <Route path="/bookings"        element={<ProtectedLayout><BookingsDisputes /></ProtectedLayout>} />
      
      {/* Interactive placeholder pages for other sidebar links */}
      <Route path="/customers"       element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Customer Directory</h1><p className="text-gray-500 mt-2">Registered customer profiles and dispute flags.</p></div></ProtectedLayout>} />
      <Route path="/payouts"         element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Payout Settlements</h1><p className="text-gray-500 mt-2">Settlement releases and payment overrides.</p></div></ProtectedLayout>} />
      <Route path="/settings"        element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Settings</h1><p className="text-gray-500 mt-2">Global system configuration and API credentials.</p></div></ProtectedLayout>} />
      <Route path="/help"            element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Help Center</h1><p className="text-gray-500 mt-2">Internal documentation and support ticket console.</p></div></ProtectedLayout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}