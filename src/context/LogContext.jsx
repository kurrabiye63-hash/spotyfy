import React, { createContext, useContext, useState, useCallback } from 'react';

const LogContext = createContext();

export const LogProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((message, type = 'info') => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type, // 'info', 'error', 'success', 'warning'
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
    
    // Also log to console for development
    if (type === 'error') console.error(`[LOG]: ${message}`);
    else console.log(`[LOG]: ${message}`);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
};
