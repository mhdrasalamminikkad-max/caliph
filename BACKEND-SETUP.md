# Backend Setup Instructions

## Overview
This app now uses a simple Node.js backend with Express that stores all data in a JSON file (`backend/data.json`). No Firebase, no Supabase, no Appwrite - 100% independent!

## Quick Start

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
npm start
```

The backend will run on `http://localhost:5000`

### 3. Start the Frontend
In a separate terminal:
```bash
npm start
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## Backend API Endpoints

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create a class
  ```json
  { "id": "abc123", "name": "Class Name" }
  ```
- `DELETE /api/classes/:id` - Delete a class

### Students
- `GET /api/students` - Get all students
- `GET /api/students/class/:className` - Get students by class
- `POST /api/students` - Create a student
  ```json
  { "id": "abc123", "name": "Student Name", "className": "Class Name", "rollNumber": "1" }
  ```
- `DELETE /api/students/:id` - Delete a student

### Attendance
- `GET /api/attendance` - Get all attendance records
  - Query params: `?date=2024-01-01&className=Class Name&prayer=Fajr&studentId=abc123`
- `POST /api/attendance` - Save attendance record
  ```json
  {
    "id": "abc123",
    "studentId": "student123",
    "studentName": "Student Name",
    "className": "Class Name",
    "prayer": "Fajr",
    "date": "2024-01-01",
    "status": "present",
    "reason": null,
    "timestamp": "2024-01-01T10:00:00Z"
  }
  ```
- `DELETE /api/attendance/:id` - Delete attendance record

### Summary
- `GET /api/summary` - Get attendance summary
  - Query params: `?date=2024-01-01&className=Class Name`

## Data Storage

All data is stored in `backend/data.json` with this structure:

```json
{
  "classes": [],
  "students": [],
  "attendance": []
}
```

## Features

- ✅ Works 100% offline (falls back to LocalStorage if backend unavailable)
- ✅ No external dependencies (Firebase, Supabase, Appwrite)
- ✅ Simple JSON file storage
- ✅ Easy to backup (just copy `data.json`)
- ✅ Easy to migrate (just edit `data.json`)

## Troubleshooting

### Backend won't start
- Make sure port 5000 is not in use
- Check that `backend/package.json` has all dependencies installed
- Run `npm install` in the `backend` directory

### Frontend can't connect to backend
- Make sure backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Frontend will automatically fall back to LocalStorage if backend is unavailable

### Data not persisting
- Check that `backend/data.json` exists and is writable
- Check backend console for errors
- Make sure backend has write permissions in the `backend` directory

## Development

### Run Backend in Watch Mode
```bash
cd backend
npm run dev
```

This will automatically restart the server when you make changes.

### View Data
You can view/edit the data file directly:
```bash
cat backend/data.json
```

Or open it in your editor to manually edit the data.


