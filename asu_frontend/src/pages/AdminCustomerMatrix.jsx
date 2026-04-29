// src/pages/AdminCustomerMatrix.jsx
import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldAlert, Activity, ShieldCheck, ServerCrash, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Database, Zap, Gauge } from 'lucide-react';
import { customerApi } from '../services/api';
import MetricCard from '../components/MetricCard';
import { theme } from '../theme';

export default function AdminCustomerMatrix() {
  const [matrixData, setMatrixData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI State for Deep Dive
  const [expandedEntity, setExpandedEntity] = useState(null);

  const fetchOntology = async () => {
    try {
      const custRes = await customerApi.get('/customers');
      const baseCustomers = custRes.data;

      const fullMatrix = await Promise.all(baseCustomers.map(async (cust) => {
        let nodeCount = 0;
        let totalWater = 0;
        let totalEnergy = 0;
        let avgPressure = 0;
        let anomalies = 0;
        let assignedNodes = [];

        try {
          const metersRes = await customerApi.get(`/customers/${cust.customer_id}/meters`);
          assignedNodes = metersRes.data.map(m => m.meter_id);
          nodeCount = assignedNodes.length;

          for (let meterId of assignedNodes) {
            try {
              const usage = await customerApi.get(`/customers/${meterId}/usage`);
              if (usage.data && Object.keys(usage.data).length > 0) {
                totalWater += usage.data.total_water_litres;
                totalEnergy += usage.data.total_energy_kwh;
                
                const p = usage.data.avg_pressure_bar;
                avgPressure = p; // Simplification: taking last known pressure for deep dive
                
                if (p < 2.5 || p > 4.5) anomalies++;
              }
            } catch (e) { /* Node offline/unreachable */ }
          }
        } catch (e) { /* No meters assigned */ }

        const riskIndex = anomalies > 0 ? Math.min(99, anomalies * 45) : (nodeCount === 0 ? 0 : 5);

        return {
          ...cust,
          nodeCount,
          assignedNodes,
          totalWater,
          totalEnergy,
          avgPressure,
          anomalies,
          riskIndex,
          status: anomalies > 0 ? 'CRITICAL' : (nodeCount === 0 ? 'DORMANT' : 'SECURE')
        };
      }));

      setMatrixData(fullMatrix);
    } catch (error) {
      console.error("Matrix generation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOntology();
    const interval = setInterval(fetchOntology, 5000); 
    return () => clearInterval(interval);
  }, []);

  // CRUD MOCK ACTIONS (Wire these to your adminApi endpoints when ready)
  const handleDelete = (id) => {
    if(window.confirm(`[SECURITY OVERRIDE] Are you sure you want to purge Entity ${id} from the database?`)) {
      console.log(`DELETE /customers/${id}`);
      // await adminApi.delete(`/customers/${id}`);
      // fetchOntology();
    }
  };

  const handleEdit = (id) => {
    console.log(`OPEN EDIT MODAL FOR ${id}`);
  };

  const filteredData = matrixData.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAnomalies = matrixData.reduce((acc, curr) => acc + curr.anomalies, 0);
  const totalDormant = matrixData.filter(c => c.status === 'DORMANT').length;

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fontMono, color: theme.textMuted }}>
        <Activity size={24} style={{ marginRight: '10px' }} /> COMPILING ENTITY ONTOLOGY...
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER & CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300', color: theme.text, letterSpacing: '2px' }}>CUSTOMER MATRIX</h2>
          <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontFamily: theme.fontMono, marginTop: '10px' }}>
            ENTITY RESOLUTION & RISK SCORING
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color={theme.textMuted} style={{ position: 'absolute', left: '15px', top: '15px' }} />
            <input 
              type="text" 
              placeholder="QUERY ENTITY ID OR EMAIL..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 15px 12px 45px', backgroundColor: '#000', border: `1px solid ${theme.border}`, color: theme.text, fontFamily: theme.fontMono, fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          
          {/* CREATE ACTION */}
          <button 
            style={{ padding: '0 20px', backgroundColor: theme.chartHighlight || '#A855F7', border: 'none', color: '#000', fontFamily: theme.fontMono, fontSize: '0.8rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => console.log("OPEN CREATE MODAL")}
          >
            <Plus size={16} /> REGISTER ENTITY
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <MetricCard title="REGISTERED ENTITIES" value={matrixData.length} unit="USERS" icon={<Users size={20} />} />
        <MetricCard title="UNASSIGNED (DORMANT)" value={totalDormant} unit="USERS" icon={<ServerCrash size={20} color={theme.textMuted} />} />
        <MetricCard title="ENTITIES AT RISK" value={totalAnomalies} unit="CRITICAL" icon={<ShieldAlert size={20} color={theme.alert} />} />
      </div>

      {/* ENTITY DATAGRID WITH CRUD */}
      <div style={{ backgroundColor: '#0A0A0A', border: `1px solid ${theme.border}`, flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Table Header (Adjusted Columns to fit ACTIONS) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr 1fr', padding: '20px', borderBottom: `1px solid ${theme.border}`, fontFamily: theme.fontMono, fontSize: '0.75rem', color: theme.textMuted, letterSpacing: '2px' }}>
          <div>ENTITY ID</div>
          <div>DESIGNATION (EMAIL)</div>
          <div>NODES</div>
          <div>STATUS</div>
          <div>RISK INDEX</div>
          <div style={{ textAlign: 'right' }}>ACTIONS</div>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filteredData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: theme.fontMono, color: theme.textMuted, fontSize: '0.85rem' }}>[ NO ENTITIES MATCH QUERY ]</div>
          ) : (
            filteredData.map((row, i) => (
              <React.Fragment key={row.customer_id}>
                {/* Standard Row */}
                <div 
                  style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr 1fr', padding: '15px 20px', borderBottom: expandedEntity === row.customer_id ? 'none' : '1px solid #1A1A1A', fontFamily: theme.fontMono, fontSize: '0.85rem', color: theme.text, alignItems: 'center', backgroundColor: expandedEntity === row.customer_id ? '#111' : (i % 2 === 0 ? '#050505' : 'transparent'), cursor: 'pointer', transition: 'background-color 0.2s' }} 
                  onClick={() => setExpandedEntity(expandedEntity === row.customer_id ? null : row.customer_id)}
                >
                  <div style={{ color: theme.chartHighlight || '#A855F7', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {expandedEntity === row.customer_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {row.customer_id}
                  </div>
                  <div>{row.email}</div>
                  <div>{row.nodeCount}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: row.status === 'CRITICAL' ? theme.alert : row.status === 'DORMANT' ? theme.textMuted : '#10B981' }}>
                    {row.status === 'CRITICAL' ? <ShieldAlert size={14} /> : row.status === 'DORMANT' ? <ServerCrash size={14} /> : <ShieldCheck size={14} />}
                    {row.status}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '50px', height: '4px', backgroundColor: '#333', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${row.riskIndex}%`, backgroundColor: row.riskIndex > 40 ? theme.alert : '#10B981' }}></div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: row.riskIndex > 40 ? theme.alert : theme.textMuted }}>{row.riskIndex}</span>
                  </div>

                  {/* UPDATE / DELETE ACTIONS */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                    <Edit2 size={16} color={theme.textMuted} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleEdit(row.customer_id); }} />
                    <Trash2 size={16} color={theme.alert} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleDelete(row.customer_id); }} />
                  </div>
                </div>

                {/* EXPANDED TELEMETRY DEEP DIVE (READ ACTION) */}
                {expandedEntity === row.customer_id && (
                  <div style={{ backgroundColor: '#111', padding: '0 20px 20px 20px', borderBottom: '1px solid #1A1A1A' }}>
                    <div style={{ padding: '20px', border: `1px dashed ${theme.border}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                      
                      {/* Sub-Metric 1 */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <Database color={theme.textMuted} size={24} />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: theme.textMuted, letterSpacing: '1px', marginBottom: '5px' }}>SIMULATED WATER DRAW</div>
                          <div style={{ fontSize: '1.2rem', color: theme.text }}>{row.totalWater.toFixed(3)} <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>LITRES</span></div>
                        </div>
                      </div>

                      {/* Sub-Metric 2 */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <Gauge color={row.avgPressure < 2.5 || row.avgPressure > 4.5 ? theme.alert : '#10B981'} size={24} />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: theme.textMuted, letterSpacing: '1px', marginBottom: '5px' }}>PIPELINE STRESS (AVG)</div>
                          <div style={{ fontSize: '1.2rem', color: row.avgPressure < 2.5 || row.avgPressure > 4.5 ? theme.alert : '#10B981' }}>{row.avgPressure.toFixed(2)} <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>BAR</span></div>
                        </div>
                      </div>

                      {/* Sub-Metric 3 */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <Zap color={theme.textMuted} size={24} />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: theme.textMuted, letterSpacing: '1px', marginBottom: '5px' }}>ENERGY CONSUMPTION</div>
                          <div style={{ fontSize: '1.2rem', color: theme.text }}>{row.totalEnergy.toFixed(4)} <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>kWh</span></div>
                        </div>
                      </div>

                    </div>
                    
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button style={{ padding: '8px 15px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '0.7rem', letterSpacing: '1px', cursor: 'pointer' }}>
                        + ASSIGN HARDWARE NODE
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
}