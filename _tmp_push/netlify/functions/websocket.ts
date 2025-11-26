import { Handler } from '@netlify/functions';
import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });
const clients = new Set<WebSocket>();

export const handler: Handler = async (event) => {
  // Only allow WebSocket upgrade requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!event.headers.upgrade || event.headers.upgrade.toLowerCase() !== 'websocket') {
    return { statusCode: 426, body: 'Upgrade Required' };
  }

  try {
    // Handle the WebSocket upgrade
    const ws = new WebSocket(event.headers['sec-websocket-key'] || '');
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({ type: 'connected' }));

    // Handle messages
    ws.on('message', (data: Buffer) => {
      const message = data.toString();
      // Broadcast to all other clients
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });

    // Handle client disconnect
    ws.on('close', () => {
      clients.delete(ws);
    });

    return { 
      statusCode: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': event.headers['sec-websocket-key']
      }
    };
  } catch (error) {
    console.error('WebSocket error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};