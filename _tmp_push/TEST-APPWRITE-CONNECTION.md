# 🧪 Test Appwrite Connection

## ✅ Environment Variables Setup Complete

Your `.env` file has been created in the `client` directory with:

```
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=690b478e002823e71ab8
VITE_APPWRITE_DATABASE_ID=690c86d2000f984f8191
```

---

## 🚀 Testing Steps

### Step 1: Restart Development Server

**IMPORTANT:** You must restart your dev server for environment variables to load!

1. Stop your current dev server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 2: Check Browser Console

1. Open your **web application** (Caliph Attendance) in the browser
   - URL: `http://localhost:5000` (or whatever port your dev server shows)
   - This is your **web app**, NOT Appwrite Console
2. Open Developer Tools (F12)
3. Go to the **Console** tab
4. Look for these messages:

**✅ Success Messages:**
```
✅ Appwrite initialized successfully
✅ Classes real-time sync active
✅ Students real-time sync active
✅ Real-time sync listener active
```

**❌ Error Messages (if something is wrong):**
```
❌ Appwrite initialization error: ...
⚠️ Appwrite unavailable - app will use LocalStorage only
```

### Step 3: Test Creating a Class

1. In your **web application** (the browser), try creating a new class
2. Check the browser console (F12) for:
   ```
   🔄 Syncing X class(es) to Appwrite: Class Name
   ✅ Synced X class(es) to Appwrite
   ```

### Step 4: Verify in Appwrite Console

1. Go to [Appwrite Console](https://cloud.appwrite.io) (this is a DIFFERENT website)
   - This is the **Appwrite admin panel**, NOT your web app
2. Login to your Appwrite account
3. Open your project
4. Go to **Databases** → Your Database → **Collections**
5. Check the `classes` collection
6. You should see your created class as a document

**Note:** 
- **Your Web App** = The Caliph Attendance website you use (browser)
- **Appwrite Console** = The admin panel to manage your database (different website)

---

## 🔍 Troubleshooting

### Issue: "Appwrite not available" error

**Possible causes:**
1. **Environment variables not loaded** - Restart dev server
2. **Wrong credentials** - Check `.env` file
3. **Network issue** - Check internet connection
4. **Collections not created** - Make sure you created all 4 collections

**Fix:**
1. Verify `.env` file exists in `client` directory
2. Check file contents match your credentials
3. Restart dev server completely
4. Clear browser cache and reload

### Issue: "Permission denied" error

**Cause:** Collections don't have proper permissions set

**Fix:**
1. Go to Appwrite Console
2. For each collection (`classes`, `students`, `attendance`, `summary`):
   - Go to **Settings** → **Permissions**
   - Add permission: Role `Any`, enable Read/Create/Update/Delete
   - Click "Create"

### Issue: "Collection not found" error

**Cause:** Collection IDs don't match exactly

**Fix:**
1. Verify collection IDs are exactly:
   - `classes` (lowercase)
   - `students` (lowercase)
   - `attendance` (lowercase)
   - `summary` (lowercase)
2. Collection IDs are case-sensitive!

### Issue: Environment variables not loading

**Fix:**
1. Make sure `.env` file is in `client` directory (not root)
2. Variables must start with `VITE_` prefix
3. Restart dev server after creating/modifying `.env`
4. Check for typos in variable names

---

## ✅ Success Checklist

- [ ] `.env` file created in `client` directory
- [ ] Environment variables have correct values
- [ ] Dev server restarted after creating `.env`
- [ ] Browser console shows "✅ Appwrite initialized successfully"
- [ ] Can create a class and see it in Appwrite Console
- [ ] Real-time sync messages appear in console

---

## 📝 Next Steps

Once connection is working:

1. **Test creating classes** - Should sync to Appwrite
2. **Test creating students** - Should sync to Appwrite
3. **Test marking attendance** - Should sync to Appwrite
4. **Test real-time sync** - Open app on another device/browser, changes should appear instantly

---

## 🆘 Still Having Issues?

1. Check the full setup guide: `APPWRITE-SETUP.md`
2. Check troubleshooting section in `APPWRITE-SETUP.md`
3. Verify all 4 collections are created with correct attributes
4. Verify permissions are set for all collections

