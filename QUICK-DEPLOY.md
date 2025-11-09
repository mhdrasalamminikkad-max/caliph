# 🚀 Quick Deployment Guide

Deploy your Caliph Attendance app to **Render** (backend) and **Netlify** (frontend) in 10 minutes!

## 📋 Prerequisites
- GitHub account
- Render account (free): https://render.com
- Netlify account (free): https://netlify.com

---

## Step 1: Push Code to GitHub

```bash
# If not already done
git init
git add .
git commit -m "Ready for deployment"
git branch -M main

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/caliph-attendance.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Render ⚙️

### 2.1 Create Web Service
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub → Select your repository

### 2.2 Configure Settings
- **Name**: `caliph-attendance-backend`
- **Root Directory**: `backend` ⚠️ **IMPORTANT!**
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

### 2.3 Deploy
Click **"Create Web Service"**

### 2.4 Copy Backend URL
After deployment, copy your backend URL:
```
https://caliph-attendance-backend.onrender.com
```
**Save this URL!** You'll need it for the frontend.

---

## Step 3: Deploy Frontend to Netlify 🎨

### 3.1 Create Site
1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub → Select your repository

### 3.2 Configure Build
- **Base directory**: (leave empty)
- **Build command**: `npm run build`
- **Publish directory**: `dist/public`

### 3.3 Add Environment Variables
Click **"Show advanced"** → **"New variable"**

Add these **2 variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://caliph-attendance-backend.onrender.com` |
| `VITE_WS_URL` | `wss://caliph-attendance-backend.onrender.com` |

⚠️ **Important**: 
- Replace `caliph-attendance-backend.onrender.com` with **your actual Render URL**
- Use `wss://` (secure WebSocket) for production, not `ws://`

### 3.4 Deploy
Click **"Deploy site"**

---

## Step 4: Test Your Deployment ✅

### Test Backend
Visit: `https://your-backend.onrender.com/api/classes`

Should see: `[]` (empty array)

### Test Frontend
1. Visit your Netlify URL
2. Open browser console (F12)
3. Look for: `✅ WebSocket connected`
4. Test marking attendance
5. Open in another browser/tab to test real-time sync

---

## 🔧 Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check Render logs
- Verify `Root Directory` is set to `backend`
- Make sure `package.json` has `"start": "node server.js"`

**Problem**: WebSocket not working
- Render supports WebSockets automatically
- Check that backend uses HTTP server (already done ✅)

### Frontend Issues

**Problem**: Can't connect to backend
- Check `VITE_API_URL` in Netlify environment variables
- Verify backend URL is correct (no trailing slash)
- Check browser console for CORS errors

**Problem**: WebSocket not connecting
- Use `wss://` (secure) for production
- Check `VITE_WS_URL` in Netlify
- Verify backend is running

**Problem**: Environment variables not working
- Variables must start with `VITE_`
- Redeploy after adding variables
- Check Netlify build logs

---

## 📝 Environment Variables Summary

### Render (Backend)
- `NODE_ENV`: `production` (auto-set)
- `PORT`: (auto-set by Render)

### Netlify (Frontend)
- `VITE_API_URL`: Your Render backend URL
- `VITE_WS_URL`: Your Render backend URL with `wss://`

---

## 🎉 You're Done!

Your app is now live:
- **Backend**: `https://your-backend.onrender.com`
- **Frontend**: `https://your-site.netlify.app`

Both will auto-deploy when you push to GitHub!

---

## 🔄 Updating Your App

1. Make changes locally
2. `git add .`
3. `git commit -m "Your changes"`
4. `git push`
5. Render and Netlify will auto-deploy! 🚀

---

## 💡 Pro Tips

- **Free tier limits**: Render free tier spins down after 15 min inactivity (first request may be slow)
- **Custom domains**: Add your own domain in Render/Netlify settings
- **Monitoring**: Check Render/Netlify dashboards for logs and errors

