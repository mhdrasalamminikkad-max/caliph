# 📋 Appwrite Table Creation Prompt

## 🚀 Quick 255-Character Prompt

```
Appwrite: classes(id,name), students(id,name,rollNum,className), attendance(id,studId,studName,className,prayer,date,status,reason,timestamp), summary(id,type). String 255 except rollNum/prayer/type=50, date=10, status=20, reason=500.
```

**Character count: 234 characters** ✅

**Note:** Abbreviations: `rollNum` = `rollNumber`, `studId` = `studentId`, `studName` = `studentName`. Complete attendance fields: id, studId, studName, className, prayer, date, status, reason, timestamp.

---

## 📋 Detailed Prompt (Full Version)

Copy and paste this prompt to create your Appwrite collections:

---

## Prompt for AI Assistant or Manual Setup

```
Create Appwrite collections with the following structure:

DATABASE: caliph-attendance-db

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLLECTION 1: classes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Collection ID: classes
- Collection Name: Classes

Attributes:
  * id (String, Size: 255, Required: Yes)
  * name (String, Size: 255, Required: Yes)
  * createdAt (DateTime, Required: No)
  * updatedAt (DateTime, Required: No)

Indexes:
  * name (Type: key, Order: ASC)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLLECTION 2: students
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Collection ID: students
- Collection Name: Students

Attributes:
  * id (String, Size: 255, Required: Yes)
  * name (String, Size: 255, Required: Yes)
  * rollNumber (String, Size: 50, Required: No)
  * className (String, Size: 255, Required: Yes)
  * updatedAt (DateTime, Required: No)

Indexes:
  * className (Type: key, Order: ASC)
  * name (Type: key, Order: ASC)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLLECTION 3: attendance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Collection ID: attendance
- Collection Name: Attendance

Attributes:
  * id (String, Size: 255, Required: Yes)
  * name (String, Size: 255, Required: Yes)
  * rollNumber (String, Size: 50, Required: N

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLLECTION 4: summary (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Collection ID: summary
- Collection Name: Summary

Attributes:
  * id (String, Size: 255, Required: Yes)
  * type (String, Size: 50, Required: Yes)
  * createdAt (DateTime, Required: No)
  * updatedAt (DateTime, Required: No)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERMISSIONS (for all collections):
- Role: Any
- Read: ✅ Enabled
- Create: ✅ Enabled
- Update: ✅ Enabled
- Delete: ✅ Enabled
```

---

## 📊 Visual Table Structure

### Collection 1: `classes`

| Attribute | Type | Size | Required | Description |
|-----------|------|------|----------|-------------|
| `id` | String | 255 | ✅ Yes | Unique class identifier |
| `name` | String | 255 | ✅ Yes | Class name (e.g., "Grade 5") |
| `createdAt` | DateTime | - | ❌ No | Creation timestamp |
| `updatedAt` | DateTime | - | ❌ No | Last update timestamp |

**Indexes:** `name` (key, ASC)

---

### Collection 2: `students`

| Attribute | Type | Size | Required | Description |
|-----------|------|------|----------|-------------|
| `id` | String | 255 | ✅ Yes | Unique student identifier |
| `name` | String | 255 | ✅ Yes | Student full name |
| `rollNumber` | String | 50 | ❌ No | Student roll number |
| `className` | String | 255 | ✅ Yes | Class name (links to classes) |
| `updatedAt` | DateTime | - | ❌ No | Last update timestamp |

**Indexes:** `className` (key, ASC), `name` (key, ASC)

---

### Collection 3: `attendance`

| Attribute | Type | Size | Required | Description |
|-----------|------|------|----------|-------------|
| `id` | String | 255 | ✅ Yes | Unique attendance record ID |
| `studentId` | String | 255 | ✅ Yes | Student ID (links to students) |
| `studentName` | String | 255 | ✅ Yes | Student name (denormalized) |
| `className` | String | 255 | ✅ Yes | Class name |
| `prayer` | String | 50 | ✅ Yes | Prayer name (Fajr, Dhuhr, etc.) |
| `date` | String | 10 | ✅ Yes | Date (YYYY-MM-DD format) |
| `status` | String | 20 | ✅ Yes | "present" or "absent" |
| `reason` | String | 500 | ❌ No | Reason for absence |
| `timestamp` | String | 255 | ❌ No | Timestamp string |
| `updatedAt` | DateTime | - | ❌ No | Last update timestamp |

**Indexes:** `studentId` (key, ASC), `date` (key, ASC), `className` (key, ASC), `prayer` (key, ASC)

---

### Collection 4: `summary` (Optional)

| Attribute | Type | Size | Required | Description |
|-----------|------|------|----------|-------------|
| `id` | String | 255 | ✅ Yes | Unique summary ID |
| `type` | String | 50 | ✅ Yes | Summary type |
| `createdAt` | DateTime | - | ❌ No | Creation timestamp |
| `updatedAt` | DateTime | - | ❌ No | Last update timestamp |

---

## 🚀 Quick Setup Steps

1. **Create Database** in Appwrite Console
2. **Copy the prompt above** and follow it step by step
3. **Create each collection** with the specified attributes
4. **Add indexes** for better query performance
5. **Set permissions** to allow access

---

## 📝 Notes

- All Collection IDs are **case-sensitive** - use exactly: `classes`, `students`, `attendance`, `summary`
- String sizes are maximum lengths - adjust if needed
- DateTime attributes don't need size specification
- Indexes improve query performance - don't skip them!
- For production, replace "Any" role with proper authentication

---

**See full setup guide:** `APPWRITE-SETUP.md`

