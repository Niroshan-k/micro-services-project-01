// src/pages/EnergyMetrics.jsx
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, BatteryCharging, Wind } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { customerApi } from '../services/api';
import { theme } from '../theme';

export default function EnergyMetrics() {
  const [activeMeter, setActiveMeter] = useState(null);
  
  // Real-time states
  const [currentEnergy, setCurrentEnergy] = useState(0);
  const [sessionData, setSessionData] = useState([]);

  useEffect(() => {
    const customerId = localStorage.getItem('AQUASENSE_SESSION_ID');
    if (!customerId) return;

    const fetchLiveMetrics = async () => {
      try {
        // 1. Resolve Assigned Meter
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

        // 2. Fetch Live Energy Telemetry
        const usageRes = await customerApi.get(`/customers/${targetMeter}/usage`);
        if (usageRes.data) {
          const liveEnergy = usageRes.data.total_energy_kwh;
          setCurrentEnergy(liveEnergy);

          // 3. Update Sliding Chart Window (15 Points)
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          setSessionData(prevData => {
            const newData = [...prevData, { time: timeString, energy: liveEnergy }];
            if (newData.length > 15) newData.shift();
            return newData;
          });
        }
      } catch (error) {
        console.error("Telemetry link severed:", error);
      }
    };

    fetchLiveMetrics();
    const intervalId = setInterval(fetchLiveMetrics, 3000);
    return () => clearInterval(intervalId);
  }, [activeMeter]);

  // Derived Metric: Carbon Footprint (approx 0.42 kg CO2 per kWh)
  const carbonFootprint = currentEnergy * 0.42;

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', letterSpacing: '2px' }}>ENERGY METRICS // SYSTEM DRAW</h2>
          <p style={{ margin: '10px 0 0 0', color: theme.textMuted, fontSize: '0.85rem', fontFamily: theme.fontMono }}>
            NODE: {activeMeter || 'AWAITING LINK'} | HARDWARE POWER CONSUMPTION
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sessionData.length > 0 ? '#00FF00' : theme.alert }}></div>
          <span style={{ fontSize: '0.7rem', color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: '1px' }}>
            {sessionData.length > 0 ? "RECEIVING DATA" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <MetricCard title="ACCUMULATED DRAW" value={currentEnergy.toFixed(3)} unit="kWh" icon={<Zap size={20} />} />
        <MetricCard title="SYSTEM VOLTAGE" value="12.0" unit="V" icon={<BatteryCharging size={20} />} />
        <MetricCard title="EST. CARBON EQ." value={carbonFootprint.toFixed(3)} unit="kg" icon={<Wind size={20} />} />
      </div>

      {/* Chart Panel */}
      <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', letterSpacing: '2px', color: theme.textMuted }}>REAL-TIME HARDWARE POWER DRAW</h3>
            <p style={{ fontSize: '0.8rem', color: theme.textMuted, maxWidth: '600px', lineHeight: '1.5' }}>
              This chart visualizes the cumulative micro-wattage required to maintain the physical telemetry stream. 
            </p>
          </div>
          <div style={{ padding: '8px 16px', border: `1px solid ${sessionData.length > 0 ? '#00FF00' : theme.alert}`, color: sessionData.length > 0 ? '#00FF00' : theme.alert, fontSize: '0.7rem', fontFamily: theme.fontMono, letterSpacing: '1px' }}>
            {sessionData.length > 0 ? "POWER: STABLE" : "POWER: DISCONNECTED"}
          </div>
        </div>

        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart data={sessionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.textMuted} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.textMuted} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dy={10} />
              <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 12, fontFamily: theme.fontMono }} />
              <Tooltip 
                contentStyle={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 0, fontFamily: theme.fontMono }} 
                itemStyle={{ color: theme.text }} 
              />
              <Area type="monotone" dataKey="energy" stroke={theme.textMuted} fillOpacity={1} fill="url(#colorPower)" strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}