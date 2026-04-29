// src/pages/AdminAuditLogs.jsx
import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, Activity, Clock } from 'lucide-react';
import { adminApi } from '../services/api';
import { theme } from '../theme';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await adminApi.get('/audit');
        if (res.data) setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
    // Refresh logs every 10 seconds
    const intervalId = setInterval(fetchLogs, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Get unique action types for the filter dropdown
  const actionTypes = ['ALL', ...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.admin_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.target_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.target_table.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fontMono, color: theme.textMuted }}>
        <Activity size={24} style={{ marginRight: '10px' }} /> DECRYPTING AUDIT LEDGER...
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', height: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER & CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', color: theme.text, letterSpacing: '2px' }}>MASTER AUDIT LOGS</h2>
          <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontFamily: theme.fontMono, marginTop: '10px' }}>
            IMMUTABLE SECURITY LEDGER
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          {/* Search */}
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color={theme.textMuted} style={{ position: 'absolute', left: '15px', top: '15px' }} />
            <input 
              type="text" 
              placeholder="QUERY TARGET OR ADMIN ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 15px 12px 45px', backgroundColor: '#000', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, fontSize: '0.8rem', outline: 'none' }}
            />
          </div>

          {/* Filter */}
          <div style={{ position: 'relative' }}>
            <Filter size={16} color={theme.textMuted} style={{ position: 'absolute', left: '15px', top: '15px' }} />
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{ appearance: 'none', width: '200px', boxSizing: 'border-box', padding: '12px 15px 12px 45px', backgroundColor: '#000', border: `1px solid ${theme.border}`, color: theme.chartHighlight || '#A855F7', fontFamily: theme.fontMono, fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
            >
              {actionTypes.map(action => <option key={action} value={action}>{action}</option>)}
            </select>
          </div>

          {/* Export */}
          <button style={{ padding: '0 20px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, fontSize: '0.8rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.text; e.currentTarget.style.color = '#000'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.text; }}>
            <Download size={16} /> EXPORT CSV
          </button>
        </div>
      </div>

      {/* LEDGER DATAGRID */}
      <div style={{ backgroundColor: '#000', border: `1px solid ${theme.border}`, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        
        {/* Header Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 2fr 1.5fr', padding: '20px', borderBottom: `1px dashed ${theme.alert}`, fontFamily: theme.fontMono, fontSize: '0.75rem', color: theme.alert, letterSpacing: '2px', backgroundColor: '#0A0A0A' }}>
          <div>TIMESTAMP</div>
          <div>OPERATOR (ADMIN ID)</div>
          <div>ACTION EXECUTED</div>
          <div>TARGET SYSTEM</div>
          <div>ORIGIN IP</div>
        </div>
        
        {/* Data Rows */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 0' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: theme.fontMono, color: theme.textMuted, fontSize: '0.85rem' }}>[ NO LOGS MATCH SECURE QUERY ]</div>
          ) : (
            filteredLogs.map((log, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 2fr 1.5fr', padding: '12px 20px', borderBottom: '1px dashed #1A1A1A', fontFamily: theme.fontMono, fontSize: '0.75rem', color: theme.text, alignItems: 'flex-start' }}>
                
                <div style={{ color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={12} /> {new Date(log.performed_at).toLocaleString()}
                </div>
                
                <div style={{ color: theme.text }}>{log.admin_id}</div>
                
                <div style={{ color: theme.chartHighlight || '#A855F7', wordWrap: 'break-word', paddingRight: '10px' }}>
                  [{log.action}]
                </div>
                
                <div style={{ color: theme.textMuted, wordWrap: 'break-word', paddingRight: '10px' }}>
                  {log.target_table} <span style={{ color: theme.text }}>({log.target_id})</span>
                </div>
                
                <div style={{ color: '#F59E0B' }}>{log.ip_address}</div>
                
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}