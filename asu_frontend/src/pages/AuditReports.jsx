// src/pages/AuditReports.jsx
import React, { useState, useEffect } from 'react';
import { Download, Database } from 'lucide-react';
import { customerApi } from '../services/api';
import { theme } from '../theme';

export default function AuditReports() {
  const [activeMeter, setActiveMeter] = useState(null);
  const [sessionLogs, setSessionLogs] = useState([]);

  useEffect(() => {
    const customerId = localStorage.getItem('AQUASENSE_SESSION_ID');
    if (!customerId) return;

    const buildSessionLog = async () => {
      try {
        let targetMeter = activeMeter;
        if (!targetMeter) {
          const meterRes = await customerApi.get(`/customers/${customerId}/meters`);
          if (meterRes.data && meterRes.data.length > 0) {
            targetMeter = meterRes.data[0].meter_id;
            setActiveMeter(targetMeter);
          } else return;
        }

        const usageRes = await customerApi.get(`/customers/${targetMeter}/usage`);
        if (usageRes.data) {
          const now = new Date();
          const newLog = {
            id: Date.now(),
            time: now.toISOString().replace('T', ' ').substring(0, 19),
            node: targetMeter,
            volume: usageRes.data.total_water_litres.toFixed(3),
            pressure: usageRes.data.avg_pressure_bar.toFixed(2),
            energy: usageRes.data.total_energy_kwh.toFixed(3)
          };
          
          setSessionLogs(prev => [newLog, ...prev].slice(0, 50)); // Store last 50 points
        }
      } catch (error) {
        console.error("Log failure:", error);
      }
    };

    buildSessionLog();
    const intervalId = setInterval(buildSessionLog, 3000);
    return () => clearInterval(intervalId);
  }, [activeMeter]);

  // Enterprise Feature: CSV Export Logic
  const handleExportCSV = () => {
    if (sessionLogs.length === 0) return;
    
    const headers = ['TIMESTAMP', 'NODE_ID', 'VOLUME_LITRES', 'PRESSURE_BAR', 'ENERGY_KWH'];
    const csvContent = [
      headers.join(','),
      ...sessionLogs.map(log => `${log.time},${log.node},${log.volume},${log.pressure},${log.energy}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `AQUASENSE_AUDIT_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', letterSpacing: '2px' }}>AUDIT REPORTS // RAW TELEMETRY</h2>
          <p style={{ margin: '10px 0 0 0', color: theme.textMuted, fontSize: '0.85rem', fontFamily: theme.fontMono }}>
            LOCAL SESSION LOG | DATA MAX: 50 ROWS
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          style={{ padding: '12px 24px', backgroundColor: theme.text, color: theme.bg, border: 'none', fontFamily: theme.fontMono, fontSize: '0.8rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Download size={16} />
          EXPORT CSV
        </button>
      </div>

      {/* Data Grid */}
      <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1.5fr', padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.75rem', letterSpacing: '1.5px' }}>
          <div>TIMESTAMP</div>
          <div>NODE_ID</div>
          <div>VOLUME (L)</div>
          <div>PRESSURE (BAR)</div>
          <div>ENERGY (kWh)</div>
        </div>
        
        <div style={{ height: '500px', overflowY: 'auto' }}>
          {sessionLogs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.textMuted, fontFamily: theme.fontMono }}>
              <Database size={30} style={{ marginBottom: '15px', opacity: 0.5 }} />
              [ AWAITING DATA STREAM ]
            </div>
          ) : (
            sessionLogs.map((log) => (
              <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1.5fr', padding: '12px 20px', borderBottom: `1px solid #1A1A1A`, fontFamily: theme.fontMono, fontSize: '0.85rem', color: theme.text }}>
                <div style={{ color: theme.textMuted }}>{log.time}</div>
                <div>{log.node}</div>
                <div>{log.volume}</div>
                <div>{log.pressure}</div>
                <div>{log.energy}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}