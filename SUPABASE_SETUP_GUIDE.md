# Complete Supabase E-commerce Database Setup Guide

## Overview
This guide will help you set up a completely fresh Supabase database for your e-commerce platform. The database includes all necessary tables, relationships, security policies, and sample data.

## Prerequisites
- A Supabase account (free tier is sufficient for development)
- Access to Supabase SQL Editor
- Basic understanding of SQL (helpful but not required)

## Step-by-Step Setup

### 1. Create New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `e-commerce-platform` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project initialization (2-3 minutes)

### 2. Apply Database Schema

1. Navigate to your project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy the entire contents of `supabase_complete_fresh_database.sql`
5. Paste into the SQL editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for execution to complete (should take 30-60 seconds)
8. Verify success message appears at the bottom

### 3. Verify Schema Creation

1. Go to **Table Editor** (left sidebar)
2. You should see all tables created:
   - `profiles`
   - `addresses`
   - `categories`
   - `products`
   - `product_variants`
   - `carts`
   - `cart_items`
   - `wishlists`
   - `wishlist_items`
   - `orders`
   - `order_items`
   - `order_tracking`
   - `reviews`
   - `coupons`
   - `coupon_usage`

### 4. Add Sample Data (Optional but Recommended)

1. Return to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase_sample_data.sql`
4. Paste into the SQL editor
5. Click **"Run"**
6. Verify completion message with data counts

### 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: Your frontend URL (e.g., `http://localhost:5173` for development)
   - **Redirect URLs**: Add your frontend URL
   - **Email Templates**: Customize if needed
3. Enable desired auth providers:
   - **Email**: Already enabled
   - **Google**: Configure if needed
   - **GitHub**: Configure if needed

### 6. Get API Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **anon/public key**
   - **service_role key** (keep this secret!)

### 7. Update Environment Variables

Create or update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Features Included

### 🔐 Security Features
- **Row Level Security (RLS)** enabled on all tables
- **Comprehensive policies** for user data protection
- **Admin and vendor role** support
- **Guest user support** for carts

### 📊 Performance Optimizations
- **Strategic indexes** on frequently queried columns
- **Full-text search** capability on products
- **Optimized queries** for common operations
- **Efficient relationship** structures

### 🛠 Automated Features
- **Auto-updating timestamps** on record changes
- **Automatic order number** generation
- **Product rating calculation** from reviews
- **User profile creation** on signup

### 📈 E-commerce Specific
- **Multi-variant products** support
- **Inventory tracking** with low stock alerts
- **Flexible coupon system** (percentage, fixed, free shipping)
- **Order status tracking** with history
- **Review and rating** system
- **Wishlist functionality**
- **Address management**

## Testing the Setup

### 1. Test Authentication
1. Go to **Authentication** → **Users**
2. Click **"Add user"** to create a test user
3. Verify user appears in both `auth.users` and `profiles` tables

### 2. Test Data Access
1. Go to **Table Editor**
2. Browse the sample data in various tables
3. Try filtering and searching

### 3. Test RLS Policies
1. In SQL Editor, run:
```sql
-- This should work (viewing active products)
SELECT * FROM products WHERE is_active = true LIMIT 5;

-- This should be restricted (admin-only data)
SELECT * FROM profiles;
```

## Common Issues and Solutions

### Issue: "relation does not exist" error
**Solution**: Make sure you ran the schema script completely and it finished successfully.

### Issue: RLS policies blocking queries
**Solution**: Check that you're authenticated or the query matches the policy conditions.

### Issue: Sample data not inserting
**Solution**: Ensure the schema script ran first and all tables exist.

### Issue: Environment variables not working
**Solution**: Restart your development server after updating `.env` file.

## Next Steps

1. **Connect your frontend** using the API credentials
2. **Test user registration** and login flows
3. **Implement product browsing** and search
4. **Add shopping cart** functionality
5. **Set up order processing** workflow
6. **Configure payment integration** (Stripe, PayPal, etc.)

## Support

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify all environment variables are correct
3. Ensure your frontend is connecting to the right project
4. Review the RLS policies if data access is blocked

## Security Notes

⚠️ **Important Security Reminders:**
- Never expose your `service_role` key in client-side code
- Always use the `anon` key for client applications
- Test your RLS policies thoroughly before production
- Regularly review user permissions and access patterns
- Keep your database password secure

Your e-commerce database is now ready for development! 🚀
