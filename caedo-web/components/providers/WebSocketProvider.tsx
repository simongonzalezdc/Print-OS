'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: unknown;
  sendMessage: (message: unknown) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

function isQueueUpdate(message: unknown): message is { type: 'QUEUE_UPDATE'; job_id: string } {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    'job_id' in message &&
    message.type === 'QUEUE_UPDATE' &&
    typeof message.job_id === 'string'
  );
}

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
    if (isQueueUpdate(ws.lastMessage)) {
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
