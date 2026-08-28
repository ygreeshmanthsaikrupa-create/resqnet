import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Real-time disaster data from socket
  const [initialData, setInitialData] = useState(null);
  const [lastAlert, setLastAlert] = useState(null);
  const [lastReport, setLastReport] = useState(null);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true,
      path: '/socket.io'
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    
    // Listen for initial state
    newSocket.on('initial_state', (data) => {
      setInitialData(data);
    });

    // Listen for alerts and updates
    newSocket.on('new_alert', (alert) => {
      setLastAlert(alert);
    });
    
    newSocket.on('report_updated', (report) => {
      setLastReport(report);
    });
    
    newSocket.on('new_report', (report) => {
      setLastReport(report);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, initialData, lastAlert, lastReport }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
