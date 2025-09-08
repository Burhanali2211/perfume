
# Supabase Configuration Guide

## Environment Variables Required

Create a .env file in your project root with the following variables:

```env
VITE_SUPABASE_URL=https://bxyzvaujvhumupwdmysh.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
VITE_APP_ENV=development
VITE_DIRECT_LOGIN_ENABLED=true
```

## How to Get Your Anon Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: e-commerce
3. Go to Settings > API
4. Copy the "anon public" key
5. Replace "your_actual_anon_key_here" with the copied key

## Database Setup

Run the following command to set up your database:

```bash
node setup-database.cjs
```

## Verification

After setting up, test your database connection:

```bash
node check-database-with-token.cjs
```

## Troubleshooting

If you encounter issues:

1. Verify your Supabase URL and anon key are correct
2. Check that your project is not paused
3. Ensure RLS policies are properly configured
4. Check the browser console for detailed error messages
