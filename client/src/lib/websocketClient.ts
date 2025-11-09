/**
 * WebSocket Client for Real-time Updates
 * Listens for changes from the backend and updates React Query cache
 */

import { queryClient } from './queryClient';

// WebSocket URL - use environment variable or construct from current location
const WS_URL = import.meta.env.VITE_WS_URL || (() => {
  // In production (Replit/deployed), use the current page's protocol and host
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/ws`;
  }
  // Fallback for local development
  return 'ws://localhost:5000/api/ws';
})();
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000;

export function connectWebSocket(onConnect?: () => void, onDisconnect?: () => void): void {
  // Close existing connection if any
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      reconnectAttempts = 0;
      if (onConnect) onConnect();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('❌ WebSocket disconnected');
      if (onDisconnect) onDisconnect();
      
      // Attempt to reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔄 Reconnecting... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        setTimeout(() => {
          connectWebSocket(onConnect, onDisconnect);
        }, RECONNECT_DELAY);
      } else {
        console.error('❌ Max reconnection attempts reached');
      }
    };
  } catch (error) {
    console.error('❌ Failed to create WebSocket connection:', error);
  }
}

function handleWebSocketMessage(message: any): void {
  console.log('📡 WebSocket message received:', message.type);

  switch (message.type) {
    case 'connected':
      console.log('✅ Connected to real-time server');
      break;

    case 'attendance_updated':
    case 'attendance_deleted':
      // Invalidate attendance queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      console.log('🔄 Attendance updated - refreshing UI');
      break;

    case 'class_updated':
    case 'class_deleted':
      // Invalidate class queries
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-students'] });
      console.log('🔄 Class updated - refreshing UI');
      break;

    case 'student_updated':
    case 'student_deleted':
      // Invalidate student queries
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['class-students'] });
      console.log('🔄 Student updated - refreshing UI');
      break;

    default:
      console.log('📡 Unknown WebSocket message type:', message.type);
  }
}

export function disconnectWebSocket(): void {
  if (ws) {
    ws.close();
    ws = null;
  }
}

export function isWebSocketConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}


