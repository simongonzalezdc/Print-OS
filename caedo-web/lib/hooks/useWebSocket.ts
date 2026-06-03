'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { log } from '@/lib/logger';

export function useWebSocket(clientId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:8000';
    const socket = new WebSocket(`${backendUrl}/ws/${clientId}`);

    socket.onopen = () => {
      log.info('[WebSocket] Connected');
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (error) {
        log.error('[WebSocket] Failed to parse message:', error);
      }
    };

    socket.onclose = () => {
      log.info('[WebSocket] Disconnected');
      setIsConnected(false);
      // Attempt reconnect
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    socket.onerror = (error) => {
      log.error('[WebSocket] Error:', error);
      socket.close();
    };

    socketRef.current = socket;
  }, [clientId]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      log.warn('[WebSocket] Cannot send message, socket not connected');
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
}
