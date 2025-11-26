# Caliph Attendance - Islamic School Attendance Management System

## Overview

Caliph Attendance is a mobile-first web application designed for Islamic schools to track student prayer attendance across multiple classes. The application features a beautiful glassmorphism UI with Islamic theming, offline-first architecture, and multi-device synchronization capabilities.

**Core Purpose:** Enable teachers to quickly mark student attendance for five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) with comprehensive reporting and data persistence.

**Key Capabilities:**
- Multi-class and multi-student management
- Five-prayer daily attendance tracking
- Offline-first operation with cloud sync
- PDF report generation
- Real-time multi-device synchronization
- Pre-populated seed data for quick deployment
- Admin panel with full management and data clearing capabilities

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 26, 2025)

### Performance Optimizations - Instant Loading
- **Fixed**: Slow class/student loading replaced with LocalStorage-first approach
- **Changed**: Single bulk query loads all students at once instead of N+1 per-class queries
- **Pattern**: Read from LocalStorage instantly, background sync to backend (non-blocking)
- **Caching**: React Query staleTime set to 30s to prevent unnecessary refetches

### Edit Attendance Page Fix
- **Fixed**: Blank page when clicking "Edit Attendance" in admin panel
- **Cause**: Badge component expected capitalized status ("Present") but backend returned lowercase ("present")
- **Solution**: Case-insensitive status comparison with display normalization

## Previous Changes (November 25, 2025)

### PDF Format Update (Class Selection)
- **Modified**: PDF download button in Class Selection now shows class-grouped format
- **Format**: Class name in bold at top, followed by numbered list of absent student names
- **Features**: 
  - Groups absent students by class name (alphabetically sorted)
  - Includes absence reasons when available
  - Automatic pagination for multi-page reports
  - Clean, simple format for easy reading
- **Location**: ClassSelection component, downloadAbsentStudentsPDF function

### Bulk Student Import Feature
- **Added**: Excel bulk import functionality in admin panel
- **Features**:
  - Download Excel template with correct format
  - Optional default class selection for all students
  - File validation and preview before importing
  - Batch creation with error handling
  - Admin-only access with requireAdmin middleware
- **Components**: BulkStudentImport.tsx integrated into StudentManagement tabs
- **Endpoint**: POST /api/students/bulk (protected)

### Clear Attendance Data Feature
- **Removed**: "Clear All Storage" button from home screen to prevent accidental data loss
- **Added**: New "Clear Attendance" tab (6th tab) in admin panel
- **Functionality**: Clears only attendance records while preserving classes and students
- **Security**: Admin-only access with two-step confirmation process
- **Backend**: New protected endpoint `DELETE /api/attendance` with `requireAdmin` middleware
- **Component**: `ClearAttendanceData.tsx` in admin panel with comprehensive safety warnings

## System Architecture

### Frontend Architecture

**Framework:** React with TypeScript  
**Build Tool:** Vite  
**Styling:** Tailwind CSS with custom Islamic design tokens

**UI Component System:**
- Radix UI primitives for accessible components
- shadcn/ui component library (New York style variant)
- Custom Cairo font family for Arabic-style typography
- Glassmorphism design pattern with mosque background imagery

**State Management:**
- React hooks for local component state
- TanStack Query (@tanstack/react-query) for server state synchronization
- LocalStorage as primary client-side persistence layer

**Key Design Decisions:**
- **Mobile-first approach:** All interactions optimized for touch with 44px minimum tap targets
- **Offline-first strategy:** LocalStorage serves as primary data source with cloud sync as enhancement
- **Prayer-centric navigation:** UI flows organized around the five daily prayers rather than generic time periods

### Backend Architecture

**Runtime:** Node.js with Express  
**Storage Strategy:** Hybrid approach with multiple fallback layers

**Storage Layers (in priority order):**
1. **LocalStorage (Browser)** - Primary, instant, always available
2. **Node.js Backend API** - JSON file-based persistence (`backend/data.json`)
3. **Cloud Sync Options** - Appwrite or Firebase (configurable, optional)

**API Structure:**
- RESTful endpoints for classes, students, attendance, and summary data
- WebSocket support for real-time synchronization across devices
- Atomic file writes with backup/restore mechanisms to prevent data corruption

