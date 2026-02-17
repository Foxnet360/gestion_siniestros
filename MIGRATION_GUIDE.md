# Quick Fix Guide - Apply Database Migrations

## The Problem
Your app is getting 400 errors because the new database tables and columns don't exist in Supabase yet.

## The Solution
Apply the migration file to your Supabase database.

## Steps

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Navigate to SQL Editor
- Select your project
- Click "SQL Editor" in the left sidebar

### 3. Run the Migration
- Click "New Query"
- Copy the entire contents of `migrations/000_apply_all_smart_ingestion.sql`
- Paste into the SQL editor
- Click "Run" (or press Ctrl+Enter)

### 4. Verify Success
You should see:
```
Success. No rows returned
```

### 5. Refresh Your App
- Go back to your app at http://localhost:3000
- Hard refresh (Ctrl+Shift+R)
- The 400 errors should be gone

## What This Migration Does

✅ Adds 17 new columns to `claims` table  
✅ Creates `amparos` table for coverage data  
✅ Adds performance indexes  
✅ Sets up foreign key relationships  

## If You Get Errors

**"column already exists"** → Safe to ignore, means some columns were already added  
**"table already exists"** → Safe to ignore, means table was already created  
**"relation does not exist"** → Make sure you're running this on the correct database

## After Migration

The app should work properly and you can:
- Upload Excel files
- See the smart merge in action
- View detailed ingestion reports

---

**File Location**: `migrations/000_apply_all_smart_ingestion.sql`
