import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { log } from './vite';

let wss: WebSocketServer;
const clients = new Set<WebSocket>();

export function setupWebSocket(server: Server): void {
  wss = new WebSocketServer({ 
    server,
    path: '/api/ws'
  });

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    log(`📡 Client connected (${clients.size} total)`);

    // Send welcome message
    ws.send(JSON.stringify({ type: 'connected' }));

    ws.on('close', () => {
      clients.delete(ws);
      log(`📡 Client disconnected (${clients.size} remaining)`);
    });

    ws.on('error', (error) => {
      log(`❌ WebSocket error: ${error.message}`);
    });
  });
}

export function broadcastMessage(message: any): void {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Message types for broadcasting
export function broadcastAttendanceUpdate(data: any): void {
  broadcastMessage({
    type: 'attendance_updated',
    data
  });
}

export function broadcastAttendanceDelete(id: string): void {
  broadcastMessage({
    type: 'attendance_deleted',
    data: { id }
  });
}

export function broadcastClassUpdate(data: any): void {
  broadcastMessage({
    type: 'class_updated',
    data
  });
}

export function broadcastClassDelete(id: string): void {
  broadcastMessage({
    type: 'class_deleted',
    data: { id }
  });
}

export function broadcastStudentUpdate(data: any): void {
  broadcastMessage({
    type: 'student_updated',
    data
  });
}

export function broadcastStudentDelete(id: string): void {
  broadcastMessage({
    type: 'student_deleted',
    data: { id }
  });
}