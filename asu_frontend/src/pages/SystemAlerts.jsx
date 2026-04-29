// src/pages/SystemAlerts.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Activity } from 'lucide-react';
import { customerApi } from '../services/api';
import { theme } from '../theme';

export default function SystemAlerts() {
  const [activeMeter, setActiveMeter] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState('NOMINAL');

  useEffect(() => {
    const customerId = localStorage.getItem('AQUASENSE_SESSION_ID');
    if (!customerId) return;

    const monitorThresholds = async () => {
      try {
        let targetMeter = activeMeter;
        if (!targetMeter) {
          const meterRes = await customerApi.get(`/customers/${customerId}/meters`);
          if (meterRes.data && meterRes.data.length > 0) {
            targetMeter = meterRes.data[0].meter_id;
            setActiveMeter(targetMeter);
          } else {
            return;
          }
        }

        const usageRes = await customerApi.get(`/customers/${targetMeter}/usage`);
        if (usageRes.data) {
          const pressure = usageRes.data.avg_pressure_bar;
          const now = new Date();
          const timeStamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

          // Threshold Logic
          let newAlert = null;
          if (pressure < 2.8) {
            newAlert = { id: Date.now(), time: timeStamp, type: 'CRITICAL', msg: `SUDDEN PRESSURE DROP DETECTED: ${pressure.toFixed(2)} BAR`, node: targetMeter };
            setSystemStatus('CRITICAL WARNING');
          } else if (pressure > 3.5) {
            newAlert = { id: Date.now(), time: timeStamp, type: 'WARNING', msg: `ELEVATED PRESSURE: ${pressure.toFixed(2)} BAR`, node: targetMeter };
            setSystemStatus('ELEVATED');
          } else {
            setSystemStatus('NOMINAL');
          }

          // Append alert to top of feed if it exists
          if (newAlert) {
            setLiveAlerts(prev => [newAlert, ...prev].slice(0, 15)); // Keep last 15 alerts
          }
        }
      } catch (error) {
        console.error("Telemetry severed:", error);
      }
    };

    monitorThresholds();
    const intervalId = setInterval(monitorThresholds, 3000);
    return () => clearInterval(intervalId);
  }, [activeMeter]);

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', letterSpacing: '2px' }}>SYSTEM ALERTS // THRESHOLD MONITOR</h2>
          <p style={{ margin: '10px 0 0 0', color: theme.textMuted, fontSize: '0.85rem', fontFamily: theme.fontMono }}>
            ACTIVE EVENT STREAM | NODE: {activeMeter || 'AWAITING LINK'}
          </p>
        </div>
        <div style={{ padding: '8px 20px', backgroundColor: systemStatus === 'NOMINAL' ? 'transparent' : '#330000', border: `1px solid ${systemStatus === 'NOMINAL' ? '#00FF00' : theme.alert}`, color: systemStatus === 'NOMINAL' ? '#00FF00' : theme.alert, fontFamily: theme.fontMono, fontSize: '0.8rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {systemStatus === 'NOMINAL' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
          STATE: {systemStatus}
        </div>
      </div>

      {/* Alert Feed */}
      <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color={theme.textMuted} />
          <h3 style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '2px', color: theme.textMuted }}>LIVE ANOMALY LOG</h3>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', height: '500px', overflowY: 'auto' }}>
          {liveAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.9rem' }}>
              [ NO ANOMALIES DETECTED IN CURRENT SESSION ]
            </div>
          ) : (
            liveAlerts.map((alert) => (
              <div key={alert.id} style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr 100px', gap: '20px', padding: '15px 20px', backgroundColor: '#111', borderLeft: `3px solid ${alert.type === 'CRITICAL' ? theme.alert : '#FFB800'}`, alignItems: 'center', fontFamily: theme.fontMono, fontSize: '0.85rem' }}>
                <span style={{ color: theme.textMuted }}>[{alert.time}]</span>
                <span style={{ color: alert.type === 'CRITICAL' ? theme.alert : '#FFB800', fontWeight: 'bold' }}>{alert.type}</span>
                <span style={{ color: theme.text }}>{alert.msg}</span>
                <span style={{ color: theme.textMuted, textAlign: 'right' }}>{alert.node}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}