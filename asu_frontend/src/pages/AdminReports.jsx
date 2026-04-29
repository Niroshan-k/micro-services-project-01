// src/pages/AdminReports.jsx
import React, { useState } from 'react';
import { FileText, Download, Calendar, Users, Database, Loader } from 'lucide-react';
import { theme } from '../theme';

export default function AdminReports() {
  const [reportType, setReportType] = useState('usage_summary');
  const [timeRange, setTimeRange] = useState('last_30_days');
  const [targetEntity, setTargetEntity] = useState('all_fleet');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Mocking the time it takes a backend to compile a massive PDF/CSV report
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            alert(`[SUCCESS] Report compiled and downloaded: ${reportType}_${timeRange}.csv`);
          }, 500);
          return 100;
        }
        return prev + 15; // Jump by 15% to simulate compiling chunks
      });
    }, 300);
  };

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', height: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', color: theme.text, letterSpacing: '2px' }}>DATA EXTRACTION & REPORTING</h2>
          <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontFamily: theme.fontMono, marginTop: '10px' }}>
            COMPILE FLEET ANALYTICS AND BILLING LEDGERS
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: Report Configuration Builder */}
        <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', letterSpacing: '2px', color: theme.text, fontFamily: theme.fontMono, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={16} color={theme.textMuted} /> COMPILATION PARAMETERS
          </h3>

          {/* Param 1: Report Type */}
          <div>
            <label style={{ display: 'block', color: theme.textMuted, fontSize: '0.75rem', marginBottom: '10px', letterSpacing: '1px', fontFamily: theme.fontMono }}>1. SELECT DATA ARCHETYPE</label>
            <select 
              value={reportType} onChange={(e) => setReportType(e.target.value)}
              style={{ width: '100%', padding: '15px', backgroundColor: '#000', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, outline: 'none', cursor: 'pointer' }}
            >
              <option value="usage_summary">NETWORK USAGE SUMMARY (VOLUME & POWER)</option>
              <option value="billing_ledger">CUSTOMER BILLING LEDGER (FINANCIAL)</option>
              <option value="hardware_compliance">HARDWARE COMPLIANCE & ANOMALY LOG</option>
              <option value="raw_telemetry">RAW TELEMETRY DUMP (CSV EXPORT)</option>
            </select>
          </div>

          {/* Param 2: Time Range */}
          <div>
            <label style={{ display: 'block', color: theme.textMuted, fontSize: '0.75rem', marginBottom: '10px', letterSpacing: '1px', fontFamily: theme.fontMono }}>2. TEMPORAL RANGE</label>
            <select 
              value={timeRange} onChange={(e) => setTimeRange(e.target.value)}
              style={{ width: '100%', padding: '15px', backgroundColor: '#000', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, outline: 'none', cursor: 'pointer' }}
            >
              <option value="last_24_hours">LAST 24 HOURS (TACTICAL)</option>
              <option value="last_7_days">LAST 7 DAYS (WEEKLY)</option>
              <option value="last_30_days">LAST 30 DAYS (MONTHLY)</option>
              <option value="ytd">YEAR TO DATE (MACRO)</option>
            </select>
          </div>

          {/* Param 3: Target Entity */}
          <div>
            <label style={{ display: 'block', color: theme.textMuted, fontSize: '0.75rem', marginBottom: '10px', letterSpacing: '1px', fontFamily: theme.fontMono }}>3. TARGET ENTITY SCOPE</label>
            <select 
              value={targetEntity} onChange={(e) => setTargetEntity(e.target.value)}
              style={{ width: '100%', padding: '15px', backgroundColor: '#000', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all_fleet">GLOBAL NETWORK (ALL CUSTOMERS)</option>
              <option value="critical_only">CRITICAL/ANOMALOUS ENTITIES ONLY</option>
            </select>
          </div>

          {/* Generate Button */}
          <button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            style={{ width: '100%', padding: '20px', marginTop: '10px', backgroundColor: isGenerating ? 'transparent' : (theme.chartHighlight || '#A855F7'), border: `1px solid ${theme.chartHighlight || '#A855F7'}`, color: isGenerating ? theme.textMuted : '#000', fontFamily: theme.fontMono, fontSize: '0.9rem', letterSpacing: '2px', cursor: isGenerating ? 'wait' : 'pointer', transition: 'all 0.2s', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          >
            {isGenerating ? (
              <><Loader size={18} className="spin" /> COMILING DATA STREAM...</>
            ) : (
              <><FileText size={18} /> INITIATE REPORT GENERATION</>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: Terminal Output / Status */}
        <div style={{ backgroundColor: '#000', border: `1px solid ${theme.border}`, padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', letterSpacing: '2px', color: theme.textMuted, fontFamily: theme.fontMono, marginBottom: '20px' }}>COMPILER STATUS</h3>
          
          <div style={{ flex: 1, border: `1px dashed #1A1A1A`, padding: '20px', fontFamily: theme.fontMono, fontSize: '0.75rem', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!isGenerating && generationProgress === 0 && (
              <div>[ STANDBY ] WAITING FOR GENERATION PARAMETERS...</div>
            )}

            {isGenerating && (
              <>
                <div style={{ color: theme.text }}>[ {new Date().toLocaleTimeString()} ] INITIATING QUERY: {reportType.toUpperCase()}</div>
                <div style={{ color: theme.text }}>[ {new Date().toLocaleTimeString()} ] FILTERING BY RANGE: {timeRange.toUpperCase()}</div>
                <div style={{ color: theme.text }}>[ {new Date().toLocaleTimeString()} ] AGGREGATING SCOPE: {targetEntity.toUpperCase()}</div>
                
                {/* Progress Bar UI */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: theme.chartHighlight || '#A855F7' }}>COMPILING CACHE...</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#1A1A1A' }}>
                    <div style={{ width: `${generationProgress}%`, height: '100%', backgroundColor: theme.chartHighlight || '#A855F7', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Add a simple CSS spin animation for the loader */}
      <style>
        {`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}
      </style>
    </div>
  );
}