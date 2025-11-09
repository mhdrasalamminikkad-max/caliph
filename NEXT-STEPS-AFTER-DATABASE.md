# ✅ Next Steps After Creating Database

You've created your database! Here's what to do next:

## 📋 Quick Checklist

- [ ] **Step 1:** Copy your Database ID
- [ ] **Step 2:** Get your Project ID and API Endpoint
- [ ] **Step 3:** Create 4 Collections (classes, students, attendance, summary)
- [ ] **Step 4:** Set Permissions for each collection
- [ ] **Step 5:** Configure Environment Variables
- [ ] **Step 6:** Test the Setup

---

## Step 1: Copy Your Database ID

1. In Appwrite Console, go to **Databases**
2. Click on your database
3. **Copy the Database ID** (you'll need this for environment variables)
   - It looks like: `65a1b2c3d4e5f6g7h8i9j0`

---

## Step 2: Get Your Project Credentials

1. Go to **Settings** → **General** (in your Appwrite project)
2. Copy these values:
   - **Project ID** (e.g., `65a1b2c3d4e5f6g7h8i9j0`)
   - **API Endpoint** (usually `https://cloud.appwrite.io/v1`)
   - **Database ID** (from Step 1)

---

## Step 3: Create Collections

You need to create **4 collections** in your database. Use this quick prompt:

```
Appwrite: classes(id,name), students(id,name,rollNum,className), attendance(id,studId,studName,className,prayer,date,status,reason,timestamp), summary(id,type). String 255 except rollNum/prayer/type=50, date=10, status=20, reason=500.
```

### Collection 1: `classes`
- **Collection ID:** `classes`
- **Attributes:**
  - `id` (String, 255, Required)
  - `name` (String, 255, Required)
  - `createdAt` (DateTime, Optional)
  - `updatedAt` (DateTime, Optional)
- **Index:** `name` (key, ASC)

### Collection 2: `students`
- **Collection ID:** `students`
- **Attributes:**
  - `id` (String, 255, Required)
  - `name` (String, 255, Required)
  - `rollNumber` (String, 50, Optional)
  - `className` (String, 255, Required)
  - `updatedAt` (DateTime, Optional)
- **Indexes:** `className` (key, ASC), `name` (key, ASC)

### Collection 3: `attendance`
- **Collection ID:** `attendance`
- **Attributes:**
  - `id` (String, 255, Required)
  - `studentId` (String, 255, Required)
  - `studentName` (String, 255, Required)
  - `className` (String, 255, Required)
  - `prayer` (String, 50, Required)
  - `date` (String, 10, Required)
  - `status` (String, 20, Required)
  - `reason` (String, 500, Optional)
  - `timestamp` (String, 255, Optional)
  - `updatedAt` (DateTime, Optional)
- **Indexes:** `studentId`, `date`, `className`, `prayer` (all key, ASC)

### Collection 4: `summary` (Optional)
- **Collection ID:** `summary`
- **Attributes:**
  - `id` (String, 255, Required)
  - `type` (String, 50, Required)
  - `createdAt` (DateTime, Optional)
  - `updatedAt` (DateTime, Optional)

---

## Step 4: Set Permissions

For **each collection** (`classes`, `students`, `attendance`, `summary`):

1. Go to the collection → **Settings** → **Permissions**
2. Click "Add Permission"
3. Select:
   - **Role:** `Any` (for development)
   - **Read:** ✅ Enabled
   - **Create:** ✅ Enabled
   - **Update:** ✅ Enabled
   - **Delete:** ✅ Enabled
4. Click "Create"

⚠️ **Note:** For production, use proper authentication instead of "Any".

---

## Step 5: Configure Environment Variables

### Create `.env` file in `client` directory:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id-here
VITE_APPWRITE_DATABASE_ID=your-database-id-here
```

**Replace:**
- `your-project-id-here` with your actual Project ID
- `your-database-id-here` with your actual Database ID

---

## Step 6: Test the Setup

1. Start your app: `npm run dev`
2. Open browser console (F12)
3. You should see:
   - `✅ Appwrite initialized successfully`
   - `✅ Classes real-time sync active`
   - `✅ Students real-time sync active`

---

## 🆘 Need Help?

- See full guide: `APPWRITE-SETUP.md`
- See table structures: `APPWRITE-TABLE-PROMPT.md`
- Check troubleshooting section in `APPWRITE-SETUP.md`

---

## 📝 Quick Reference

**Collection IDs (must match exactly):**
- `classes`
- `students`
- `attendance`
- `summary`

**Important:** Collection IDs are case-sensitive!



