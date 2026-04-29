// src/pages/AdminDashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { Server, Activity, ShieldAlert, Database } from 'lucide-react';
import { customerApi, adminApi } from '../services/api';
import MetricCard from '../components/MetricCard';
import { theme } from '../theme';

export default function AdminDashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Real-time Aggregated States
  const [fleetMetrics, setFleetMetrics] = useState({ totalWater: 0, totalEnergy: 0, activeNodes: 0, criticalNodes: 0 });
  const [fleetStream, setFleetStream] = useState([]);
  const [serverHealth, setServerHealth] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [nodeMatrix, setNodeMatrix] = useState([]);
  const [knownMeters, setKnownMeters] = useState([]);

  // Phase 1: Discover all hardware nodes dynamically on mount
  useEffect(() => {
    const discoverFleet = async () => {
      try {
        const custRes = await customerApi.get('/customers');
        const customers = custRes.data;
        let discoveredMeters = [];
        
        for (let cust of customers) {
          const meterRes = await customerApi.get(`/customers/${cust.customer_id}/meters`);
          if (meterRes.data && meterRes.data.length > 0) {
            discoveredMeters.push(...meterRes.data.map(m => m.meter_id));
          }
        }
        setKnownMeters(discoveredMeters);
      } catch (err) {
        console.error("Fleet discovery failed:", err);
      }
    };
    discoverFleet();
  }, []);

  // Phase 2: Live Global Polling Engine
  useEffect(() => {
    if (knownMeters.length === 0) {
      setIsLoading(false);
      return;
    }

    const pollGlobalState = async () => {
      try {
        // 1. Fetch Fleet Telemetry (Aggregate all known meters)
        let aggWater = 0;
        let aggEnergy = 0;
        let activeCount = 0;
        let criticalCount = 0;
        let matrixState = [];

        for (let meterId of knownMeters) {
          try {
            const usage = await customerApi.get(`/customers/${meterId}/usage`);
            if (usage.data && Object.keys(usage.data).length > 0) {
              aggWater += usage.data.total_water_litres;
              aggEnergy += usage.data.total_energy_kwh;
              activeCount++;
              
              const p = usage.data.avg_pressure_bar;
              const isCritical = p < 2.5 || p > 4.5;
              if (isCritical) criticalCount++;
              
              matrixState.push({ id: meterId, pressure: p, status: isCritical ? 'CRITICAL' : 'NOMINAL' });
            }
          } catch (e) {
            matrixState.push({ id: meterId, pressure: 0, status: 'OFFLINE' });
          }
        }

        setFleetMetrics({ totalWater: aggWater, totalEnergy: aggEnergy, activeNodes: activeCount, criticalNodes: criticalCount });
        setNodeMatrix(matrixState);

        // Update Sliding Window for Fleet Trend
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        setFleetStream(prev => {
          const prevVolume = prev.length > 0 ? prev[prev.length - 1].volume : aggWater;
          let fleetFlowRate = Math.max(0, aggWater - prevVolume); 
          if (prev.length === 0) fleetFlowRate = 0;

          const newData = [...prev, { time: timeStr, volume: aggWater, energy: aggEnergy, flowRate: fleetFlowRate }];
          if (newData.length > 15) newData.shift();
          return newData;
        });
        
        // 2. Fetch System Health (Admin API)
        const healthRes = await adminApi.get('/health-metrics');
        if (healthRes.data) {
          const healthData = healthRes.data.slice(0, 15).reverse().map(h => ({
            time: new Date(h.last_checked).toLocaleTimeString([], { hour12: false }),
            latency: h.response_time_ms || 0,
            status: h.status
          }));
          setServerHealth(healthData);
        }

        // 3. Fetch Recent Audit Logs (Admin API)
        const auditRes = await adminApi.get('/audit');
        if (auditRes.data) {
          setAuditLogs(auditRes.data.slice(0, 8)); 
        }

      } catch (err) {
        console.error("Global polling cycle failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    pollGlobalState();
    const intervalId = setInterval(pollGlobalState, 3000);
    return () => clearInterval(intervalId);
  }, [knownMeters]);

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fontMono, color: theme.alert }}>
        <Activity size={24} style={{ marginRight: '10px' }} /> SYNCHRONIZING FLEET DATA...
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', color: theme.text }}>GLOBAL COMMAND CENTER</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: fleetMetrics.criticalNodes > 0 ? theme.alert : '#00FF00' }}></div>
            <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontFamily: theme.fontMono }}>
              SYSTEM STATUS: {fleetMetrics.criticalNodes > 0 ? 'ANOMALY DETECTED' : 'NOMINAL'}
            </span>
          </div>
        </div>
      </div>

      {/* TOP KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <MetricCard title="ACTIVE HARDWARE NODES" value={fleetMetrics.activeNodes} unit="ONLINE" icon={<Server size={20} />} />
        <MetricCard title="CRITICAL ANOMALIES" value={fleetMetrics.criticalNodes} unit="NODES" icon={<ShieldAlert size={20} color={theme.alert} />} />
        <MetricCard title="FLEET WATER VOLUME" value={fleetMetrics.totalWater.toFixed(1)} unit="L" icon={<Database size={20} />} />
        <MetricCard title="FLEET POWER DRAW" value={fleetMetrics.totalEnergy.toFixed(2)} unit="kWh" icon={<Activity size={20} />} />
      </div>

      {/* FULL WIDTH ROW: Fleet Aggregation Chart */}
      <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '25px', height: '350px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>FLEET TELEMETRY ACCUMULATION</h3>
        <div style={{ flex: 1, width: '100%' }}>
          {fleetStream.length < 2 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.75rem' }}>[ BUFFERING FLEET STREAM... ]</div>
          ) : (
            <ResponsiveContainer>
              <ComposedChart data={fleetStream}>
                <defs>
                  <linearGradient id="colorFleetAccum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.chartHighlight || '#A855F7'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme.chartHighlight || '#A855F7'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dy={10} />
                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dx={-10} />
                <Tooltip contentStyle={{ backgroundColor: '#000', border: `1px solid ${theme.border}`, borderRadius: 0, fontFamily: theme.fontMono }} itemStyle={{ color: theme.text }} />
                <Area type="monotone" dataKey="volume" stroke={theme.chartHighlight || '#A855F7'} fillOpacity={1} fill="url(#colorFleetAccum)" strokeWidth={2} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* MIDDLE GRID ROW: Fleet Flow Rate & Server Latency */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Fleet Live Flow Rate Chart */}
        <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '25px', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>FLEET LIVE FLOW RATE</h3>
          <div style={{ flex: 1, width: '100%' }}>
            {fleetStream.length < 2 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.75rem' }}>[ BUFFERING FLEET STREAM... ]</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={fleetStream}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dy={10} />
                  
                  {/* CRITICAL FIX: Math.max forces the Y-Axis to stay open even if data is 0 */}
                  <YAxis domain={[0, dataMax => Math.max(dataMax, 1)]} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dx={-10} />
                  
                  <Tooltip cursor={{ fill: '#1A1A1A' }} contentStyle={{ backgroundColor: '#000', border: `1px solid ${theme.border}`, borderRadius: 0, fontFamily: theme.fontMono }} itemStyle={{ color: theme.text }} />
                  
                  {/* CRITICAL FIX: Simplified Bar component for reliability */}
                  <Bar dataKey="flowRate" fill={theme.chartHighlight || '#A855F7'} minPointSize={3} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: theme.textMuted, fontFamily: theme.fontMono, marginTop: '10px' }}>TOTAL NETWORK LITRES / 3 SECONDS</div>
        </div>
        
        {/* Server Latency Pulse */}
        <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '25px', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>API LATENCY PULSE</h3>
          <div style={{ flex: 1, width: '100%' }}>
            {serverHealth.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.75rem' }}>[ NO HEALTH PINGS DETECTED ]</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={serverHealth}>
                  <Tooltip cursor={{ fill: '#1A1A1A' }} contentStyle={{ backgroundColor: '#000', border: `1px solid ${theme.border}`, borderRadius: 0, fontFamily: theme.fontMono }} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} width={35} />
                  <ReferenceLine y={500} stroke={theme.alert} strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '500ms THRESHOLD', fill: theme.alert, fontSize: 9, fontFamily: theme.fontMono }} />
                  <Bar dataKey="latency" minPointSize={2} isAnimationActive={false}>
                    {serverHealth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.latency > 500 ? theme.alert : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: theme.textMuted, fontFamily: theme.fontMono, marginTop: '10px' }}>RESPONSE TIME (MS)</div>
        </div>

      </div>

      {/* BOTTOM ROW: Node Matrix & Audit Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* Node Status Matrix */}
        <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '25px', height: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>HARDWARE NODE MATRIX</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '0.65rem', fontFamily: theme.fontMono, color: theme.textMuted }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '8px', height: '8px', backgroundColor: '#10B981' }}></div> NOMINAL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '8px', height: '8px', backgroundColor: theme.alert }}></div> CRITICAL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '8px', height: '8px', backgroundColor: '#333' }}></div> OFFLINE</div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', overflowY: 'auto' }}>
            {nodeMatrix.length === 0 ? (
               <div style={{ color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.75rem' }}>[ AWAITING NODE DISCOVERY ]</div>
            ) : (
              nodeMatrix.map((node, i) => (
                <div key={i} title={`NODE: ${node.id} | PRESSURE: ${node.pressure} BAR`} style={{ width: '40px', height: '40px', backgroundColor: node.status === 'CRITICAL' ? theme.alert : node.status === 'OFFLINE' ? '#333' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fontMono, fontSize: '0.6rem', color: '#000', fontWeight: 'bold', cursor: 'help' }}>
                  {node.id.split('-')[1] || node.id}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Audit Terminal */}
        <div style={{ backgroundColor: '#000', border: `1px solid ${theme.alert}`, padding: '25px', height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', letterSpacing: '2px', color: theme.alert }}>LIVE SECURITY AUDIT FEED</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: theme.fontMono, fontSize: '0.75rem' }}>
            {auditLogs.length === 0 ? (
              <div style={{ color: theme.textMuted }}>[ NO AUDIT EVENTS LOGGED IN CURRENT SESSION ]</div>
            ) : (
              auditLogs.map((log, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 220px 1fr 90px', gap: '15px', paddingBottom: '10px', borderBottom: '1px dashed #330000', color: theme.text, alignItems: 'start' }}>
                  <span style={{ color: theme.textMuted }}>{new Date(log.performed_at).toLocaleTimeString()}</span>
                  <span style={{ color: theme.alert, wordWrap: 'break-word' }}>[{log.action}]</span>
                  <span style={{ wordWrap: 'break-word' }}>TARGET: {log.target_table} ({log.target_id})</span>
                  <span style={{ color: theme.textMuted, textAlign: 'right' }}>{log.admin_id}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}