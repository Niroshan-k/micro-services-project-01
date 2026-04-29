// src/components/MetricCard.jsx
import React from 'react';
import { theme } from '../theme';

export default function MetricCard({ title, value, unit, icon }) {
  return (
    <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: '25px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted, marginBottom: '20px' }}>
        <span style={{ fontSize: '0.75rem', letterSpacing: '1.5px', fontFamily: theme.fontMono }}>{title}</span>
        {icon}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <span style={{ fontSize: '2.5rem', fontFamily: theme.fontMono, fontWeight: '300', color: theme.text }}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span style={{ fontSize: '1rem', color: theme.textMuted }}>{unit}</span>
      </div>
    </div>
  );
}