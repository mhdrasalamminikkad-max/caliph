# Deployment Guide: Render + Netlify

This guide will help you deploy your Caliph Attendance app to:
- **Render**: Backend (Node.js + WebSocket)
- **Netlify**: Frontend (React)
- **GitHub**: Code repository

## Prerequisites

1. GitHub account
2. Render account (free tier available)
3. Netlify account (free tier available)

## Step 1: Push Code to GitHub

### 1.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: Caliph Attendance app with real-time sync"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `caliph-attendance` (or your preferred name)
3. **Don't** initialize with README, .gitignore, or license

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/caliph-attendance.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Deploy Backend to Render

### 2.1 Create Render Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository: `caliph-attendance`

### 2.2 Configure Backend Service
- **Name**: `caliph-attendance-backend`
- **Root Directory**: `backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or your preferred plan)

### 2.3 Environment Variables (Optional)
- `NODE_ENV`: `production`
- `PORT`: (Render will set this automatically)

### 2.4 Deploy
Click **"Create Web Service"**

Render will:
1. Install dependencies
2. Start your backend server
3. Provide a URL like: `https://caliph-attendance-backend.onrender.com`

### 2.5 Enable WebSocket Support
Render supports WebSockets by default, but make sure:
- Your backend uses HTTP server (already done)
- WebSocket server is on the same port (already done)

### 2.6 Get Your Backend URL
After deployment, copy your backend URL:
```
https://caliph-attendance-backend.onrender.com
```

## Step 3: Deploy Frontend to Netlify

### 3.1 Update Environment Variables
Create a `.env.production` file in the project root:

```env
VITE_API_URL=https://caliph-attendance-backend.onrender.com
VITE_WS_URL=wss://caliph-attendance-backend.onrender.com
```

**Important**: Use `wss://` (secure WebSocket) for production, not `ws://`

### 3.2 Create Netlify Site
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub
4. Select your repository: `caliph-attendance`

### 3.3 Configure Build Settings
- **Base directory**: (leave empty - root directory)
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Environment variables**:
  - `VITE_API_URL`: `https://caliph-attendance-backend.onrender.com`
  - `VITE_WS_URL`: `wss://caliph-attendance-backend.onrender.com`

### 3.4 Deploy
Click **"Deploy site"**

Netlify will:
1. Install dependencies
2. Build your React app
3. Deploy to a URL like: `https://caliph-attendance.netlify.app`

## Step 4: Update Frontend Code for Production

### 4.1 Update Backend API URL
Update `client/src/lib/backendApi.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### 4.2 Update WebSocket URL
Update `client/src/lib/websocketClient.ts`:

```typescript
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
```

These are already set up to use environment variables! ✅

## Step 5: Test Deployment

### 5.1 Test Backend
Visit: `https://caliph-attendance-backend.onrender.com/api/classes`

You should see: `[]` (empty array) or your classes data.

### 5.2 Test Frontend
Visit: `https://caliph-attendance.netlify.app`

1. Open browser console (F12)
2. Check for: `✅ WebSocket connected`
3. Test marking attendance
4. Open in another browser/tab to test real-time sync

## Step 6: Enable CORS (If Needed)

Your backend already has CORS enabled, but if you encounter issues:

In `backend/server.js`, the CORS middleware is already configured:
```javascript
app.use(cors());
```

This allows all origins. For production, you might want to restrict it:

```javascript
app.use(cors({
  origin: ['https://caliph-attendance.netlify.app', 'http://localhost:5173']
}));
```

## Troubleshooting

### Backend Issues

**Problem**: Backend won't start on Render
- **Solution**: Check Render logs for errors
- Make sure `backend/package.json` has correct `start` script
- Check that port is set correctly (Render sets `PORT` env var)

**Problem**: WebSocket not connecting
- **Solution**: 
  - Use `wss://` (secure) for production, not `ws://`
  - Check Render logs for WebSocket errors
  - Verify backend is using HTTP server (not just Express)

### Frontend Issues

**Problem**: Can't connect to backend
- **Solution**: 
  - Check `VITE_API_URL` environment variable in Netlify
  - Verify backend URL is correct
  - Check browser console for CORS errors

**Problem**: WebSocket not connecting
- **Solution**:
  - Use `wss://` for production (secure WebSocket)
  - Check `VITE_WS_URL` environment variable
  - Verify backend WebSocket server is running

**Problem**: Real-time sync not working
- **Solution**:
  - Check browser console for WebSocket connection status
  - Verify both frontend and backend are deployed
  - Test with multiple browser tabs/windows

### Common Issues

**Problem**: Environment variables not working
- **Solution**: 
  - In Netlify: Go to Site settings → Environment variables
  - Make sure variables start with `VITE_`
  - Redeploy after adding variables

**Problem**: Build fails on Netlify
- **Solution**:
  - Check build logs in Netlify dashboard
  - Verify `package.json` has correct build script
  - Check for missing dependencies

## Production Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Netlify
- [ ] Environment variables set in Netlify
- [ ] WebSocket URL uses `wss://` (secure)
- [ ] CORS configured correctly
- [ ] Tested real-time sync with multiple browsers
- [ ] Tested all features (classes, students, attendance)
- [ ] Custom domain configured (optional)

## Custom Domain (Optional)

### Netlify Custom Domain
1. Go to Netlify → Site settings → Domain management
2. Add custom domain
3. Follow DNS configuration instructions

### Render Custom Domain
1. Go to Render → Service settings → Custom domains
2. Add custom domain
3. Update DNS records as instructed

## Monitoring

### Render Monitoring
- Check Render dashboard for service health
- View logs in Render dashboard
- Set up alerts for service downtime

### Netlify Monitoring
- Check Netlify dashboard for build status
- View deploy logs
- Monitor site analytics

## Updates and Deployments

### Automatic Deployments
- **Render**: Automatically deploys on push to `main` branch
- **Netlify**: Automatically deploys on push to `main` branch

### Manual Deployments
1. Make changes to code
2. Commit and push to GitHub
3. Render and Netlify will automatically rebuild and deploy

## Cost

### Free Tier
- **Render**: Free tier available (with limitations)
- **Netlify**: Free tier available (generous limits)
- **GitHub**: Free for public repositories

### Paid Tiers (Optional)
- **Render**: Paid plans for better performance
- **Netlify**: Paid plans for more features

## Support

If you encounter issues:
1. Check Render logs
2. Check Netlify build logs
3. Check browser console
4. Review this deployment guide
5. Check Render/Netlify documentation

## Next Steps

After deployment:
1. Test all features
2. Share the app URL with users
3. Monitor performance
4. Set up backups (for `data.json`)
5. Consider adding authentication
6. Set up analytics (optional)


