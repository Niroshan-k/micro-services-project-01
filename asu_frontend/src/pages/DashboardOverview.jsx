// src/pages/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import { Droplet, Zap, Gauge, Activity, TrendingUp, Radio } from 'lucide-react';
import { customerApi } from '../services/api';
import MetricCard from '../components/MetricCard';
import { theme } from '../theme';

const blankTelemetry = { water_usage_litres: 0.0, pressure_bar: 0.0, energy_kwh: 0.0, leakage_flag: false };

export default function DashboardOverview() {
  const [liveData, setLiveData] = useState(blankTelemetry);
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMeter, setActiveMeter] = useState(null);
  
  const [sessionData, setSessionData] = useState([]);

  useEffect(() => {
    const customerId = localStorage.getItem('AQUASENSE_SESSION_ID');
    if (!customerId) {
      setIsLoading(false);
      return;
    }

    const fetchTelemetryCascade = async () => {
      try {
        let targetMeter = activeMeter;
        if (!targetMeter) {
          const meterRes = await customerApi.get(`/customers/${customerId}/meters`);
          if (meterRes.data && meterRes.data.length > 0) {
            targetMeter = meterRes.data[0].meter_id;
            setActiveMeter(targetMeter);
          } else {
            setHasData(false);
            setIsLoading(false);
            return; 
          }
        }

        const usageRes = await customerApi.get(`/customers/${targetMeter}/usage`); 
        if (usageRes.data && Object.keys(usageRes.data).length > 0) {
          const water = usageRes.data.total_water_litres;
          const pressure = usageRes.data.avg_pressure_bar;
          const energy = usageRes.data.total_energy_kwh;
          
          setLiveData({
            water_usage_litres: water,
            pressure_bar: pressure,
            energy_kwh: energy,
            leakage_flag: pressure < 2.5 
          });
          
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          setSessionData(prev => {
            const prevWater = prev.length > 0 ? prev[prev.length - 1].water : water;
            let flowRate = Math.max(0, water - prevWater); 
            if (prev.length === 0) flowRate = 0; 

            const newData = [...prev, { time: timeStr, water, pressure, energy, flowRate }];
            if (newData.length > 15) newData.shift();
            return newData;
          });

          setHasData(true);
        } else {
          setHasData(false);
        }
      } catch (error) {
        setHasData(false); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchTelemetryCascade();
    const intervalId = setInterval(fetchTelemetryCascade, 3000);
    return () => clearInterval(intervalId);
  }, [activeMeter]);

  const pressureMax = 5.0;
  const getPressureColor = (pressure) => {
    if (pressure < 2.5) return theme.alert; 
    if (pressure <= 3.6) return '#10B981'; 
    if (pressure <= 4.2) return '#F59E0B'; 
    return theme.alert; 
  };
  
  const currentPressureColor = getPressureColor(liveData.pressure_bar);
  const pressureGaugeData = [
    { name: 'Current', value: liveData.pressure_bar },
    { name: 'Remaining', value: Math.max(0, pressureMax - liveData.pressure_bar) }
  ];
  const gaugeColors = [currentPressureColor, '#1A1A1A'];

  // UI HELPER: The Buffering Overlay
  const isBuffering = sessionData.length < 2;

  if (!isLoading && !hasData) {
    return (
      <div style={{ padding: '40px', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', border: `1px dashed ${theme.border}`, padding: '60px', backgroundColor: theme.surface }}>
          <div style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: theme.alert, borderRadius: '50%', marginBottom: '20px' }}></div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '300', letterSpacing: '2px', color: theme.text }}>AWAITING TELEMETRY</h2>
          <p style={{ color: theme.textMuted, fontSize: '0.85rem', fontFamily: theme.fontMono }}>
            METER: {activeMeter || "UNASSIGNED"} is registered but has transmitted 0 bytes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300' }}>GLOBAL DASHBOARD</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: liveData.leakage_flag ? theme.alert : '#00FF00' }}></div>
            <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontFamily: theme.fontMono }}>
              METER: {activeMeter} | SYSTEM {liveData.leakage_flag ? 'WARNING' : 'NOMINAL'}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: theme.fontMono, color: theme.textMuted, fontSize: '0.75rem' }}>
          <div>POLL RATE: 3000ms</div>
          <div>PROTOCOL: REST/JSON</div>
        </div>
      </div>

      {/* TOP KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <MetricCard title="WATER_USAGE_LITRES" value={liveData.water_usage_litres.toFixed(2)} unit="L" icon={<Droplet size={20} />} />
        <MetricCard title="PRESSURE_BAR" value={liveData.pressure_bar.toFixed(2)} unit="BAR" icon={<Gauge size={20} />} />
        <MetricCard title="ENERGY_KWH" value={liveData.energy_kwh.toFixed(3)} unit="kWh" icon={<Zap size={20} />} />
      </div>

      {/* MATRIX GRID: 3-Column Row */}
        {/* COLUMN 1: Accumulation vs Stress Trend */}
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '25px', display: 'flex', flexDirection: 'column', height: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>ACCUMULATION VS STRESS</h3>
            <TrendingUp size={16} color={theme.textMuted} /> 
          </div>
          
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isBuffering ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.75rem', letterSpacing: '2px' }}>
                <Radio size={16} /> BUFFERING STREAM...
              </div>
            ) : (
              <ResponsiveContainer>
                <ComposedChart data={sessionData}>
                  <defs>
                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.text} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={theme.text} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dy={10} />
                  <YAxis yAxisId="left" domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dx={-10} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: theme.alert, fontSize: 10, fontFamily: theme.fontMono }} dx={10} />
                  <Tooltip contentStyle={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 0, fontFamily: theme.fontMono }} itemStyle={{ color: theme.text }} />
                  <Area yAxisId="left" type="monotone" dataKey="water" stroke={theme.text} fillOpacity={1} fill="url(#colorWater)" strokeWidth={2} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="pressure" stroke={theme.alert} strokeWidth={1} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>

        {/* COLUMN 2: Pressure Stress Gauge (Loads instantly since it only needs 1 data point) */}
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '25px', display: 'flex', flexDirection: 'column', height: '350px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted, textAlign: 'center' }}>PIPE STRESS INDEX</h3>
          <div style={{ flex: 1, position: 'relative', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pressureGaugeData}
                  cx="50%"
                  cy="70%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="75%"
                  outerRadius="100%"
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {pressureGaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={gaugeColors[index % gaugeColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', bottom: '15%', left: '0', width: '100%', textAlign: 'center', fontFamily: theme.fontMono }}>
              <div style={{ fontSize: '2rem', color: currentPressureColor, transition: 'color 0.3s ease' }}>
                {liveData.pressure_bar.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>MAX LIMIT: {pressureMax.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Live Flow Rate */}
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '25px', display: 'flex', flexDirection: 'column', height: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '2px', color: theme.textMuted }}>LIVE FLOW RATE</h3>
            <Activity size={16} color={theme.chartHighlight || '#A855F7'} /> 
          </div>
          
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isBuffering ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.75rem', letterSpacing: '2px' }}>
                <Radio size={16} /> CALCULATING TICK...
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                  <Tooltip cursor={{ fill: '#1A1A1A' }} contentStyle={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 0, fontFamily: theme.fontMono }} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dy={10} />
                  <YAxis domain={[0, 1.0]} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 10, fontFamily: theme.fontMono }} dx={-10} />
                  <Bar dataKey="flowRate" minPointSize={3} isAnimationActive={false}>
                    {
                      sessionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.flowRate > 0.4 ? (theme.chartHighlight || '#A855F7') : (theme.chartBaseline || '#4C1D95')} 
                        />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}