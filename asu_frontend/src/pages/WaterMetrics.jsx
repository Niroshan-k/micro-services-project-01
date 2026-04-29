// src/pages/WaterMetrics.jsx
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplet, Activity, DollarSign, Gauge } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { customerApi } from '../services/api';
import { theme } from '../theme';

export default function WaterMetrics() {
  const [rate, setRate] = useState(0.04); // Cost per litre
  const [activeMeter, setActiveMeter] = useState(null);
  
  // Real-time states
  const [currentVolume, setCurrentVolume] = useState(0);
  const [currentPressure, setCurrentPressure] = useState(0);
  const [sessionData, setSessionData] = useState([]); // This will hold our live chart data

  useEffect(() => {
    const customerId = localStorage.getItem('AQUASENSE_SESSION_ID');
    if (!customerId) return;

    const fetchLiveMetrics = async () => {
      try {
        // 1. Get the assigned meter if we haven't already
        let targetMeter = activeMeter;
        if (!targetMeter) {
          const meterRes = await customerApi.get(`/customers/${customerId}/meters`);
          if (meterRes.data && meterRes.data.length > 0) {
            targetMeter = meterRes.data[0].meter_id;
            setActiveMeter(targetMeter);
          } else {
            return; // Exit if no meter
          }
        }

        // 2. Fetch the live telemetry
        const usageRes = await customerApi.get(`/customers/${targetMeter}/usage`);
        if (usageRes.data) {
          const liveLitres = usageRes.data.total_water_litres;
          const livePressure = usageRes.data.avg_pressure_bar;
          
          setCurrentVolume(liveLitres);
          setCurrentPressure(livePressure);

          // 3. Build the live chart history (Keep only the last 15 points so it slides)
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          setSessionData(prevData => {
            const newData = [...prevData, { time: timeString, volume: liveLitres }];
            if (newData.length > 15) newData.shift(); // Remove oldest point
            return newData;
          });
        }
      } catch (error) {
        console.error("Telemetry link severed:", error);
      }
    };

    // Initial fetch
    fetchLiveMetrics();

    // Poll every 3 seconds to match your python simulator
    const intervalId = setInterval(fetchLiveMetrics, 3000);
    return () => clearInterval(intervalId);
  }, [activeMeter]);

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', letterSpacing: '2px' }}>WATER METRICS // ANALYSIS</h2>
          <p style={{ margin: '10px 0 0 0', color: theme.textMuted, fontSize: '0.85rem', fontFamily: theme.fontMono }}>
            NODE: {activeMeter || 'AWAITING LINK'} | LIVE STREAM ACTIVE
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sessionData.length > 0 ? '#00FF00' : theme.alert }}></div>
          <span style={{ fontSize: '0.7rem', color: theme.textMuted, fontFamily: theme.fontMono, letterSpacing: '1px' }}>
            {sessionData.length > 0 ? "RECEIVING DATA" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Top KPIs (Now completely real data) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <MetricCard title="TOTAL ACCUMULATED VOLUME" value={currentVolume.toFixed(2)} unit="L" icon={<Droplet size={20} />} />
        <MetricCard title="CURRENT PRESSURE" value={currentPressure.toFixed(2)} unit="BAR" icon={<Gauge size={20} />} />
        <MetricCard title="ACTIVE DATA POINTS" value={sessionData.length} unit="pts" icon={<Activity size={20} />} />
      </div>

      {/* Main Grid: Chart + Context */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Live Chart Panel */}
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '30px' }}>
          <h3 style={{ margin: '0 0 30px 0', fontSize: '0.9rem', letterSpacing: '2px', color: theme.textMuted }}>REAL-TIME ACCUMULATION CURVE</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={sessionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.text} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={theme.text} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dy={10} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 12, fontFamily: theme.fontMono }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 0, fontFamily: theme.fontMono }} 
                  itemStyle={{ color: theme.text }} 
                />
                <Area type="monotone" dataKey="volume" stroke={theme.text} fillOpacity={1} fill="url(#colorLive)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Calculator Panel */}
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <DollarSign size={18} color={theme.textMuted} />
            <h3 style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '2px', color: theme.textMuted }}>LIVE BILLING CALC</h3>
          </div>
          
          <p style={{ fontSize: '0.8rem', color: theme.textMuted, lineHeight: '1.5', marginBottom: '30px' }}>
            This module calculates the exact financial cost of the current accumulated volume based on your municipal rate input.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: theme.textMuted, marginBottom: '10px', fontFamily: theme.fontMono }}>MUNICIPAL RATE (LKR / LITRE)</label>
            <input 
              type="number" 
              step="0.01"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#111', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, outline: 'none' }}
            />
          </div>

          <div style={{ marginTop: 'auto', padding: '20px', backgroundColor: '#111', borderLeft: `3px solid ${theme.text}` }}>
            <div style={{ fontSize: '0.75rem', color: theme.textMuted, fontFamily: theme.fontMono, marginBottom: '5px' }}>CURRENT LIABILITY</div>
            <div style={{ fontSize: '2rem', fontWeight: '300', fontFamily: theme.fontMono }}>
              LKR {(currentVolume * rate).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}