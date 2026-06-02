'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [clientId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('caedo_client_id');
      if (stored) return stored;
      const id = nanoid();
      localStorage.setItem('caedo_client_id', id);
      return id;
    }
    return nanoid();
  });

  const ws = useWebSocket(clientId);

  useEffect(() => {
    if (ws.lastMessage?.type === 'QUEUE_UPDATE') {
      toast.info(`Queue Updated: Job ${ws.lastMessage.job_id.slice(0, 8)}`);
    }
  }, [ws.lastMessage]);

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWS() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWS must be used within a WebSocketProvider');
  }
  return context;
}
