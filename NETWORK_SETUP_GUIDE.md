# Network Feature Setup Guide

## Problem
You're getting "Ağ oluşturulamadı" (Network could not be created) error when trying to create a network.

## Solution Steps

### 1. Create Database Tables
The error occurs because the required database tables don't exist yet. You need to run the SQL script in your Supabase database.

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `network_tables.sql`
4. Click **Run** to execute the script

#### Option B: Using Supabase CLI
```bash
supabase db push
```

### 2. Verify Tables Created
After running the SQL script, verify these tables exist in your Supabase database:
- `user_networks`
- `network_members` 
- `emergency_notifications`

### 3. Check Row Level Security (RLS)
Make sure RLS is enabled and policies are created:
- Go to **Authentication > Policies** in Supabase
- Verify policies exist for all three tables

### 4. Test the Feature
1. Restart your app
2. Try creating a network again
3. Check the console logs for detailed error messages

## Common Issues

### Issue 1: "relation does not exist"
**Cause**: Tables haven't been created
**Solution**: Run the SQL script in Supabase

### Issue 2: "permission denied"
**Cause**: RLS policies not set up correctly
**Solution**: Check that RLS policies are created and enabled

### Issue 3: "invalid input syntax"
**Cause**: Data type mismatch
**Solution**: Check that user ID is a valid UUID

## Debug Information
The app now includes console logging to help identify issues:
- Check browser/device console for detailed error messages
- Look for "Creating network with name:" and "Network creation error:" logs

## Database Schema Overview

### user_networks
- `id`: UUID (Primary Key)
- `name`: VARCHAR(100) - Network name
- `owner_id`: UUID - References auth.users
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### network_members
- `id`: UUID (Primary Key)
- `network_id`: UUID - References user_networks
- `name`: VARCHAR(100) - Member name
- `phone`: VARCHAR(20) - Phone number
- `email`: VARCHAR(255) - Optional email
- `is_online`: BOOLEAN - Online status
- `last_seen`: TIMESTAMP

### emergency_notifications
- `id`: UUID (Primary Key)
- `network_id`: UUID - References user_networks
- `sender_id`: UUID - References auth.users
- `message`: TEXT - Emergency message
- `latitude`: DECIMAL - GPS latitude
- `longitude`: DECIMAL - GPS longitude
- `sent_at`: TIMESTAMP
- `is_read`: BOOLEAN

## Support
If you continue to have issues after following these steps, check:
1. Supabase project settings
2. Database connection
3. User authentication status
4. Console error messages 