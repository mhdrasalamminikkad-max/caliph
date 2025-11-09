# 🔄 How to Restart Your Dev Server

## ⚠️ Why Restart is Needed

After changing the `.env` file, you **MUST** restart your dev server for the changes to take effect. Environment variables are only loaded when the server starts.

---

## 🚀 Steps to Restart

### Step 1: Stop the Current Server

1. **Find your terminal/command prompt** where the server is running
2. **Press `Ctrl + C`** to stop the server
3. Wait until it stops (you'll see the prompt again)

### Step 2: Start the Server Again

In the same terminal, run:
```bash
npm run dev
```

### Step 3: Wait for Server to Start

You should see messages like:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5000/
```

---

## ✅ After Restarting

1. **Open your browser** to `http://localhost:5000` (or whatever port it shows)
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Look for:**
   ```
   🔧 Appwrite Configuration: { endpoint: ..., projectId: ..., databaseId: ... }
   ✅ Appwrite initialized successfully
   ```

---

## 🔍 If You Don't See the Messages

### Check 1: Is the server actually running?
- Look at your terminal - do you see "ready in xxx ms"?
- Can you access the app in your browser?

### Check 2: Are environment variables loaded?
- Open browser console (F12)
- Type: `console.log(import.meta.env)`
- Look for `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_APPWRITE_DATABASE_ID`

### Check 3: Is .env file in the right place?
- The `.env` file should be in the `client` directory
- Not in the root directory
- Path: `client/.env`

---

## 🆘 Still Having Issues?

1. **Make sure you're in the right directory:**
   ```bash
   cd client
   npm run dev
   ```

2. **Or from root directory:**
   ```bash
   npm run dev
   ```

3. **Check for errors in terminal:**
   - Look for any error messages
   - Share them if you need help

---

## 📝 Quick Checklist

- [ ] Stopped server with `Ctrl + C`
- [ ] Started server with `npm run dev`
- [ ] Server shows "ready" message
- [ ] Opened browser to the app
- [ ] Opened console (F12)
- [ ] See "✅ Appwrite initialized successfully"

---

**Remember:** Every time you change the `.env` file, you need to restart the server!



