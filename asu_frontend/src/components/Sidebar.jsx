// src/components/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Droplet, Zap, AlertTriangle, FileText, Settings, LogOut } from 'lucide-react';
import { theme } from '../theme';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'DASHBOARD', path: '/dashboard', icon: <Activity size={18} /> },
    { name: 'WATER METRICS', path: '/dashboard/water', icon: <Droplet size={18} /> },
    { name: 'ENERGY METRICS', path: '/dashboard/energy', icon: <Zap size={18} /> },
    { name: 'SYSTEM ALERTS', path: '/dashboard/alerts', icon: <AlertTriangle size={18} /> },
    { name: 'AUDIT REPORTS', path: '/dashboard/reports', icon: <FileText size={18} /> },
    { name: 'SETTINGS', path: '/dashboard/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div style={{ width: '260px', backgroundColor: theme.surface, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', padding: '30px 0' }}>
      <div style={{ padding: '0 30px', marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '300', letterSpacing: '3px', margin: 0, color: theme.accent }}>AQUASENSE</h2>
        <p style={{ fontSize: '0.7rem', color: theme.textMuted, letterSpacing: '1px', marginTop: '5px' }}>v2.0.4 // CWP ACTIVE</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div 
              key={item.name}
              onClick={() => navigate(item.path)}
              style={{
                padding: '12px 30px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer',
                backgroundColor: isActive ? '#1A1A1A' : 'transparent',
                borderRight: isActive ? `3px solid ${theme.accent}` : '3px solid transparent',
                color: isActive ? theme.text : theme.textMuted,
                transition: 'all 0.2s ease'
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.8rem', letterSpacing: '1.5px', fontWeight: isActive ? '600' : '400' }}>{item.name}</span>
            </div>
          );
        })}
      </div>

      <div 
        onClick={() => navigate('/')}
        style={{ padding: '20px 30px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', color: theme.textMuted, borderTop: `1px solid ${theme.border}` }}
      >
        <LogOut size={18} />
        <span style={{ fontSize: '0.8rem', letterSpacing: '1.5px' }}>DISCONNECT</span>
      </div>
    </div>
  );
}