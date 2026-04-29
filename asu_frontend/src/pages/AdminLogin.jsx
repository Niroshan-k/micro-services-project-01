// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Terminal, Lock } from 'lucide-react';
import { adminApi } from '../services/api';
import { theme } from '../theme';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await adminApi.post('/login', { email, password });
      
      if (response.data && response.data.admin_id) {
        localStorage.setItem('AQUASENSE_ADMIN_ID', response.data.admin_id);
        navigate('/overwatch');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'AUTHORIZATION FAILED. INVALID CREDENTIALS.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fontMono }}>
      
      <div style={{ width: '100%', maxWidth: '450px', backgroundColor: '#0A0A0A', border: `1px solid ${theme.alert}`, position: 'relative' }}>
        
        {/* Top Warning Bar */}
        <div style={{ backgroundColor: theme.alert, color: '#000', padding: '10px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={16} />
          RESTRICTED SYSTEM ACCESS
        </div>

        <div style={{ padding: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
            <Terminal size={40} color={theme.alert} style={{ marginBottom: '15px' }} />
            <h1 style={{ margin: 0, color: theme.text, fontSize: '1.5rem', letterSpacing: '4px', fontWeight: '300' }}>OVERWATCH</h1>
            <p style={{ margin: '5px 0 0 0', color: theme.textMuted, fontSize: '0.8rem', letterSpacing: '1px' }}>ADMINISTRATIVE UPLINK</p>
          </div>

          {error && (
            <div style={{ backgroundColor: '#2A0000', border: `1px solid ${theme.alert}`, color: theme.alert, padding: '15px', marginBottom: '25px', fontSize: '0.8rem', textAlign: 'center', letterSpacing: '1px' }}>
              [ ! ] {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div>
              <label style={{ display: 'block', color: theme.textMuted, fontSize: '0.75rem', marginBottom: '10px', letterSpacing: '1px' }}>OPERATOR ID (EMAIL)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // FIX: Added boxSizing: 'border-box'
                style={{ boxSizing: 'border-box', width: '100%', padding: '15px', backgroundColor: '#000', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, outline: 'none' }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', color: theme.textMuted, fontSize: '0.75rem', marginBottom: '10px', letterSpacing: '1px' }}>DECRYPTION KEY (PASSWORD)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // FIX: Added boxSizing: 'border-box'
                style={{ boxSizing: 'border-box', width: '100%', padding: '15px', backgroundColor: '#000', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, outline: 'none' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              // FIX: Added boxSizing: 'border-box'
              style={{ boxSizing: 'border-box', width: '100%', padding: '15px', marginTop: '10px', backgroundColor: 'transparent', border: `1px solid ${theme.alert}`, color: theme.alert, fontFamily: theme.fontMono, fontSize: '0.9rem', letterSpacing: '2px', cursor: isLoading ? 'wait' : 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.alert; e.currentTarget.style.color = '#000'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.alert; }}
            >
              <Lock size={16} />
              {isLoading ? 'AUTHENTICATING...' : 'INITIATE UPLINK'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}