import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Customers from './pages/Customers';
import Payouts from './pages/Payouts';
import Hosts from './pages/Hosts';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Experiences from './pages/Experiences';
import Partners from './pages/Partners';
import Destinations from './pages/Destinations';
import BookingsDisputes from './pages/BookingsDisputes';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Settings from './pages/Settings';


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F0EB]">
        <div className="text-lg font-medium text-gray-600">Loading admin console...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F0EB]">
        <div className="text-lg font-medium text-gray-600">Loading admin console...</div>
      </div>
    );
  }

  return user ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected routes wrapped in AdminLayout */}
      <Route path="/"                element={<ProtectedLayout><Navigate to="/overview" replace /></ProtectedLayout>} />
      <Route path="/partners"        element={<ProtectedLayout><Partners /></ProtectedLayout>} />
      <Route path="/destinations"    element={<ProtectedLayout><Destinations /></ProtectedLayout>} />
      <Route path="/experiences"     element={<ProtectedLayout><Experiences /></ProtectedLayout>} />
      <Route path="/notifications"   element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
      <Route path="/profile"         element={<ProtectedLayout><Profile /></ProtectedLayout>} />
      <Route path="/overview"        element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/bookings"        element={<ProtectedLayout><BookingsDisputes /></ProtectedLayout>} />
      
      {/* Interactive placeholder pages for other sidebar links */}
      <Route path="/settings"        element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="/help"            element={<ProtectedLayout><Help /></ProtectedLayout>} />
      <Route path="/logs"            element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Logs</h1><p className="text-gray-500 mt-2">System audit logs.</p></div></ProtectedLayout>} />
      <Route path="/reports"         element={<ProtectedLayout><div className="p-8"><h1 className="text-3xl font-extrabold text-gray-900">Reports</h1><p className="text-gray-500 mt-2">Platform reports.</p></div></ProtectedLayout>} />

      {/* Self-contained layout routes aligned to common layout */}
      <Route path="/payouts"         element={<ProtectedLayout><Payouts /></ProtectedLayout>} />


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