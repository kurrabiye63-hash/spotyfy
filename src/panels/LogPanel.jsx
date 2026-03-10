import React from 'react';
import { useLogs } from '../context/LogContext';

const typeStyles = {
  info: { color: 'var(--text-secondary)', icon: 'ℹ️', borderLeft: '4px solid #60a5fa' },
  error: { color: '#ef4444', icon: '❌', borderLeft: '4px solid #ef4444' },
  success: { color: '#10b981', icon: '✅', borderLeft: '4px solid #10b981' },
  warning: { color: '#f59e0b', icon: '⚠️', borderLeft: '4px solid #f59e0b' },
};

export default function LogPanel() {
  const { logs, clearLogs } = useLogs();

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>Sistem Logları</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Uygulama arka plan işlemleri ve işlem geçmişi</p>
        </div>
        <button 
          onClick={clearLogs}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '10px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'var(--transition)'
          }}
        >
          🗑️ Temizle
        </button>
      </div>

      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderRadius: '16px', 
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        minHeight: '60vh',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        transition: 'var(--transition)'
      }}>
        {logs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p>Henüz herhangi bir işlem logu bulunmuyor.</p>
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            {logs.map(log => (
              <div 
                key={log.id} 
                style={{ 
                  padding: '12px 16px', 
                  marginBottom: '8px', 
                  background: 'var(--bg-primary)', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  borderLeft: typeStyles[log.type].borderLeft,
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ fontSize: '18px' }}>{typeStyles[log.type].icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: typeStyles[log.type].color }}>
                    {log.type.toUpperCase()} · <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{log.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {log.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
