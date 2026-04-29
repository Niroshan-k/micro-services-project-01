// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AuthScreen from './pages/AuthScreen';
import DashboardOverview from './pages/DashboardOverview';
import Sidebar from './components/Sidebar';
import { theme } from './theme';
import WaterMetrics from './pages/WaterMetrics';
import EnergyMetrics from './pages/EnergyMetrics';
import SystemAlerts from './pages/SystemAlerts';
import AuditReports from './pages/AuditReports';
import Settings from './pages/Settings';

import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboardOverview from './pages/AdminDashboardOverview';
import AdminCustomerMatrix from './pages/AdminCustomerMatrix';
import AdminNodeTelemetry from './pages/AdminNodeTelemetry';
import AdminSystemHealth from './pages/AdminSystemHealth';
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminReports from './pages/AdminReports';

// --- SECURITY ROUTE GUARDS ---

// 1. Customer Guard: Checks for standard session
const CustomerProtectedRoute = ({ children }) => {
  const customerId = localStorage.getItem('AQUASENSE_SESSION_ID');
  if (!customerId) {
    // Kick them back to the login screen if no token exists
    return <Navigate to="/" replace />;
  }
  return children;
};

// 2. Admin Guard: Checks for the high-clearance Overwatch token
const AdminProtectedRoute = ({ children }) => {
  const adminId = localStorage.getItem('AQUASENSE_ADMIN_ID');
  if (!adminId) {
    // Kick them back to the Admin Login screen
    return <Navigate to="/overwatch/login" replace />;
  }
  return children;
};

// Temporary placeholder for the Overwatch Dashboard
const OverwatchShell = () => (
  <div style={{ backgroundColor: '#000', color: '#00FF00', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono", monospace' }}>
    <h1>OVERWATCH TERMINAL ACTIVE</h1>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AuthScreen />} />
        <Route path="/overwatch/login" element={<AdminLogin />} />
        
        {/* --- PROTECTED ADMIN OVERWATCH ROUTES --- */}
        <Route path="/overwatch" element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }>
          {/* Index route for /overwatch */}
          <Route index element={<AdminDashboardOverview />} />
          
          {/* Placeholders for the other sidebar links, you can build these out later! */}
          <Route path="customers" element={<AdminCustomerMatrix />} />
          <Route path="telemetry" element={<AdminNodeTelemetry />} />
          <Route path="health" element={<AdminSystemHealth />} />
          <Route path="audit" element={<AdminAuditLogs />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* --- PROTECTED CUSTOMER DASHBOARD --- */}
        <Route path="/dashboard/*" element={
          <CustomerProtectedRoute>
            <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: theme.fontMain }}>
              <Sidebar />
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <Routes>
                  <Route path="/" element={<DashboardOverview />} />
                  <Route path="/water" element={<WaterMetrics />} />
                  <Route path="/energy" element={<EnergyMetrics />} />
                  <Route path="/alerts" element={<SystemAlerts />} />
                  <Route path="/reports" element={<AuditReports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            </div>
          </CustomerProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}