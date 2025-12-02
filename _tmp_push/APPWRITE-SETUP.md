# 🚀 Appwrite Database Setup Guide

This guide will help you set up Appwrite for real-time multi-device sync in your Caliph Attendance app.

## Step 1: Create Appwrite Project

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up or log in
3. Click "Create Project"
4. Fill in:
   - **Name**: `caliph-attendance` (or your preferred name)
   - **Team**: Select or create a team
5. Click "Create"
6. Wait for project to be ready

## Step 2: Choose Your Database Structure

You have **two options** for organizing your data in Appwrite:

### Option A: One Database with Multiple Collections (Recommended) ✅

**Structure:**
- 1 Database: `caliph-attendance-db`
- 4 Collections: `classes`, `students`, `attendance`, `summary`

**When to use:**
- ✅ Related data that belongs together
- ✅ Same permission model for all data
- ✅ Simpler configuration
- ✅ Easier to manage
- ✅ Better for most applications

**Setup:**
1. Create **one database** (see Step 2A below)
2. Create **multiple collections** inside it (see Step 4)

---

### Option B: Multiple Databases (Advanced) 🔧

**Structure:**
- Database 1: `classes-db` → Collection: `classes`
- Database 2: `students-db` → Collection: `students`
- Database 3: `attendance-db` → Collection: `attendance`
- Database 4: `summary-db` → Collection: `summary` (optional)

**When to use:**
- ✅ Completely separate features/modules
- ✅ Different permission models per database
- ✅ Different teams managing different databases
- ✅ Need to isolate data for security/compliance
- ✅ Planning to split into separate projects later

**Setup:**
1. Create **multiple databases** (see Step 2B below)
2. Create **one collection** in each database
3. Update environment variables (see Step 7B)

---

## Step 2A: Create One Database (Option A - Recommended)

1. In your Appwrite project, go to **Databases**
2. Click "Create Database"
3. Fill in:
   - **Name**: `caliph-attendance-db` (or your preferred name)
4. Click "Create"
5. **Copy the Database ID** - you'll need this for configuration

**Continue to Step 4** to create collections in this database.

---

## Step 2B: Create Multiple Databases (Option B - Advanced)

If you want separate databases for better organization:

### Database 1: Classes

1. In your Appwrite project, go to **Databases**
2. Click "Create Database"
3. Fill in:
   - **Name**: `classes-db`
4. Click "Create"
5. **Copy the Database ID** (e.g., `classes_db_123`)

### Database 2: Students

1. Click "Create Database" again
2. Fill in:
   - **Name**: `students-db`
3. Click "Create"
4. **Copy the Database ID** (e.g., `students_db_456`)

### Database 3: Attendance

1. Click "Create Database" again
2. Fill in:
   - **Name**: `attendance-db`
3. Click "Create"
4. **Copy the Database ID** (e.g., `attendance_db_789`)

### Database 4: Summary (Optional)

1. Click "Create Database" again
2. Fill in:
   - **Name**: `summary-db`
3. Click "Create"
4. **Copy the Database ID** (e.g., `summary_db_012`)

**Note:** You'll need to update your code configuration to use multiple database IDs. See Step 7B for environment variable setup.

---

## Step 3: Get Your Credentials

1. Go to **Settings** → **General** (in your Appwrite project)
2. Copy:
   - **Project ID** (e.g., `65a1b2c3d4e5f6g7h8i9j0`)
   - **API Endpoint** (usually `https://cloud.appwrite.io/v1`)
3. **Database ID** - from Step 2

## Step 4: Create Collections

### 📊 Quick Reference: Table Structures

Here's a visual overview of all collections and their attributes:

> **⚠️ Character Limits Explained:**
> - **255 characters** = Maximum length for names, IDs, and most text fields
> - **500 characters** = For longer text like reasons/notes
> - **50 characters** = For short codes (roll numbers, prayer names)
> - **10 characters** = For dates (YYYY-MM-DD format)
> - **20 characters** = For status values ("present", "absent")
> 
> **Note:** These are MAXIMUM limits. You can enter shorter text - the limit just prevents longer entries. If you need longer text, you can increase the size when creating the attribute in Appwrite (up to 2,000 characters for String attributes).

#### Collection 1: `classes`

| Attribute | Type | Size | Required | Description | Example |
|-----------|------|------|----------|-------------|---------|
| `id` | String | 255 | ✅ Yes | Unique class identifier | `"class-123"` |
| `name` | String | 255 | ✅ Yes | Class name (e.g., "Grade 5") | `"Grade 5"`, `"Class 3A"` |
| `createdAt` | DateTime | - | ❌ No | Creation timestamp | Auto-generated |
| `updatedAt` | DateTime | - | ❌ No | Last update timestamp | Auto-generated |

