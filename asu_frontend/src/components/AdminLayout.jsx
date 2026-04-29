// src/components/AdminLayout.jsx
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Terminal, Users, Activity, Shield, Server, FileText, LogOut } from 'lucide-react';
import { theme } from '../theme';

const navItems = [
  { name: 'FLEET COMMAND', path: '/overwatch', icon: <Terminal size={18} /> },
  { name: 'CUSTOMER MATRIX', path: '/overwatch/customers', icon: <Users size={18} /> },
  { name: 'NODE TELEMETRY', path: '/overwatch/telemetry', icon: <Activity size={18} /> },
  { name: 'SYSTEM HEALTH', path: '/overwatch/health', icon: <Server size={18} /> },
  { name: 'AUDIT LOGS', path: '/overwatch/audit', icon: <Shield size={18} /> },
  { name: 'REPORTS', path: '/overwatch/reports', icon: <FileText size={18} /> },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const adminId = localStorage.getItem('AQUASENSE_ADMIN_ID') || 'UNKNOWN_ADM';

  const handleSeverUplink = () => {
    localStorage.removeItem('AQUASENSE_ADMIN_ID');
    navigate('/overwatch/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', color: theme.text, fontFamily: theme.fontMain }}>
      
      {/* OVERWATCH SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#0A0A0A', borderRight: `1px solid ${theme.alert}`, display: 'flex', flexDirection: 'column' }}>
        
        {/* Brand Identity */}
        <div style={{ padding: '30px 20px', borderBottom: `1px solid #1A0000`, display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Shield color={theme.alert} size={28} />
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '300', letterSpacing: '3px', color: theme.text, fontFamily: theme.fontMono }}>OVERWATCH</div>
            <div style={{ fontSize: '0.65rem', color: theme.alert, letterSpacing: '1px', fontFamily: theme.fontMono, marginTop: '4px' }}>ADMINISTRATIVE UPLINK</div>
          </div>
        </div>

        {/* Operator Identity */}
        <div style={{ padding: '15px 20px', backgroundColor: '#1A0000', borderBottom: `1px solid ${theme.alert}`, fontFamily: theme.fontMono, fontSize: '0.75rem', color: theme.textMuted }}>
          <div>OPERATOR: <span style={{ color: theme.text }}>{adminId}</span></div>
          <div>STATUS: <span style={{ color: theme.chartHighlight || '#A855F7' }}>SECURE</span></div>
        </div>

        {/* Navigation Matrix */}
        <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/overwatch'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 25px',
                textDecoration: 'none', fontFamily: theme.fontMono, fontSize: '0.8rem', letterSpacing: '2px',
                color: isActive ? '#000' : theme.textMuted,
                backgroundColor: isActive ? theme.alert : 'transparent',
                borderRight: isActive ? `3px solid #FFF` : '3px solid transparent',
                transition: 'all 0.2s ease'
              })}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sever Uplink Action */}
        <div style={{ padding: '20px', borderTop: `1px solid #1A0000` }}>
          <button 
            onClick={handleSeverUplink}
            style={{ width: '100%', padding: '15px', backgroundColor: 'transparent', border: `1px solid ${theme.alert}`, color: theme.alert, fontFamily: theme.fontMono, fontSize: '0.8rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.alert; e.currentTarget.style.color = '#000'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.alert; }}
          >
            <LogOut size={16} /> SEVER UPLINK
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#050505' }}>
        <Outlet />
      </div>
    </div>
  );
}