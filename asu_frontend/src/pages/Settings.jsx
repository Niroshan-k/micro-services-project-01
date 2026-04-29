// src/pages/Settings.jsx
import React, { useState } from 'react';
import { User, Bell, Shield, HardDrive, Save } from 'lucide-react';
import { theme } from '../theme';

export default function Settings() {
  // Mock states for UI interactivity
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [dataSync, setDataSync] = useState('3000'); // ms
  
  const customerId = localStorage.getItem('AQUASENSE_SESSION_ID') || 'UNKNOWN_IDENTITY';

  // Helper component for sleek toggle switches
  const Toggle = ({ active, onClick }) => (
    <div 
      onClick={onClick}
      style={{
        width: '40px', height: '20px', backgroundColor: active ? theme.text : '#111',
        border: `1px solid ${theme.border}`, borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      <div style={{
        width: '14px', height: '14px', backgroundColor: active ? theme.bg : theme.textMuted,
        borderRadius: '50%', position: 'absolute', top: '2px', left: active ? '22px' : '2px', transition: 'all 0.2s'
      }} />
    </div>
  );

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', letterSpacing: '2px' }}>SYSTEM CONFIGURATION</h2>
          <p style={{ margin: '10px 0 0 0', color: theme.textMuted, fontSize: '0.85rem', fontFamily: theme.fontMono }}>
            ACCOUNT & HARDWARE PREFERENCES
          </p>
        </div>
        <button 
          style={{ padding: '10px 20px', backgroundColor: theme.text, color: theme.bg, border: 'none', fontFamily: theme.fontMono, fontSize: '0.8rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Save size={16} />
          COMMIT CHANGES
        </button>
      </div>

      {/* Identity Matrix */}
      <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: theme.textMuted }}>
          <User size={18} />
          <h3 style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '2px' }}>IDENTITY ACCESS MANAGEMENT</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: theme.textMuted, marginBottom: '8px', fontFamily: theme.fontMono }}>UNIQUE IDENTIFIER</label>
            <div style={{ padding: '12px', backgroundColor: '#111', border: `1px solid ${theme.border}`, fontFamily: theme.fontMono, fontSize: '0.85rem', color: theme.textMuted }}>
              {customerId}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: theme.textMuted, marginBottom: '8px', fontFamily: theme.fontMono }}>ENCRYPTION STANDARD</label>
            <div style={{ padding: '12px', backgroundColor: '#111', border: `1px solid ${theme.border}`, fontFamily: theme.fontMono, fontSize: '0.85rem', color: '#00FF00' }}>
              BCRYPT SECURED
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry & Alerts */}
      <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: theme.textMuted }}>
          <Bell size={18} />
          <h3 style={{ margin: '0', fontSize: '0.9rem', letterSpacing: '2px' }}>EVENT NOTIFICATION ROUTING</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: `1px solid #1A1A1A` }}>
            <div>
              <div style={{ fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '5px' }}>CRITICAL EMAIL DISPATCH</div>
              <div style={{ fontSize: '0.75rem', color: theme.textMuted, fontFamily: theme.fontMono }}>Route hardware warnings to registered email address.</div>
            </div>
            <Toggle active={emailAlerts} onClick={() => setEmailAlerts(!emailAlerts)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: `1px solid #1A1A1A` }}>
            <div>
              <div style={{ fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '5px' }}>SMS GATEWAY (AWS SNS)</div>
              <div style={{ fontSize: '0.75rem', color: theme.textMuted, fontFamily: theme.fontMono }}>Enable strict SMS overriding for offline alerts. (May incur carrier charges)</div>
            </div>
            <Toggle active={smsAlerts} onClick={() => setSmsAlerts(!smsAlerts)} />
          </div>
        </div>
      </div>

      {/* Hardware Interface */}
      <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: theme.textMuted }}>
          <HardDrive size={18} />
          <h3 style={{ margin: '0', fontSize: '0.9rem', letterSpacing: '2px' }}>HARDWARE LINK CONFIGURATION</h3>
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: theme.textMuted, marginBottom: '10px', fontFamily: theme.fontMono }}>TELEMETRY POLLING RATE (MS)</label>
          <select 
            value={dataSync} 
            onChange={(e) => setDataSync(e.target.value)}
            style={{ width: '100%', padding: '12px', backgroundColor: '#111', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, outline: 'none' }}
          >
            <option value="1000">1000 ms (Aggressive / High Bandwidth)</option>
            <option value="3000">3000 ms (Standard / Balanced)</option>
            <option value="10000">10000 ms (Economy / Low Bandwidth)</option>
          </select>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ border: `1px solid ${theme.alert}`, padding: '30px', backgroundColor: '#1A0505' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: theme.alert }}>
          <Shield size={18} />
          <h3 style={{ margin: '0', fontSize: '0.9rem', letterSpacing: '2px' }}>RESTRICTED ACTIONS</h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: theme.textMuted, lineHeight: '1.5', marginBottom: '20px' }}>
          Severing the physical node link will immediately halt all telemetry processing and archive current session data.
        </p>
        <button style={{ padding: '10px 20px', backgroundColor: 'transparent', color: theme.alert, border: `1px solid ${theme.alert}`, fontFamily: theme.fontMono, fontSize: '0.8rem', letterSpacing: '1px', cursor: 'pointer' }}>
          SEVER HARDWARE LINK
        </button>
      </div>

    </div>
  );
}