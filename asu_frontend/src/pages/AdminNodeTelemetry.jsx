// src/pages/AdminNodeTelemetry.jsx
import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Wifi, MapPin, Server, ShieldAlert, Settings, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { customerApi } from '../services/api';
import { theme } from '../theme';

export default function AdminNodeTelemetry() {
  const [availableNodes, setAvailableNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(true);
  
  // High-Fidelity Node Stream State
  const [nodeStream, setNodeStream] = useState([]);
  const [nodeDiagnostics, setNodeDiagnostics] = useState({
    status: 'UNKNOWN',
    latency: 0,
    uptime: '0h 0m',
    signal: 0,
    firmware: 'v0.0.0'
  });

  // 1. Discover all nodes to populate the selector
  useEffect(() => {
    const discoverNodes = async () => {
      try {
        const custRes = await customerApi.get('/customers');
        let nodes = [];
        for (let cust of custRes.data) {
          const metersRes = await customerApi.get(`/customers/${cust.customer_id}/meters`);
          if (metersRes.data) {
            nodes.push(...metersRes.data.map(m => m.meter_id));
          }
        }
        setAvailableNodes(nodes);
        if (nodes.length > 0) setSelectedNodeId(nodes[0]); // Auto-select first node
      } catch (err) {
        console.error("Node discovery failed:", err);
      } finally {
        setIsDiscovering(false);
      }
    };
    discoverNodes();
  }, []);

  // 2. High-Frequency Polling for the Selected Node
  useEffect(() => {
    if (!selectedNodeId) return;

    // Reset stream when switching nodes
    setNodeStream([]);

    const pollSelectedNode = async () => {
      try {
        const startTime = performance.now();
        const usage = await customerApi.get(`/customers/${selectedNodeId}/usage`);
        const endTime = performance.now();
        
        if (usage.data && Object.keys(usage.data).length > 0) {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          const p = usage.data.avg_pressure_bar;
          const isCritical = p < 2.5 || p > 4.5;

          // Mocking internal diagnostics for the UI based on real ping times
          setNodeDiagnostics({
            status: isCritical ? 'CRITICAL' : 'NOMINAL',
            latency: Math.round(endTime - startTime),
            uptime: `${Math.floor(Math.random() * 72) + 24}h ${Math.floor(Math.random() * 60)}m`,
            signal: Math.floor(Math.random() * 20) + 80, // 80-100%
            firmware: 'v2.4.1-rc3'
          });

          setNodeStream(prev => {
            // Calculate pseudo-flow rate from total volume for the chart
            const prevVolume = prev.length > 0 ? prev[prev.length - 1].rawVolume : usage.data.total_water_litres;
            let flowRate = Math.max(0, usage.data.total_water_litres - prevVolume);
            if (prev.length === 0) flowRate = 0;

            const newData = [...prev, { 
              time: timeStr, 
              flowRate: flowRate,
              rawVolume: usage.data.total_water_litres,
              pressure: p,
              energy: usage.data.total_energy_kwh
            }];
            if (newData.length > 20) newData.shift(); // Keep last 20 ticks for smooth scroll
            return newData;
          });
        }
      } catch (e) {
        setNodeDiagnostics(prev => ({ ...prev, status: 'OFFLINE', signal: 0 }));
      }
    };

    pollSelectedNode();
    // 2-second high-frequency poll for deep dive
    const intervalId = setInterval(pollSelectedNode, 2000); 
    return () => clearInterval(intervalId);
  }, [selectedNodeId]);

  if (isDiscovering) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fontMono, color: theme.textMuted }}>
        <Activity size={24} style={{ marginRight: '10px' }} /> INTERROGATING HARDWARE MESH...
      </div>
    );
  }

  // Custom Tooltip for dark theme
  const ChartTooltip = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#000', border: `1px solid ${theme.border}`, padding: '10px', fontFamily: theme.fontMono, fontSize: '0.75rem', color: theme.text }}>
          <div style={{ color: theme.textMuted, marginBottom: '5px' }}>T-MINUS {label}</div>
          <div style={{ color: payload[0].color }}>VALUE: {payload[0].value.toFixed(2)} {unit}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '25px', height: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER & TARGET SELECTOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', color: theme.text, letterSpacing: '2px' }}>TELEMETRY DEEP DIVE</h2>
          <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontFamily: theme.fontMono, marginTop: '10px' }}>
            ISOLATED HARDWARE DIAGNOSTICS
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontFamily: theme.fontMono, fontSize: '0.75rem', color: theme.textMuted, letterSpacing: '1px' }}>TARGET NODE:</div>
          <select 
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            style={{ padding: '12px 20px', backgroundColor: '#000', border: `1px solid ${theme.alert}`, color: theme.alert, fontFamily: theme.fontMono, fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
          >
            {availableNodes.length === 0 && <option value="">NO NODES FOUND</option>}
            {availableNodes.map(node => (
              <option key={node} value={node}>{node}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN LAYOUT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '25px', flex: 1, minHeight: 0 }}>
        
        {/* LEFT COLUMN: DIAGNOSTICS PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Node Identity Block */}
          <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <Server color={theme.textMuted} size={24} />
              <div style={{ padding: '4px 8px', backgroundColor: nodeDiagnostics.status === 'CRITICAL' ? '#330000' : '#003300', border: `1px solid ${nodeDiagnostics.status === 'CRITICAL' ? theme.alert : '#10B981'}`, color: nodeDiagnostics.status === 'CRITICAL' ? theme.alert : '#10B981', fontFamily: theme.fontMono, fontSize: '0.65rem', letterSpacing: '2px' }}>
                {nodeDiagnostics.status}
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontFamily: theme.fontMono, color: theme.text, letterSpacing: '2px', marginBottom: '5px' }}>{selectedNodeId || '---'}</div>
            <div style={{ fontSize: '0.7rem', fontFamily: theme.fontMono, color: theme.textMuted, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={12} /> DEPLOYMENT ZONE ALPHA
            </div>
          </div>

          {/* Hardware Vitals */}
          <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '25px', flex: 1 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>HARDWARE VITALS</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: theme.fontMono, fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #1A1A1A', paddingBottom: '10px' }}>
                <span style={{ color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={14} /> LATENCY</span>
                <span style={{ color: nodeDiagnostics.latency > 500 ? theme.alert : theme.text }}>{nodeDiagnostics.latency} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #1A1A1A', paddingBottom: '10px' }}>
                <span style={{ color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}><Wifi size={14} /> SIGNAL</span>
                <span style={{ color: nodeDiagnostics.signal < 50 ? theme.alert : '#10B981' }}>{nodeDiagnostics.signal}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #1A1A1A', paddingBottom: '10px' }}>
                <span style={{ color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={14} /> UPTIME</span>
                <span style={{ color: theme.text }}>{nodeDiagnostics.uptime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #1A1A1A', paddingBottom: '10px' }}>
                <span style={{ color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={14} /> FIRMWARE</span>
                <span style={{ color: theme.textMuted }}>{nodeDiagnostics.firmware}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${theme.textMuted}`, color: theme.text, fontFamily: theme.fontMono, fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer' }}>
                INITIATE REMOTE DIAGNOSTIC
              </button>
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#330000', border: `1px solid ${theme.alert}`, color: theme.alert, fontFamily: theme.fontMono, fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={14} /> FORCE REBOOT NODE
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-FREQUENCY CHARTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
          
          {/* Chart 1: Water Flow (L/s) */}
          <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '2px', color: theme.textMuted }}>NODE FLOW RATE (ΔL/2s)</h3>
              <span style={{ fontFamily: theme.fontMono, fontSize: '0.8rem', color: theme.chartHighlight || '#A855F7' }}>
                {nodeStream.length > 0 ? nodeStream[nodeStream.length - 1].flowRate.toFixed(3) : '0.000'} L
              </span>
            </div>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={nodeStream}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, dataMax => Math.max(dataMax, 0.5)]} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} width={40} />
                  <Tooltip content={<ChartTooltip unit="L" />} />
                  <Line type="stepAfter" dataKey="flowRate" stroke={theme.chartHighlight || '#A855F7'} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Pipeline Pressure (Bar) */}
          <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '2px', color: theme.textMuted }}>PIPELINE PRESSURE STRESS</h3>
              <span style={{ fontFamily: theme.fontMono, fontSize: '0.8rem', color: (nodeStream.length > 0 && (nodeStream[nodeStream.length - 1].pressure < 2.5 || nodeStream[nodeStream.length - 1].pressure > 4.5)) ? theme.alert : '#10B981' }}>
                {nodeStream.length > 0 ? nodeStream[nodeStream.length - 1].pressure.toFixed(2) : '0.00'} BAR
              </span>
            </div>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={nodeStream}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 6]} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} width={40} />
                  <ReferenceLine y={2.5} stroke={theme.alert} strokeDasharray="3 3" />
                  <ReferenceLine y={4.5} stroke={theme.alert} strokeDasharray="3 3" />
                  <Tooltip content={<ChartTooltip unit="BAR" />} />
                  <Line type="monotone" dataKey="pressure" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Energy Draw (kWh) */}
          <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '2px', color: theme.textMuted }}>ACCUMULATED ENERGY DRAW</h3>
              <span style={{ fontFamily: theme.fontMono, fontSize: '0.8rem', color: '#F59E0B' }}>
                {nodeStream.length > 0 ? nodeStream[nodeStream.length - 1].energy.toFixed(3) : '0.000'} kWh
              </span>
            </div>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={nodeStream}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} width={40} />
                  <Tooltip content={<ChartTooltip unit="kWh" />} />
                  <Line type="monotone" dataKey="energy" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}