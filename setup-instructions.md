# Database Setup Instructions

## Step 1: Run the Comprehensive Backend Fix Script

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-scripts/COMPREHENSIVE-BACKEND-FIX.sql` into the editor
4. Run the script

This will:
- Enable necessary extensions
- Clean up existing policies
- Create/update core functions
- Ensure an admin user exists
- Create simplified RLS policies
- Grant necessary permissions

## Step 2: Run the Sample Data Script (Optional)

If you want to populate your database with sample data:

1. In the Supabase SQL Editor, copy and paste the contents of `supabase-scripts/14-sample-data.sql`
2. Run the script

## Step 3: Verify the Setup

After running the scripts, you can verify the setup by:

1. Checking that the admin user exists:
   ```sql
   SELECT * FROM profiles WHERE role = 'admin';
   ```

2. Checking that tables have data:
   ```sql
   SELECT COUNT(*) FROM categories;
   SELECT COUNT(*) FROM products;
   ```

## Alternative: Manual Profile Creation

If you prefer to create the admin user manually:

1. In the Supabase SQL Editor, run:
   ```sql
   INSERT INTO public.profiles (
     id,
     email,
     full_name,
     role,
     is_active,
     email_verified,
     created_at,
     updated_at
   ) VALUES (
     '33333333-3333-3333-3333-333333333333',
     'admin@sufiessences.com',
     'System Administrator',
     'admin',
     true,
     true,
     NOW(),
     NOW()
   ) ON CONFLICT (id) DO UPDATE SET
     role = 'admin',
     is_active = true,
     updated_at = NOW();
   ```

## Environment Configuration

Make sure your `.env` file has the correct settings:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DIRECT_LOGIN_ENABLED=true  # Set to false in production
VITE_DIRECT_LOGIN_DEFAULT_ROLE=admin
VITE_DIRECT_LOGIN_AUTO_SELECT=true
```

## Testing the Application

After completing the database setup:

1. Restart your development server: `npm run dev`
2. Visit http://localhost:5173 (or the port shown in the terminal)
3. You should now be able to log in with:
   - Email: admin@sufiessences.com
   - Password: (use the Supabase auth interface to set a password)
```