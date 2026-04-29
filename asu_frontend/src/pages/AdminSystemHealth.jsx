// src/pages/AdminSystemHealth.jsx
import React, { useState, useEffect } from 'react';
import { Server, Activity, AlertTriangle, CheckCircle, Clock, Database, Globe, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { adminApi } from '../services/api';
import MetricCard from '../components/MetricCard';
import { theme } from '../theme';

export default function AdminSystemHealth() {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // States
  const [serviceMatrix, setServiceMatrix] = useState([]);
  const [latencyStream, setLatencyStream] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [globalMetrics, setGlobalMetrics] = useState({ avgLatency: 0, criticalServices: 0 });

  useEffect(() => {
    const pollSystemHealth = async () => {
      try {
        const res = await adminApi.get('/health-metrics');
        
        if (res.data && res.data.length > 0) {
          const rawData = res.data;
          
          // 1. Group by Service to find the LATEST status of each microservice
          const latestServices = {};
          rawData.forEach(log => {
            if (!latestServices[log.service_name] || new Date(log.last_checked) > new Date(latestServices[log.service_name].last_checked)) {
              latestServices[log.service_name] = log;
            }
          });
          
          const serviceArray = Object.values(latestServices);
          setServiceMatrix(serviceArray);

          // 2. Calculate Global KPIs
          const criticalCount = serviceArray.filter(s => s.status !== 'up').length;
          const avgLat = serviceArray.reduce((acc, curr) => acc + (curr.response_time_ms || 0), 0) / (serviceArray.length || 1);
          setGlobalMetrics({ avgLatency: avgLat, criticalServices: criticalCount });

          // 3. Extract Error Logs (Any log where status isn't 'up' or has an error message)
          const errors = rawData.filter(log => log.status !== 'up' || log.error_message).slice(0, 15);
          setSystemLogs(errors);

          // 4. Time Stream for the Chart
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          setLastUpdated(timeStr);
          
          setLatencyStream(prev => {
            const newData = [...prev, { time: timeStr, latency: avgLat }];
            if (newData.length > 20) newData.shift();
            return newData;
          });
        }
      } catch (err) {
        console.error("Health polling failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    pollSystemHealth();
    const intervalId = setInterval(pollSystemHealth, 3000); // 3-second sweep
    return () => clearInterval(intervalId);
  }, []);

  const getServiceIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('database') || n.includes('mysql')) return <Database size={20} />;
    if (n.includes('api') || n.includes('gateway')) return <Globe size={20} />;
    if (n.includes('hardware') || n.includes('mqtt')) return <Cpu size={20} />;
    return <Server size={20} />;
  };

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fontMono, color: theme.textMuted }}>
        <Activity size={24} style={{ marginRight: '10px' }} /> RUNNING SYSTEM DIAGNOSTICS...
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', height: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', color: theme.text, letterSpacing: '2px' }}>SYSTEM HEALTH</h2>
          <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontFamily: theme.fontMono, marginTop: '10px' }}>
            MICROSERVICE TOPOLOGY & LATENCY DIAGNOSTICS
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontFamily: theme.fontMono, fontSize: '0.75rem', color: theme.textMuted }}>
          <Clock size={14} /> LAST SWEEP: {lastUpdated}
        </div>
      </div>

      {/* TOP KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <MetricCard title="MONITORED SERVICES" value={serviceMatrix.length} unit="NODES" icon={<Server size={20} />} />
        <MetricCard title="CRITICAL FAILURES" value={globalMetrics.criticalServices} unit="SERVICES" icon={<AlertTriangle size={20} color={globalMetrics.criticalServices > 0 ? theme.alert : theme.textMuted} />} />
        <MetricCard title="GLOBAL AVG LATENCY" value={globalMetrics.avgLatency.toFixed(0)} unit="MS" icon={<Activity size={20} />} />
      </div>

      {/* MIDDLE ROW: Service Matrix */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted, fontFamily: theme.fontMono }}>MICROSERVICE TOPOLOGY</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          
          {serviceMatrix.length === 0 ? (
            <div style={{ color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.8rem', padding: '20px', border: `1px dashed ${theme.border}` }}>
              [ NO SERVICES REPORTING TO HEALTH GATEWAY ]
            </div>
          ) : (
            serviceMatrix.map((service, idx) => (
              <div key={idx} style={{ backgroundColor: '#0A0A0A', border: `1px solid ${service.status === 'up' ? theme.border : theme.alert}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}>
                    {getServiceIcon(service.service_name)}
                    <span style={{ fontFamily: theme.fontMono, fontSize: '0.85rem', letterSpacing: '1px' }}>{service.service_name.toUpperCase()}</span>
                  </div>
                  {service.status === 'up' ? (
                    <CheckCircle size={18} color="#10B981" />
                  ) : (
                    <AlertTriangle size={18} color={theme.alert} />
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: theme.fontMono }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: theme.textMuted, letterSpacing: '1px', marginBottom: '4px' }}>STATUS</div>
                    <div style={{ fontSize: '0.8rem', color: service.status === 'up' ? '#10B981' : theme.alert, fontWeight: 'bold' }}>{service.status.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: theme.textMuted, letterSpacing: '1px', marginBottom: '4px' }}>LATENCY</div>
                    <div style={{ fontSize: '0.8rem', color: service.response_time_ms > 500 ? theme.alert : theme.text }}>{service.response_time_ms} ms</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BOTTOM ROW: Latency Chart & Error Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
        
        {/* Global Latency Chart */}
        <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '25px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted, fontFamily: theme.fontMono }}>GLOBAL LATENCY RADAR</h3>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            {latencyStream.length < 2 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.75rem' }}>[ GATHERING PING DATA... ]</div>
            ) : (
              <ResponsiveContainer>
                <AreaChart data={latencyStream}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.chartHighlight || '#A855F7'} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={theme.chartHighlight || '#A855F7'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dy={10} />
                  <YAxis domain={[0, dataMax => Math.max(dataMax, 100)]} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: `1px solid ${theme.border}`, borderRadius: 0, fontFamily: theme.fontMono }} itemStyle={{ color: theme.text }} />
                  <ReferenceLine y={500} stroke={theme.alert} strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'DEGRADED THRESHOLD', fill: theme.alert, fontSize: 9, fontFamily: theme.fontMono }} />
                  <Area type="monotone" dataKey="latency" stroke={theme.chartHighlight || '#A855F7'} fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* System Incident Terminal */}
        <div style={{ backgroundColor: '#000', border: `1px solid ${theme.alert}`, padding: '25px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', letterSpacing: '2px', color: theme.alert, fontFamily: theme.fontMono, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={14} /> SYSTEM EXCEPTIONS
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: theme.fontMono, fontSize: '0.75rem' }}>
            {systemLogs.length === 0 ? (
              <div style={{ color: '#10B981', textAlign: 'center', marginTop: '20px' }}>[ NO SYSTEM EXCEPTIONS DETECTED ]</div>
            ) : (
              systemLogs.map((log, i) => (
                <div key={i} style={{ borderBottom: '1px dashed #330000', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted, marginBottom: '5px' }}>
                    <span>{new Date(log.last_checked).toLocaleTimeString()}</span>
                    <span>{log.service_name}</span>
                  </div>
                  <div style={{ color: theme.alert, wordWrap: 'break-word' }}>
                    {log.error_message || `Service entered [${log.status}] state.`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}