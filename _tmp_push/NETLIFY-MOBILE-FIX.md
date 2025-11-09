# 🔧 Netlify Mobile Error Fix Guide

## ⚠️ Common Mobile Errors After Netlify Deployment

### Issue 1: Firebase Domain Not Whitelisted (MOST COMMON)

**Error Symptoms:**
- App works on desktop but fails on mobile
- Console shows: `FirebaseError: Missing or insufficient permissions`
- Firebase operations fail silently

**Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `caliph-attendence`
3. Go to **⚙️ Project Settings** (gear icon)
4. Scroll to **"Your apps"** section
5. Click on your web app
6. Scroll to **"Authorized domains"** section
7. Click **"Add domain"**
8. Add your Netlify domain:
   - If your site is `your-site.netlify.app`, add: `your-site.netlify.app`
   - If you have a custom domain, add that too (e.g., `caliph-attend.com`)
9. Save and wait 1-2 minutes for changes to propagate

**Important:** Firebase requires explicit domain authorization for security!

---

### Issue 2: Backend API Not Configured

**Error Symptoms:**
- All API calls fail with 404 or 503
- Console shows network errors
- Data not loading

**Fix:**

1. **Update `netlify.toml`:**
   - Open `netlify.toml`
   - Replace `YOUR_BACKEND_URL` with your actual backend URL
   - Example: `https://caliph-attend-api.onrender.com`

2. **Add Environment Variable in Netlify:**
   - Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
   - Add: `VITE_API_URL` = `https://your-backend-url.onrender.com` (your backend URL)
   - Click **Save**

3. **Redeploy:**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Clear cache and deploy site**

---

### Issue 3: CORS Errors

**Error Symptoms:**
- Console shows: `CORS policy: No 'Access-Control-Allow-Origin' header`
- API requests blocked by browser

**Fix:**

1. **Update Backend (server/index.ts or server/routes.ts):**
   ```typescript
   import cors from 'cors';
   
   app.use(cors({
     origin: [
       'https://your-site.netlify.app',
       'https://your-custom-domain.com',
       'http://localhost:5000' // for development
     ],
     credentials: true
   }));
   ```

2. **Or use environment variable:**
   ```typescript
   const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000'];
   app.use(cors({ origin: allowedOrigins, credentials: true }));
   ```

---

### Issue 4: Service Worker / Cache Issues

**Error Symptoms:**
- Old version showing after updates
- Features not working after redeploy

**Fix:**

1. **Clear Browser Cache:**
   - On mobile: Chrome/Edge → Settings → Privacy → Clear browsing data
   - Select "Cached images and files"
   - Or use incognito/private mode

2. **Force Refresh:**
   - Desktop: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Mobile: Close and reopen the app

3. **Add Cache-Control Headers** (in `netlify.toml`):
   ```toml
   [[headers]]
     for = "/*"
     [headers.values]
       Cache-Control = "public, max-age=3600, must-revalidate"
   
   [[headers]]
     for = "/index.html"
     [headers.values]
       Cache-Control = "public, max-age=0, must-revalidate"
   ```

---

### Issue 5: Network Timeout / Slow Connection

**Error Symptoms:**
- App loads slowly on mobile
- Timeouts after 30-60 seconds
- Requests hanging

**Fix:**

1. **The app already handles offline mode with LocalStorage!** ✅
2. Data is saved locally first, then synced when online
3. If you see "Network error" messages, it's expected - data is still saved!

---

## ✅ Quick Checklist

After deploying to Netlify:

- [ ] **Firebase domain whitelisted** (CRITICAL - #1 cause of mobile errors)
- [ ] **Backend URL configured** in `netlify.toml` and environment variables
- [ ] **Environment variable `VITE_API_URL`** set in Netlify dashboard
- [ ] **CORS configured** on backend to allow Netlify domain
- [ ] **Site redeployed** after changes
- [ ] **Browser cache cleared** on mobile device
- [ ] **Firebase Security Rules** set (allow read/write for development)

---

## 🧪 Test Your Fix

1. **Open site on mobile** (clear cache first)
2. **Open browser console** (if possible):
   - Chrome: `chrome://inspect` → Remote devices
   - Or use desktop browser DevTools → Device toolbar
3. **Look for errors:**
   - ✅ Good: "✅ Attendance saved to LocalStorage"
   - ❌ Bad: "FirebaseError: Missing or insufficient permissions"
   - ❌ Bad: "Network error" (should still work with LocalStorage)
4. **Test offline mode:**
   - Turn off WiFi/mobile data
   - Mark attendance
   - Should see: "Attendance saved offline! Will sync when online."
   - Turn on internet
   - Should sync automatically

---

## 📞 Still Having Issues?

**Share these details:**
1. Exact error message from browser console
2. Your Netlify site URL
3. Your backend URL (if separate)
4. Mobile browser (Chrome, Safari, etc.)
5. Network status (online/offline)

The app is designed to work offline-first, so even if the backend is down, attendance should still save to LocalStorage and sync later!

