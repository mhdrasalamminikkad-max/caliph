# Clear Attendance Data Feature Guide

## Overview
The "Clear All Storage" functionality has been moved from the home screen to the admin panel. The clear function now only deletes attendance data while preserving classes and students.

## What Changed

### 1. Removed from Home Screen
- ❌ "Clear All Storage" button removed from HomePage.tsx
- ✅ No more accidental data deletion from the main interface

### 2. Added to Admin Panel
- ✅ New tab "Clear Attendance" (6th tab) in admin panel
- ✅ Admin-only access with proper authentication
- ✅ Two-step confirmation process for safety

## How to Access

1. **Login**: Use username `user` and password `caliph786`
2. **Enter Admin Panel**: Type `786786` and press Enter
3. **Navigate**: Click on the "Clear Attendance" tab (6th tab with trash icon)

## What Gets Deleted

When you clear attendance data, the following will be **permanently deleted**:
- ✅ All attendance records (present/absent markings)
- ✅ Attendance history for all dates and prayers
- ✅ Local storage attendance cache

## What Is Preserved

The following data will **remain intact**:
- ✅ All classes
- ✅ All students
- ✅ User accounts
- ✅ Custom settings

## Confirmation Process

### Two-Step Verification:
1. **Step 1**: Click "Clear All Attendance Data" button
2. **Confirmation 1**: System asks "Are you sure?"
3. **Confirmation 2**: System asks "This is your last chance!"
4. **Execute**: Final click performs the deletion

### Cancel Anytime:
- You can click "Cancel" at any step to abort the operation
- No data is deleted until you complete all confirmation steps

## Security Features

1. **Admin-Only Access**: Requires admin role to access this feature
2. **Protected API Endpoint**: Backend route `/api/attendance` (DELETE) requires admin authentication
3. **No Local Storage Direct Manipulation**: Uses secure API calls instead of direct localStorage access

## Technical Details

### Backend Implementation:
- **Endpoint**: `DELETE /api/attendance`
- **Middleware**: `requireAdmin` (ensures only admins can access)
- **Method**: `storage.clearAllAttendance()`
- **Returns**: Count of deleted records

### Frontend Implementation:
- **Component**: `ClearAttendanceData.tsx`
- **Location**: Admin panel, 6th tab
- **Validation**: Two-step confirmation dialog
- **Cache Invalidation**: Automatically refreshes all attendance queries

## Use Cases

### When to Use:
- ✅ Starting a new academic year
- ✅ Testing the system
- ✅ Resetting attendance after pilot phase
- ✅ Clearing old/incorrect data

### When NOT to Use:
- ❌ To delete individual attendance records (use "Edit Attendance" tab instead)
- ❌ To remove specific students (use "Students" tab instead)
- ❌ To remove classes (use "Classes" tab instead)

## Alternative Actions

- **Edit Single Record**: Use "Edit Attendance" tab
- **Add Past Attendance**: Use "Add Past Attendance" tab
- **Delete Student**: Use "Students" tab
- **Delete Class**: Use "Classes" tab

## Safety Tips

1. **Always backup data** before clearing (export reports if needed)
2. **Double-check** you're in the correct academic period
3. **Verify** you selected the right option (Clear Attendance, not Clear All Data)
4. **Communicate** with team before clearing shared data
5. **Test first** in a non-production environment if available

## Admin Panel Tabs Reference

1. **Users** - Manage user accounts
2. **Students** - Add/edit/delete students
3. **Classes** - Add/edit/delete classes
4. **Edit Attendance** - Modify individual attendance records
5. **Add Past Attendance** - Add backdated attendance
6. **Clear Attendance** - Clear all attendance data (preserves classes & students)

## Default Credentials

- **Username**: `user`
- **Password**: `caliph786`
- **Role**: `admin`
- **Admin Panel Access Code**: `786786` (then press Enter)

---

**Note**: This feature was previously located on the home screen as "Clear All Storage" and would delete ALL data. The new implementation is safer and more controlled.
