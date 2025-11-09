# Caliph Attendance - Backend Setup

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
npm start
```

The server will run on `http://localhost:5000`

### 3. Start the Frontend (in another terminal)
```bash
npm start
```

## What This Backend Does

- Stores all data in `backend/data.json`
- Provides REST API endpoints for:
  - Classes (create, read, delete)
  - Students (create, read, delete)
  - Attendance (create, read, delete)
  - Summary (read)

## Data Storage

All data is automatically saved to `backend/data.json`. You can:
- View the data: `cat backend/data.json` (or open in editor)
- Backup the data: Copy `backend/data.json` to a safe location
- Restore the data: Replace `backend/data.json` with your backup

## API Endpoints

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create a class
- `DELETE /api/classes/:id` - Delete a class

### Students
- `GET /api/students` - Get all students
- `GET /api/students/class/:className` - Get students by class
- `POST /api/students` - Create a student
- `DELETE /api/students/:id` - Delete a student

### Attendance
- `GET /api/attendance` - Get all attendance records
- `POST /api/attendance` - Save attendance record
- `DELETE /api/attendance/:id` - Delete attendance record

### Summary
- `GET /api/summary` - Get attendance summary

## Troubleshooting

### Port 5000 already in use
Change the port in `backend/server.js`:
```javascript
const PORT = 5001; // or any other available port
```

### Backend won't start
1. Make sure you're in the `backend` directory
2. Run `npm install` again
3. Check Node.js version (should be 14+)

### Data not saving
1. Check file permissions on `backend/data.json`
2. Make sure the `backend` directory is writable
3. Check the console for error messages

## Development

### Watch Mode (auto-restart on changes)
```bash
npm run dev
```

### View Logs
The server logs all requests to the console. Watch for:
- ✅ Successful operations
- ❌ Errors
- 📁 File operations

## Backup & Restore

### Backup
```bash
cp backend/data.json backend/data.json.backup
```

### Restore
```bash
cp backend/data.json.backup backend/data.json
```

## Production Deployment

For production, consider:
1. Using a process manager (PM2, systemd)
2. Setting up automatic backups
3. Using a database instead of JSON file (PostgreSQL, MySQL)
4. Adding authentication
5. Setting up HTTPS


