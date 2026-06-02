import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login         from './pages/Login';
import Register      from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard     from './pages/Dashboard';
import Listings      from './pages/Listings';
import Bookings      from './pages/Bookings';
import Analytics     from './pages/Analytics';
import Reviews       from './pages/Reviews';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div id="app-loading" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'16px', color:'#666' }}>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login"          element={<Login />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected portal routes */}
      <Route path="/"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/listings"   element={<ProtectedRoute><Listings /></ProtectedRoute>} />
      <Route path="/bookings"   element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
      <Route path="/analytics"  element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/reviews"    element={<ProtectedRoute><Reviews /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