**Character Limits:**
- ✅ **Class name**: Up to 255 characters (e.g., "Grade 5", "Class 3A", "Advanced Mathematics Class")
- 💡 **Typical use**: 5-50 characters is usually enough for class names

**Indexes:**
- `name` (key, ASC)

---

#### Collection 2: `students`

| Attribute | Type | Size | Required | Description | Example |
|-----------|------|------|----------|-------------|---------|
| `id` | String | 255 | ✅ Yes | Unique student identifier | `"student-456"` |
| `name` | String | 255 | ✅ Yes | Student full name | `"Ahmed Ali"`, `"Fatima Hassan"` |
| `rollNumber` | String | 50 | ❌ No | Student roll number | `"1"`, `"A123"` |
| `className` | String | 255 | ✅ Yes | Class name (links to classes) | `"Grade 5"` |
| `updatedAt` | DateTime | - | ❌ No | Last update timestamp | Auto-generated |

**Character Limits:**
- ✅ **Student name**: Up to 255 characters (e.g., "Ahmed Ali", "Fatima Hassan Mohammed")
- ✅ **Roll number**: Up to 50 characters (e.g., "1", "A123", "2024-001")
- 💡 **Typical use**: 
  - Student names: 10-50 characters
  - Roll numbers: 1-20 characters

**Indexes:**
- `className` (key, ASC)
- `name` (key, ASC)

---

#### Collection 3: `attendance`

| Attribute | Type | Size | Required | Description | Example |
|-----------|------|------|----------|-------------|---------|
| `id` | String | 255 | ✅ Yes | Unique attendance record ID | `"att-789"` |
| `studentId` | String | 255 | ✅ Yes | Student ID (links to students) | `"student-456"` |
| `studentName` | String | 255 | ✅ Yes | Student name (denormalized) | `"Ahmed Ali"` |
| `className` | String | 255 | ✅ Yes | Class name | `"Grade 5"` |
| `prayer` | String | 50 | ✅ Yes | Prayer name (Fajr, Dhuhr, etc.) | `"Fajr"`, `"Dhuhr"` |
| `date` | String | 10 | ✅ Yes | Date (YYYY-MM-DD format) | `"2024-01-15"` |
| `status` | String | 20 | ✅ Yes | "present" or "absent" | `"present"`, `"absent"` |
| `reason` | String | 500 | ❌ No | Reason for absence | `"Sick"`, `"Family emergency"` |
| `timestamp` | String | 255 | ❌ No | Timestamp string | `"2024-01-15T05:30:00Z"` |
| `updatedAt` | DateTime | - | ❌ No | Last update timestamp | Auto-generated |

**Character Limits:**
- ✅ **Prayer name**: Up to 50 characters (e.g., "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha")
- ✅ **Date**: Exactly 10 characters (YYYY-MM-DD format, e.g., "2024-01-15")
- ✅ **Status**: Up to 20 characters (usually "present" or "absent")
- ✅ **Reason**: Up to 500 characters for longer explanations (e.g., "Sick", "Family emergency", "Doctor appointment")
- 💡 **Typical use**:
  - Prayer: 4-10 characters
  - Date: Always 10 characters
  - Status: 7-8 characters
  - Reason: 5-200 characters

**Indexes:**
- `studentId` (key, ASC)
- `date` (key, ASC)
- `className` (key, ASC)
- `prayer` (key, ASC)

---

#### Collection 4: `summary` (Optional)

| Attribute | Type | Size | Required | Description | Example |
|-----------|------|------|----------|-------------|---------|
| `id` | String | 255 | ✅ Yes | Unique summary ID | `"summary-001"` |
| `type` | String | 50 | ✅ Yes | Summary type | `"daily"`, `"weekly"` |
| `createdAt` | DateTime | - | ❌ No | Creation timestamp | Auto-generated |
| `updatedAt` | DateTime | - | ❌ No | Last update timestamp | Auto-generated |

**Character Limits:**
- ✅ **Type**: Up to 50 characters (e.g., "daily", "weekly", "monthly")
- 💡 **Typical use**: 5-20 characters

---

### Option A: One Database with Multiple Collections

You need to create 4 collections **in the same database**:

### Collection 1: Classes

1. Go to **Databases** → Your Database → **Collections**
2. Click "Create Collection"
3. Fill in:
   - **Collection ID**: `classes`
   - **Name**: `Classes`
