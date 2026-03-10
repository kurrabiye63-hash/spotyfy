import React, { useState } from 'react';
import './index.css';
import DropshippingPanel from './panels/dropshipping-panel';
import MarketingPanel from './panels/marketing-panel';
import LogPanel from './panels/LogPanel';
import { LogProvider } from './context/LogContext';

const SidebarItem = ({ active, label, icon, sub, onClick, accent }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      background: active ? '#1a1a1a' : 'transparent',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s ease',
      marginBottom: '8px',
      borderLeft: active ? `4px solid ${accent}` : '4px solid transparent',
    }}
  >
    <div style={{ fontSize: '24px' }}>{icon}</div>
    <div>
      <div style={{ 
        color: active ? '#fff' : '#888', 
        fontWeight: 700, 
        fontSize: '15px',
        fontFamily: "'Syne', sans-serif"
      }}>
        {label}
      </div>
      <div style={{ color: active ? accent : '#555', fontSize: '11px', fontWeight: 600 }}>
        {sub}
      </div>
    </div>
  </button>
);

function App() {
  const [activeTab, setActiveTab] = useState('dropshipping');
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', !isDark ? 'dark' : 'light');
  };

  const panels = {
    dropshipping: {
      component: <DropshippingPanel />,
      label: 'DropPanel',
      icon: '🛍️',
      sub: 'E-TİCARET YÖNETİMİ',
      accent: '#a3e635'
    },
    marketing: {
      component: <MarketingPanel />,
      label: 'Marketing Hub',
      icon: '📣',
      sub: 'REKLAM & ANALİZ',
      accent: '#e8ff47'
    },
    logs: {
      component: <LogPanel />,
      label: 'System Logs',
      icon: '📋',
      sub: 'İŞLEM GEÇMİŞİ',
      accent: '#60a5fa'
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', transition: 'var(--transition)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        background: '#0d0d0d',
        color: '#fff',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 1000,
        borderRight: '1px solid #1a1a1a',
        transition: 'var(--transition)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', background: '#e8ff47', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚡</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', letterSpacing: '2px', color: '#fff' }}>SPOTYFY <span style={{ color: '#e8ff47' }}>BIZ</span></h1>
          </div>
          
          <button 
            onClick={toggleTheme}
            style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.3s ease'
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          <SidebarItem 
            active={activeTab === 'dropshipping'}
            label="Dropshipping"
            icon="🛍️"
            sub="DropPanel v2.0"
            accent="#a3e635"
            onClick={() => setActiveTab('dropshipping')}
          />
          <SidebarItem 
            active={activeTab === 'marketing'}
            label="Marketing"
            icon="📣"
            sub="Ads Hub"
            accent="#e8ff47"
            onClick={() => setActiveTab('marketing')}
          />
          <SidebarItem 
            active={activeTab === 'logs'}
            label="Loglar"
            icon="📋"
            sub="Sistem Geçmişi"
            accent="#60a5fa"
            onClick={() => setActiveTab('logs')}
          />
        </nav>

        <div style={{ 
          background: '#1a1a1a', 
          borderRadius: '16px', 
          padding: '16px',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>Admin User</div>
              <div style={{ fontSize: '11px', color: '#888' }}>Shopify Partner</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        marginLeft: '280px', 
        flex: 1, 
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        transition: 'var(--transition)'
      }}>
        <div className="fade-in" key={`${activeTab}-${isDark}`}>
          {panels[activeTab].component}
        </div>
      </main>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <LogProvider>
      <App />
    </LogProvider>
  );
}
