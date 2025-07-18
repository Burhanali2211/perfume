# 🚀 E-Commerce Platform Setup Guide (v2.0)

## Overview
This is a comprehensive multi-role e-commerce platform with complete database integration, user management, product management, order processing, and analytics.

## Features
- ✅ Multi-role authentication (Admin, Seller, Customer)
- ✅ Complete product management with variants and categories
- ✅ Shopping cart and wishlist functionality
- ✅ Order management with tracking
- ✅ Address management
- ✅ Review and rating system
- ✅ Admin dashboard with analytics
- ✅ User profile management
- ✅ Row Level Security (RLS) policies
- ✅ Real-time database integration

## Quick Start

### 1. Environment Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Set up Supabase:**
   - Go to [Supabase](https://supabase.com) and create a new project
   - Wait for the project to be ready (this can take a few minutes)
   - Go to Project Settings → API
   - Copy your Project URL and anon/public key

4. **Update .env file:**
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 2. Database Setup

1. **Apply the complete database schema:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase_new_complete_schema.sql`
   - Click "Run" to execute the schema
   - Wait for completion (should see success message)

2. **Verify database setup:**
   - Check that all tables are created in the Table Editor
   - Verify that RLS policies are enabled
   - Run this test query:
     ```sql
     SELECT COUNT(*) FROM public.categories;
     ```
   - Should return 6 (default categories)

### 3. Application Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Create your first admin user:**
   - Register a new account through the website
   - In Supabase SQL Editor, run:
     ```sql
     SELECT public.make_user_admin('your-email@example.com');
     ```
   - Logout and login again to access admin features

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Demo Accounts

Create these demo accounts manually in Supabase Auth > Users:

- **Admin**: admin@example.com / demo123456
- **Seller**: seller@example.com / demo123456
- **Customer**: customer@example.com / demo123456

After creating users, update their roles in the profiles table.

📋 **Detailed database setup:** See [setup-database.md](setup-database.md)

## Troubleshooting

### Database Connection Issues

If you see "DATABASE SETUP ERROR" messages:
1. Ensure your Supabase URL and key are correct in `.env`
2. Run the SQL schema again in Supabase SQL Editor
3. Check that RLS policies are properly configured

### Mock Data Fallback

If the app shows "Demonstration Mode":
- This means the database is empty or connection failed
- The app will use mock data for demonstration
- Set up the database properly to use real data

### Build Issues

If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Ensure you're using Node.js v18 or higher

## Next Steps

After basic setup:
1. Customize the branding and styling
2. Set up payment processing (Stripe recommended)
3. Configure email notifications
4. Add analytics tracking
5. Set up deployment (Netlify/Vercel recommended)

## Support

For issues:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure database schema is properly applied
4. Check Supabase project status and quotas