4. Click "Create"
5. **Add Attributes** (go to **Attributes** tab):
   - **String** attribute:
     - Key: `id`
     - Size: 255
     - Required: Yes
   - **String** attribute:
     - Key: `name`
     - Size: 255
     - Required: Yes
   - **DateTime** attribute:
     - Key: `createdAt`
     - Required: No
   - **DateTime** attribute:
     - Key: `updatedAt`
     - Required: No
6. **Create Indexes** (go to **Indexes** tab):
   - Index: `name` (Attribute: `name`, Type: `key`, Order: `ASC`)

### Collection 2: Students

1. Click "Create Collection"
2. Fill in:
   - **Collection ID**: `students`
   - **Name**: `Students`
3. Click "Create"
4. **Add Attributes**:
   - **String** attribute:
     - Key: `id`
     - Size: 255
     - Required: Yes
   - **String** attribute:
     - Key: `name`
     - Size: 255
     - Required: Yes
   - **String** attribute:
     - Key: `rollNumber`
     - Size: 50
     - Required: No
   - **String** attribute:
     - Key: `className`
     - Size: 255
     - Required: Yes
   - **DateTime** attribute:
     - Key: `updatedAt`
     - Required: No
5. **Create Indexes**:
   - Index: `className` (Attribute: `className`, Type: `key`, Order: `ASC`)
   - Index: `name` (Attribute: `name`, Type: `key`, Order: `ASC`)

### Collection 3: Attendance

1. Click "Create Collection"
2. Fill in:
   - **Collection ID**: `attendance`
   - **Name**: `Attendance`
3. Click "Create"
4. **Add Attributes**:
   - **String** attribute:
     - Key: `id`
     - Size: 255
     - Required: Yes
   - **String** attribute:
     - Key: `studentId`
     - Size: 255
     - Required: Yes
   - **String** attribute:
     - Key: `studentName`
     - Size: 255
     - Required: Yes
   - **String** attribute:
     - Key: `className`
     - Size: 255
     - Required: Yes
   - **String** attribute:
     - Key: `prayer`
     - Size: 50
     - Required: Yes
   - **String** attribute:
     - Key: `date`
     - Size: 10
     - Required: Yes
   - **String** attribute:
     - Key: `status`
     - Size: 20
     - Required: Yes
   - **String** attribute:
     - Key: `reason`
     - Size: 500
     - Required: No
   - **String** attribute:
     - Key: `timestamp`
     - Size: 255
     - Required: No
   - **DateTime** attribute:
     - Key: `updatedAt`
     - Required: No
5. **Create Indexes**:
   - Index: `studentId` (Attribute: `studentId`, Type: `key`, Order: `ASC`)
   - Index: `date` (Attribute: `date`, Type: `key`, Order: `ASC`)
   - Index: `className` (Attribute: `className`, Type: `key`, Order: `ASC`)
   - Index: `prayer` (Attribute: `prayer`, Type: `key`, Order: `ASC`)

### Collection 4: Summary (Optional - for future use)

---

### Option B: Multiple Databases - Create Collections

If you're using **multiple databases** (Option B), create **one collection** in each database:

#### In `classes-db` Database:

1. Go to **Databases** → `classes-db` → **Collections**
2. Click "Create Collection"
3. Fill in:
   - **Collection ID**: `classes`
   - **Name**: `Classes`
4. Click "Create"
5. **Add Attributes** (same as Collection 1 in Option A)
6. **Create Indexes** (same as Collection 1 in Option A)

#### In `students-db` Database:

1. Go to **Databases** → `students-db` → **Collections**
2. Click "Create Collection"
3. Fill in:
   - **Collection ID**: `students`
   - **Name**: `Students`
4. Click "Create"
5. **Add Attributes** (same as Collection 2 in Option A)
6. **Create Indexes** (same as Collection 2 in Option A)

#### In `attendance-db` Database:

1. Go to **Databases** → `attendance-db` → **Collections**
2. Click "Create Collection"
3. Fill in:
   - **Collection ID**: `attendance`
   - **Name**: `Attendance`
4. Click "Create"
5. **Add Attributes** (same as Collection 3 in Option A)
6. **Create Indexes** (same as Collection 3 in Option A)

#### In `summary-db` Database (Optional):

1. Go to **Databases** → `summary-db` → **Collections**
2. Click "Create Collection"
3. Fill in:
   - **Collection ID**: `summary`
   - **Name**: `Summary`
4. Click "Create"
5. **Add Attributes** (same as Collection 4 in Option A)
6. **Create Indexes** (same as Collection 4 in Option A)

## Step 5: Configure Permissions

