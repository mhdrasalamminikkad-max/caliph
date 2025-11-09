# 🚀 Deployment Guide for Caliph Attendance

⚠️ **CRITICAL:** Read `RELIABILITY-GUIDE.md` to prevent data loss and errors!

## 🎯 QUICK START (5 minutes)

### Recommended: Railway.com ⭐⭐⭐ (EASIEST & NO ERRORS)
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repository
4. **CRITICAL:** Add Volume → Mount path: `/app/data` → Size: 1GB
5. Deploy!

✅ **Done!** Your app will run 24/7 with no data loss.

---

## Option 1: Netlify (Frontend) + Render (Backend)

### Step 1: Deploy Backend to Render

1. **Create a Render account** at https://render.com
2. **Create a new Web Service**
   - Connect your GitHub repository
   - Or use Render Dashboard:
     - Click "New +" → "Web Service"
     - Connect your repo or use manual deploy
3. **Configure the service:**
   - Name: `caliph-attendance-api`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free`
4. **Add Environment Variable:**
   - `NODE_ENV` = `production`
5. **⚠️ CRITICAL: Add Persistent Disk** (Without this, ALL DATA WILL BE LOST!):
   - Go to "Disks" tab
   - Click "Add Disk"
   - Name: `attendance-data`
   - Mount path: `/opt/render/project/src/data` (EXACT PATH!)
   - Size: 1GB (free tier)
   - Click "Create"
6. **Deploy!** - Copy your backend URL (e.g., `https://caliph-attendance-api.onrender.com`)

⚠️ **VERIFY DISK IS ATTACHED BEFORE USING THE APP!**

### Step 2: Deploy Frontend to Netlify

1. **Create a Netlify account** at https://netlify.com
2. **Connect your GitHub repository**
   - Click "Add new site" → "Import an existing project"
3. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist/public`
4. **Add Environment Variable:**
   - Go to "Site settings" → "Environment variables"
   - Add: `VITE_API_URL` = `https://your-backend-url.onrender.com` (from Step 1)
5. **Update `netlify.toml`:**
   - Replace `YOUR_BACKEND_URL` with your actual Render URL
6. **Deploy!**

---

## Option 2: Vercel (Full-Stack) - EASIER!

### Deploy Everything to Vercel

1. **Create a Vercel account** at https://vercel.com
2. **Connect your GitHub repository**
   - Click "Add New" → "Project"
   - Import your repo
3. **Configure:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
4. **Deploy!** - That's it! Vercel handles both frontend and backend

⚠️ **Note:** Vercel uses serverless functions, so your data storage might not persist. Consider using a database service like:
- MongoDB Atlas (free tier)
- Supabase (free tier)
- PlanetScale (free tier)

---

## Option 3: Railway (Full-Stack) - ALL-IN-ONE

### Deploy to Railway

1. **Create a Railway account** at https://railway.app
2. **Create new project:**
   - Click "New Project" → "Deploy from GitHub repo"
3. **Configure:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Root Directory: `/`
4. **Add Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
5. **Add Volume** (for data persistence):
   - Go to project → "Volumes"
   - Mount path: `/app/data`
6. **Deploy!** - Railway gives you a URL automatically

---

## 📋 Pre-Deployment Checklist

- [x] `netlify.toml` created
- [x] `render.yaml` created
- [x] `vercel.json` created
- [ ] Choose deployment option
- [ ] Create accounts on chosen platforms
- [ ] Push code to GitHub
- [ ] Connect repository to deployment platform
- [ ] Configure environment variables
- [ ] Deploy!

---

## 🔧 Environment Variables Needed

### For Netlify (Frontend):
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### For Render/Railway (Backend):
```
NODE_ENV=production
PORT=5000
```

---

## 🐛 Troubleshooting

### API calls failing after deployment:
- Check that `VITE_API_URL` is set correctly in Netlify
- Verify backend is running on Render/Railway
- Check CORS settings if needed

### Data not persisting:
- Make sure persistent disk/volume is configured
- Verify mount path is `/opt/render/project/src/data` (Render) or `/app/data` (Railway)

### Build fails:
- Check Node.js version (should be 20.x)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

---

## 💡 Recommendations

**Best for this app:** Railway or Render + Netlify

**Why?**
- Your app needs persistent storage for `attendance_data.json`
- Express server needs to run continuously
- Railway/Render provide free persistent storage
- Netlify is best for static frontend hosting

**Cost:** All free tier! 🎉

