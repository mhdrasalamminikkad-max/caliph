# Real-time Sync Setup

## ✅ Real-time Sync Enabled!

Your app now supports **real-time synchronization** between multiple users/devices!

## How It Works

1. **Backend WebSocket Server**: Broadcasts changes to all connected clients
2. **Frontend WebSocket Client**: Listens for updates and refreshes the UI automatically
3. **Instant Updates**: When user A marks attendance, user B sees it immediately!

## Features

✅ **Real-time Attendance**: Mark attendance on one device, see it on all devices instantly  
✅ **Real-time Classes**: Create/edit classes, see changes everywhere  
✅ **Real-time Students**: Add/edit students, syncs to all devices  
✅ **Auto-reconnect**: Automatically reconnects if connection is lost  
✅ **Offline Fallback**: Falls back to LocalStorage if backend is unavailable  

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

The `ws` package is already included in `backend/package.json`.

### 2. Start Backend
```bash
cd backend
npm start
```

You should see:
```
🚀 Backend server running on http://localhost:5000
📡 WebSocket server running on ws://localhost:5000
```

### 3. Start Frontend
```bash
npm start
```

The frontend will automatically connect to the WebSocket server.

## Testing Real-time Sync

### Test with Multiple Browsers/Devices

1. **Open the app in Browser A** (e.g., Chrome)
2. **Open the app in Browser B** (e.g., Firefox) or on a different device
3. **In Browser A**: Mark attendance for a student
4. **In Browser B**: You should see the attendance update **instantly** without refreshing!

### Check Console Logs

- **Backend**: Look for `✅ Client connected (X total)` when clients connect
- **Frontend**: Look for `✅ WebSocket connected` when connection is established
- **Frontend**: Look for `🔄 Attendance updated - refreshing UI` when updates are received

## How It Works Technically

### Backend (`backend/server.js`)
- Uses `ws` (WebSocket) library
- Maintains a list of connected clients
- Broadcasts messages when data changes (create/update/delete)
- Message types: `attendance_updated`, `class_updated`, `student_updated`, etc.

### Frontend (`client/src/lib/websocketClient.ts`)
- Connects to WebSocket server on app load
- Listens for messages from backend
- Invalidates React Query cache when updates are received
- Automatically refreshes UI when data changes
- Auto-reconnects if connection is lost

## Message Types

The backend sends these message types:

- `connected` - Initial connection confirmation
- `attendance_updated` - Attendance record created/updated
- `attendance_deleted` - Attendance record deleted
- `class_updated` - Class created/updated
- `class_deleted` - Class deleted
- `student_updated` - Student created/updated
- `student_deleted` - Student deleted

## Troubleshooting

### WebSocket won't connect
- Make sure backend is running on port 5000
- Check browser console for WebSocket errors
- Check that firewall/antivirus isn't blocking WebSocket connections

### Updates not syncing
- Check browser console for WebSocket messages
- Verify backend console shows clients connected
- Check that both devices are on the same network (for local testing)
- Try refreshing the page to reconnect

### Connection keeps dropping
- Check network stability
- Check backend logs for errors
- WebSocket will auto-reconnect up to 10 times
- Check browser console for reconnection messages

## Production Deployment

For production, you may need to:
1. Use a WebSocket proxy (nginx, Cloudflare, etc.)
2. Handle WebSocket connections through a load balancer
3. Use a dedicated WebSocket service (Socket.io, Pusher, etc.)
4. Add authentication to WebSocket connections
5. Handle WebSocket scaling (Redis pub/sub, etc.)

## Configuration

### Change WebSocket URL

In `client/src/lib/websocketClient.ts`:
```typescript
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
```

Set environment variable:
```bash
VITE_WS_URL=wss://your-domain.com
```

### Change Reconnection Settings

In `client/src/lib/websocketClient.ts`:
```typescript
const MAX_RECONNECT_ATTEMPTS = 10; // Change as needed
const RECONNECT_DELAY = 3000; // 3 seconds
```

## Benefits

✅ **No Manual Refresh**: Data updates automatically  
✅ **Multi-user Support**: Multiple teachers can mark attendance simultaneously  
✅ **Consistent Data**: All devices show the same data  
✅ **Better UX**: Instant feedback when changes are made  
✅ **Offline Support**: Falls back to LocalStorage if backend is unavailable  