For each collection (`classes`, `students`, `attendance`, `summary`):

1. Go to the collection → **Settings** → **Permissions**
2. Click "Add Permission"
3. Select:
   - **Role**: `Any` (for public access)
   - **Read**: ✅ Enabled
   - **Create**: ✅ Enabled
   - **Update**: ✅ Enabled
   - **Delete**: ✅ Enabled
4. Click "Create"

⚠️ **Note**: For production, you should set up proper authentication and role-based permissions. For development, "Any" works fine.

## Step 6: Enable Real-time (Realtime)

1. Go to **Settings** → **Realtime** in your Appwrite project
2. Make sure **Realtime** is enabled (it should be by default)
3. This enables real-time subscriptions via WebSocket

## Step 7: Configure Environment Variables

### Option A: One Database (Recommended)

#### For Local Development

1. Create a `.env` file in the `client` directory (or root directory):
   ```env
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your-project-id-here
   VITE_APPWRITE_DATABASE_ID=your-database-id-here
   ```

2. Replace with your actual values from Steps 2A and 3

#### For Production (Netlify/Vercel)

1. Go to your deployment platform's environment variables settings
2. Add:
   - `VITE_APPWRITE_ENDPOINT` = `https://cloud.appwrite.io/v1`
   - `VITE_APPWRITE_PROJECT_ID` = your Appwrite project ID
   - `VITE_APPWRITE_DATABASE_ID` = your Appwrite database ID

---

### Option B: Multiple Databases (Advanced)

#### For Local Development

1. Create a `.env` file in the `client` directory (or root directory):
   ```env
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your-project-id-here
   
   # Multiple Database IDs
   VITE_APPWRITE_DATABASE_ID_CLASSES=your-classes-db-id-here
   VITE_APPWRITE_DATABASE_ID_STUDENTS=your-students-db-id-here
   VITE_APPWRITE_DATABASE_ID_ATTENDANCE=your-attendance-db-id-here
   VITE_APPWRITE_DATABASE_ID_SUMMARY=your-summary-db-id-here
   ```

2. Replace with your actual values from Steps 2B and 3

#### For Production (Netlify/Vercel)

1. Go to your deployment platform's environment variables settings
2. Add:
   - `VITE_APPWRITE_ENDPOINT` = `https://cloud.appwrite.io/v1`
   - `VITE_APPWRITE_PROJECT_ID` = your Appwrite project ID
   - `VITE_APPWRITE_DATABASE_ID_CLASSES` = your classes database ID
   - `VITE_APPWRITE_DATABASE_ID_STUDENTS` = your students database ID
   - `VITE_APPWRITE_DATABASE_ID_ATTENDANCE` = your attendance database ID
   - `VITE_APPWRITE_DATABASE_ID_SUMMARY` = your summary database ID (optional)

**Note:** If using multiple databases, you'll need to update the code in `client/src/lib/appwriteConfig.ts` to support multiple database IDs. See the code example below.

## Step 8: Test the Setup

1. Start your app: `npm run dev`
2. Open browser console (F12)
3. You should see:
   - `✅ Appwrite initialized successfully`
   - `✅ Classes real-time sync active`
   - `✅ Students real-time sync active`
   - `✅ Real-time sync listener active`

## Troubleshooting

### "Appwrite not available" error
- Check that `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, and `VITE_APPWRITE_DATABASE_ID` are set correctly
- Make sure they're prefixed with `VITE_` for Vite to expose them
- Restart your dev server after adding environment variables

### "Permission denied" error
- Check Permissions are set up correctly (Step 5)
- Make sure "Any" role has read/write permissions
- Verify collection IDs match exactly: `classes`, `students`, `attendance`, `summary`

### Collections not found
- Verify collection IDs match exactly (case-sensitive)
- Check that all attributes are created correctly
- Make sure indexes are created for queryable fields

### Real-time not working
- Verify Realtime is enabled in Appwrite Settings
- Check browser console for WebSocket connection errors
- Make sure you're using the correct endpoint URL

### Attribute errors
- Verify all required attributes are created
- Check attribute types match (String, DateTime, etc.)
- Ensure attribute sizes are sufficient (e.g., String size 255 for names)

## Collection IDs Reference

Make sure these match exactly in your Appwrite setup:
- `classes` - for class data
- `students` - for student data
- `attendance` - for attendance records
- `summary` - for summary/report data (optional)

## Next Steps

1. ✅ Test creating a class - it should sync to Appwrite
2. ✅ Test creating a student - it should sync to Appwrite
3. ✅ Test marking attendance - it should sync to Appwrite
4. ✅ Open app on another device - changes should appear instantly!

## Security Notes

- **Never commit** your `.env` file with real credentials to Git
- For production, implement proper authentication with Appwrite Auth
- Use role-based permissions instead of "Any" for production
- Consider using API keys with restricted scopes for better security

---

## Multiple Databases Code Configuration

If you chose **Option B (Multiple Databases)**, you need to update your code to support multiple database IDs.

### Update `client/src/lib/appwriteConfig.ts`

Replace the single database ID with multiple database IDs:

```typescript
// Get multiple database IDs from environment variables
const appwriteDatabaseIdClasses = import.meta.env.VITE_APPWRITE_DATABASE_ID_CLASSES || '';
const appwriteDatabaseIdStudents = import.meta.env.VITE_APPWRITE_DATABASE_ID_STUDENTS || '';
const appwriteDatabaseIdAttendance = import.meta.env.VITE_APPWRITE_DATABASE_ID_ATTENDANCE || '';
const appwriteDatabaseIdSummary = import.meta.env.VITE_APPWRITE_DATABASE_ID_SUMMARY || '';

