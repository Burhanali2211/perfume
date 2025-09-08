# Complete Database Setup Guide

## 🚨 Current Issue
The API keys we're testing don't match your Supabase project. We need to get the correct configuration from your Supabase dashboard.

## 📋 Step-by-Step Setup

### 1. Get Your Correct Supabase Configuration

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Look for the project named "e-commerce" or similar
   - Click on it to open the project

3. **Get Your Project URL**
   - Go to Settings > API
   - Copy the "Project URL" (it should look like: `https://xxxxx.supabase.co`)

4. **Get Your Anon Key**
   - In the same Settings > API page
   - Copy the "anon public" key (it's a long JWT token)

### 2. Create Environment File

Create a `.env` file in your project root with:

```env
VITE_SUPABASE_URL=https://your-actual-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
VITE_APP_ENV=development
VITE_DIRECT_LOGIN_ENABLED=true
```

### 3. Run Database Setup

After creating the `.env` file, run:

```bash
node setup-database.cjs
```

### 4. Test Your Setup

Run the test script:

```bash
node check-database-with-token.cjs
```

## 🔧 Manual Database Setup (Alternative)

If the automated setup doesn't work, you can manually run the SQL in your Supabase SQL Editor:

### Step 1: Open SQL Editor
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run the Complete Setup SQL
Copy and paste the contents of `complete-database-setup.sql` into the SQL editor and run it.

### Step 3: Verify Tables
Run this query to check if all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 📊 Expected Database Structure

After setup, you should have these tables:

### Core Tables
- ✅ **profiles** - User accounts
- ✅ **products** - Product catalog
- ✅ **categories** - Product categories
- ✅ **orders** - Customer orders
- ✅ **order_items** - Order line items
- ✅ **cart_items** - Shopping cart
- ✅ **wishlist_items** - User wishlists
- ✅ **reviews** - Product reviews
- ✅ **addresses** - User addresses
- ✅ **payment_methods** - Payment info
- ✅ **coupons** - Discount codes
- ✅ **product_variants** - Product variations

### New Tables (Created by Setup)
- ✅ **order_tracking** - Order shipment tracking
- ✅ **user_preferences** - User settings
- ✅ **user_security_settings** - Security settings

## 🧪 Testing CRUD Operations

After setup, test these operations:

### 1. Test User Creation
```javascript
const { data, error } = await supabase
  .from('profiles')
  .insert([{ email: 'test@example.com', full_name: 'Test User' }]);
```

### 2. Test Product Creation
```javascript
const { data, error } = await supabase
  .from('products')
  .insert([{ name: 'Test Product', price: 29.99, stock: 100 }]);
```

### 3. Test Order Creation
```javascript
const { data, error } = await supabase
  .from('orders')
  .insert([{ user_id: 'user-uuid', total_amount: 29.99, status: 'pending' }]);
```

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check your anon key is correct
   - Ensure you copied the full key
   - Verify the key is from the right project

2. **"Table doesn't exist"**
   - Run the complete database setup SQL
   - Check if RLS policies are blocking access
   - Verify you're using the correct project

3. **"RLS policy violation"**
   - The setup script includes development mode bypasses
   - Check if `app.development_mode` is set to true

4. **"Connection failed"**
   - Check your internet connection
   - Verify the Supabase URL is correct
   - Ensure your project is not paused

### Getting Help

If you're still having issues:

1. **Check Supabase Status**: https://status.supabase.com/
2. **Review Project Settings**: Ensure your project is active
3. **Check Billing**: Make sure your project isn't paused due to billing
4. **Review Logs**: Check the Supabase dashboard logs for errors

## 🎯 Success Indicators

You'll know the setup is working when:

- ✅ All 15 tables are accessible
- ✅ You can create, read, update, and delete records
- ✅ The admin dashboard loads without errors
- ✅ No more "column doesn't exist" errors
- ✅ No more 404 errors for order_tracking

## 📞 Next Steps

Once everything is working:

1. **Test the Admin Dashboard** - Verify all metrics load
2. **Test CRUD Operations** - Create, read, update, delete records
3. **Test User Authentication** - Sign up, sign in, sign out
4. **Test Order Flow** - Create orders, track them
5. **Performance Check** - Ensure fast loading times

The setup should take about 5-10 minutes once you have the correct Supabase configuration.