**Key Design Decisions:**
- **100% independent operation:** Can function entirely without external cloud services
- **Graceful degradation:** Each storage layer has fallbacks if unavailable
- **Atomic writes:** All file operations use temp files with rename to prevent corruption
- **Automatic backups:** Previous data state backed up before each write operation

### Data Storage Solutions

**Primary Storage: LocalStorage**
- Keys: `caliph_attendance_local`, `caliph_classes`, `caliph_students`, `caliph_custom_reasons`
- Benefits: Zero latency, works offline, no external dependencies
- Limitations: 5-10MB quota on mobile devices (managed via automatic cleanup)

**Secondary Storage: JSON File System**
- Location: `backend/data.json`
- Structure: Flat JSON with collections for classes, students, attendance, summary
- Reliability features:
  - Atomic writes with temp file → rename pattern
  - Automatic backup file creation before modifications
  - Validation and recovery on corrupted data

**Optional Cloud Storage:**
- **Appwrite:** NYC region endpoint, document-based collections
- **Firebase Firestore:** Collection-based with real-time listeners
- Used for: Multi-device sync, cloud backup, collaborative access
- Rate limiting handled: Exponential backoff, request batching, retry mechanisms

**Seed Data System:**
- Pre-populated classes and students defined in `client/src/lib/seedData.ts`
- Automatically loaded on first app initialization
- Enables zero-setup deployment for schools with predefined class rosters

### Authentication and Authorization

**Simple Credential System:**
- Default username: `user`
- Default password: `caliph786`
- No complex user management (designed for single-school deployment)

**Security Model:**
- For production: Firebase/Appwrite security rules allow all operations (trusted school environment)
- For development: Test mode enabled on cloud services

**Design Rationale:**
- Schools typically operate in trusted environments
- Teachers share credentials within institution
- Simplicity prioritized over complex role-based access
- Future enhancement: Per-teacher accounts if needed

### External Dependencies

**Required Frontend Libraries:**
- `react` & `react-dom` - UI framework
- `react-router-dom` - Client-side routing
- `@tanstack/react-query` - Server state management
- `react-hook-form` + `@hookform/resolvers` + `zod` - Form handling and validation
- `date-fns` - Date manipulation for prayer times and reports
- `jspdf` + `jspdf-autotable` - PDF report generation
- `lucide-react` - Icon library
- `sonner` - Toast notifications
- All `@radix-ui/*` packages - Accessible UI primitives

**Optional Cloud Services:**
- **Appwrite SDK** (`appwrite` package)
  - Endpoint: `https://nyc.cloud.appwrite.io/v1`
  - Project ID and Database ID configured via environment variables
  - Collections: classes, students, attendance, summary
  
- **Firebase** (`firebase` package - v10+)
  - Firestore for document storage
  - Real-time listeners via `onSnapshot`
  - Optional authentication module

**Backend Dependencies:**
- `express` - HTTP server framework
- `cors` - Cross-origin resource sharing
- `ws` - WebSocket server for real-time sync
- `connect-pg-simple` - Session storage (if PostgreSQL used)
- `drizzle-orm` + `@neondatabase/serverless` - ORM layer (configured but optional)

**Build and Development Tools:**
- `vite` - Frontend build tool and dev server
- `tsx` - TypeScript execution for backend
- `esbuild` - Backend bundling for production
- `tailwindcss` + `autoprefixer` + `postcss` - Styling pipeline
- `drizzle-kit` - Database schema management (if using PostgreSQL)

**Deployment Platforms:**
- Frontend: Netlify or Vercel (static SPA hosting)
- Backend: Render or Railway (Node.js hosting with persistent volumes)
- Critical requirement: Persistent disk/volume mounted at `/app/data` or `/opt/render/project/src/data`

**Environment Variables:**
- `VITE_APPWRITE_ENDPOINT` - Appwrite API endpoint (if using Appwrite)
- `VITE_APPWRITE_PROJECT_ID` - Appwrite project identifier
- `VITE_APPWRITE_DATABASE_ID` - Appwrite database identifier
- `DATABASE_URL` - PostgreSQL connection string (optional, defaults to in-memory)
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Backend server port (default: 5000)

**Critical Deployment Considerations:**
- Backend services require persistent storage volumes to prevent data loss on restarts
- Free-tier services (Render, Railway) may have cold start delays
- Rate limiting on Appwrite free tier requires exponential backoff and request batching
- Mobile browsers have stricter LocalStorage quotas requiring cleanup strategies