// Export database IDs object
export const DATABASE_IDS = {
  CLASSES: appwriteDatabaseIdClasses,
  STUDENTS: appwriteDatabaseIdStudents,
  ATTENDANCE: appwriteDatabaseIdAttendance,
  SUMMARY: appwriteDatabaseIdSummary,
} as const;

// For backward compatibility, export the first database ID
export const DATABASE_ID = appwriteDatabaseIdClasses;
```

Then update your code to use the appropriate database ID when accessing collections:

```typescript
// Instead of:
databases.listDocuments(DATABASE_ID, COLLECTION_IDS.CLASSES);

// Use:
databases.listDocuments(DATABASE_IDS.CLASSES, COLLECTION_IDS.CLASSES);
databases.listDocuments(DATABASE_IDS.STUDENTS, COLLECTION_IDS.STUDENTS);
databases.listDocuments(DATABASE_IDS.ATTENDANCE, COLLECTION_IDS.ATTENDANCE);
```

**Note:** The current codebase uses a single database. If you want to use multiple databases, you'll need to update all database calls throughout the codebase to use the appropriate database ID.

---

## 📝 Quick Prompt Template for Creating Tables

### 🚀 Ultra-Short Prompt (Under 255 Characters)

Perfect for quick reference or AI assistants:

```
Appwrite: classes(id,name), students(id,name,rollNum,className), attendance(id,studId,studName,className,prayer,date,status,reason,timestamp), summary(id,type). String 255 except rollNum/prayer/type=50, date=10, status=20, reason=500.
```

**Character count: 234 characters** ✅

**Note:** Abbreviations used: `rollNum` = `rollNumber`, `studId` = `studentId`, `studName` = `studentName`. Includes all attendance fields: id, studId, studName, className, prayer, date, status, reason, timestamp.

---

### 📋 Detailed Prompt Template

You can use this prompt with AI assistants or as a checklist:

```
Create Appwrite collections with the following structure:

DATABASE: caliph-attendance-db

COLLECTION 1: classes
- Collection ID: classes
- Attributes:
  * id (String, 255, Required)
  * name (String, 255, Required)
  * createdAt (DateTime, Optional)
  * updatedAt (DateTime, Optional)
- Indexes: name (key, ASC)

COLLECTION 2: students
- Collection ID: students
- Attributes:
  * id (String, 255, Required)
  * name (String, 255, Required)
  * rollNumber (String, 50, Optional)
  * className (String, 255, Required)
  * updatedAt (DateTime, Optional)
- Indexes: className (key, ASC), name (key, ASC)

COLLECTION 3: attendance
- Collection ID: attendance
- Attributes:
  * id (String, 255, Required)
  * studentId (String, 255, Required)
  * studentName (String, 255, Required)
  * className (String, 255, Required)
  * prayer (String, 50, Required)
  * date (String, 10, Required)
  * status (String, 20, Required)
  * reason (String, 500, Optional)
  * timestamp (String, 255, Optional)
  * updatedAt (DateTime, Optional)
- Indexes: studentId (key, ASC), date (key, ASC), className (key, ASC), prayer (key, ASC)

COLLECTION 4: summary (Optional)
- Collection ID: summary
- Attributes:
  * id (String, 255, Required)
  * type (String, 50, Required)
  * createdAt (DateTime, Optional)
  * updatedAt (DateTime, Optional)
```

---

**Need help?** Check Appwrite docs: [https://appwrite.io/docs](https://appwrite.io/docs)
