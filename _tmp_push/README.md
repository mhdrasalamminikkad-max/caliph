# 🕌 Caliph Attendance - Islamic School Attendance Management System

A beautiful, modern attendance tracking system for Islamic schools to manage prayer attendance across multiple classes.

## ✨ Features

- 📱 **Mobile-Friendly** - Works perfectly on phones, tablets, and desktops
- 🎨 **Modern UI** - Pitch.com-inspired glassmorphism design with Islamic theme
- 🕌 **Prayer Tracking** - Track attendance for all 5 daily prayers
- 📊 **Reports** - Daily, weekly, monthly, and custom date range reports
- 📥 **PDF Export** - Download comprehensive attendance reports
- 👥 **Multi-Class** - Manage multiple classes and students
- 💾 **Auto-Save** - All data automatically saved with backup protection
- 🔐 **Secure Login** - Simple authentication system
- 🌙 **Islamic Design** - Mosque background pattern and green color scheme
- 📴 **Offline-First** - NEW! Works without internet, syncs when online
- ☁️ **Cloud Backup** - Automatic sync to Firebase Firestore
- 🌱 **Pre-populated Data** - NEW! Deploy with classes and students already loaded

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5000

**Default Login:**
- Username: `user`
- Password: `caliph786`

### 🌱 Pre-populate Classes & Students (Optional but Recommended!)

Want teachers to have classes and students ready when they first open the app? Edit this file:

**`client/src/lib/seedData.ts`**

```typescript
export const DEFAULT_CLASSES = [
  {
    name: "Grade 5A",
    students: [
      { name: "Ahmed Ali", rollNumber: "1" },
      { name: "Fatima Hassan", rollNumber: "2" },
      // ... add your students here
    ]
  },
  // ... add more classes
];
```

📖 **Full Guide:** See [SEED_DATA_SETUP.md](./SEED_DATA_SETUP.md) for complete instructions

✅ **Benefits:**
- Teachers can start taking attendance immediately
- No manual data entry needed
- Perfect for distributing to multiple teachers
- Each teacher gets the same starting data

## 🌐 Deploy to Production

### ⭐ Recommended: Railway (Easiest, No Errors!)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect this repository
4. **CRITICAL:** Add Volume:
   - Mount path: `/app/data`
   - Size: 1GB
5. Deploy!

✅ **Done! Your app runs 24/7 with persistent data storage.**

### Other Options:
- **Render + Netlify** - See `DEPLOYMENT.md`
- **Vercel** - Not recommended (no persistent storage)

⚠️ **IMPORTANT:** Read `RELIABILITY-GUIDE.md` to understand data persistence!

## 📚 Documentation

- **`DEPLOYMENT.md`** - Complete deployment guide for all platforms
- **`RELIABILITY-GUIDE.md`** - How to prevent errors and data loss
- **`HYBRID-STORAGE-SETUP.md`** - Configure offline-first storage with Firebase
- **`.deployment-env`** - Environment variables template

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Radix UI Components
- TanStack React Query
- jsPDF for reports

### Backend
- Node.js + Express
- TypeScript
- File-based storage (JSON)
- Automatic backups

### Storage
- **LocalStorage** - Immediate offline storage
- **Firebase Firestore** - Cloud backup and sync
- **Backend API** - Traditional server storage
- Triple redundancy for maximum reliability

## 📊 Usage

### 1. Add Classes
- Navigate to home → Click a prayer
- Add your classes (e.g., "Grade 1", "Grade 2")

### 2. Add Students
- Select a class
- Add student names

### 3. Mark Attendance
- All students default to "Present"
- Mark "Absent" only when needed with optional reason
- Submit attendance

### 4. View Reports
- Navigate to "Summary" tab
- View daily, weekly, or monthly reports
- Search for individual students
- Download PDF reports

### 5. Class & Student Overview
- "Classes" tab shows all classes with today's attendance
- "Students" tab shows individual student statistics
- Click any student for detailed attendance history

## 🔒 Data Security & Storage

### Backend Storage
✅ **Atomic Writes** - Prevents data corruption
✅ **Automatic Backups** - Backup created before each save
✅ **Error Recovery** - Auto-restore from backup if save fails
✅ **Validation** - Data validated before processing

### Hybrid Storage (NEW!)
✅ **Offline-First** - Works without internet connection
✅ **LocalStorage** - Instant save, always available
✅ **Firebase Sync** - Automatic cloud backup
✅ **Auto-Sync** - Syncs when device comes online
✅ **Queued Sync** - Offline changes synced later

**Setup:** See `HYBRID-STORAGE-SETUP.md` for Firebase configuration

## 📱 Mobile Navigation

- **Home** - Prayer selection
- **Summary** - Attendance reports
- **Classes** - Class overview
- **Students** - Student reports

## 🎨 Design Features

- Vibrant emerald green Islamic theme
- Subtle mosque background pattern
- Glassmorphism effects (frosted glass)
- Smooth animations and transitions
- Touch-optimized for mobile
- Responsive on all screen sizes

## ⚙️ Configuration

### Environment Variables

```bash
# Frontend (Netlify only)
VITE_API_URL=https://your-backend.railway.app

# Backend
NODE_ENV=production
PORT=5000
```

## 📦 Build

```bash
# Build for production
npm run build

# Type check
npm run check
```

## 🐛 Troubleshooting

### Data not persisting?
- Check persistent disk/volume is configured
- Mount path: `/opt/render/project/src/data` (Render) or `/app/data` (Railway)

### App slow after time?
- Free tier services may spin down after inactivity
- Use UptimeRobot to keep alive (Render only)

### Errors in console?
- Clear browser cache (Ctrl+Shift+R)
- Check backend logs in deployment dashboard

## 📄 License

MIT

## 🤝 Support

Having issues? Check:
1. `RELIABILITY-GUIDE.md` - Prevent common errors
2. `DEPLOYMENT.md` - Deployment troubleshooting
3. Backend logs in your deployment platform

---

**Made with ❤️ for Islamic Schools** 🕌






