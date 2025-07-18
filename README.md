# Advanced Multi-Role E-Commerce Platform

A modern, full-featured e-commerce platform built with React, TypeScript, and Supabase. This application supports multiple user roles (customers, sellers, admins) with comprehensive features for online shopping, product management, and order processing.

## Features

### 🛍️ Customer Features
- **Product Browsing**: Search, filter, and browse products by category
- **Shopping Cart**: Add, remove, and manage items with real-time updates
- **Wishlist**: Save favorite products for later
- **Product Comparison**: Compare multiple products side-by-side
- **Reviews & Ratings**: Leave and view product reviews
- **Secure Checkout**: Multi-step checkout process with validation
- **Order Tracking**: Track order status and history
- **User Profile**: Manage personal information and preferences

### 👨‍💼 Seller Features
- **Product Management**: Add, edit, and delete products
- **Inventory Tracking**: Monitor stock levels
- **Order Management**: View and process customer orders
- **Sales Analytics**: Track performance metrics
- **Product Categories**: Organize products efficiently

### 🔧 Admin Features
- **User Management**: Manage customer and seller accounts
- **Platform Analytics**: Comprehensive dashboard with charts
- **System Monitoring**: Track platform performance
- **Content Management**: Manage categories and featured products
- **Security Controls**: Monitor and manage platform security

### 🚀 Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live cart and notification updates
- **Performance Optimized**: Lazy loading, caching, and code splitting
- **Security**: Input sanitization, XSS prevention, and rate limiting
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Error Handling**: Comprehensive error boundaries and fallbacks
- **Form Validation**: Client-side and server-side validation
- **Animation**: Smooth transitions with Framer Motion

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Lucide React** - Icons
- **Recharts** - Data visualization

### Backend & Database
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Row Level Security** - Data protection
- **Real-time subscriptions** - Live updates

### Development Tools
- **Vite** - Build tool
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Faker.js** - Mock data generation

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd advanced_multi-role_e-commerce_platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Database setup**
   - Create a new project on [Supabase](https://supabase.com)
   - Run the SQL script `complete_ecommerce_schema.sql` in your Supabase SQL editor
   - Run the SQL script `sample_data.sql` to populate with sample data
   - Update `.env` with your project URL and anon key

5. **Start development**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open http://localhost:5173 in your browser
   - Use demo accounts or create new ones

📖 **Detailed setup instructions:** See [SETUP.md](SETUP.md)

## Demo Accounts

For testing purposes, you can use these demo accounts:

- **Admin**: admin@example.com / demo123
- **Seller**: seller@example.com / demo123
- **Customer**: customer@example.com / demo123

## 📦 Database Schema

### Quick Setup
The database schema and sample data are provided in two files:

1. **`complete_ecommerce_schema.sql`** - Complete database schema with tables, indexes, triggers, and RLS policies
2. **`sample_data.sql`** - Sample data including categories, products, coupons, and variants

### Database Tables

#### Core Tables
- **`profiles`** - User profiles extending Supabase auth.users
- **`addresses`** - User shipping and billing addresses
- **`categories`** - Product categories with hierarchical support
- **`products`** - Main product catalog with full e-commerce features
- **`product_variants`** - Product variations (size, color, storage, etc.)

#### Shopping & Orders
- **`carts`** - Shopping cart for authenticated and guest users
- **`cart_items`** - Individual items in shopping carts
- **`wishlists`** - User wishlist management
- **`wishlist_items`** - Items in user wishlists
- **`orders`** - Order management with full order lifecycle
- **`order_items`** - Individual items in orders with product snapshots
- **`order_tracking`** - Order status tracking and updates

#### Reviews & Marketing
- **`reviews`** - Product reviews and ratings system
- **`coupons`** - Discount codes and promotional offers
- **`coupon_usage`** - Tracking of coupon usage by users

### Key Features

#### Security
- **Row Level Security (RLS)** enabled on all tables
- Comprehensive policies for user data access
- Admin and vendor role-based permissions
- Guest user support for carts

#### Performance
- Optimized indexes for all common queries
- Full-text search support for products
- GIN indexes for array and JSONB columns
- Efficient foreign key relationships

#### Functionality
- **Automatic timestamps** with triggers
- **Order number generation** with sequences
- **Product rating calculation** with triggers
- **Inventory tracking** with stock management
- **Product variants** for size, color, storage options
- **Flexible pricing** with original and sale prices

### Sample Data

The `sample_data.sql` file includes:
- **8 categories**: Electronics, Clothing, Home & Garden, Sports, Beauty, Books, Automotive, Health
- **50+ products** across all categories with realistic data
- **Product variants** for clothing (sizes/colors) and electronics (storage/colors)
- **5 sample coupons** with different discount types
- **Realistic product ratings** and review counts

## Security Features

- **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
- **SQL Injection Prevention**: Parameterized queries and input validation
- **Rate Limiting**: API request throttling to prevent abuse
- **Authentication**: Secure user authentication with Supabase Auth
- **Authorization**: Role-based access control with RLS policies
- **Data Validation**: Comprehensive form validation on client and server

## Performance Optimizations

- **Lazy Loading**: Images and components loaded on demand
- **Caching**: API responses cached for improved performance
- **Code Splitting**: Dynamic imports for route-based code splitting
- **Debouncing**: Search and API calls debounced to reduce load
- **Optimistic Updates**: UI updates before server confirmation

## Accessibility Features

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: WCAG compliant color schemes
- **Focus Management**: Proper focus handling in modals and forms
- **Alternative Text**: Descriptive alt text for images

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Documentation

- 📋 [Setup Guide](SETUP.md) - Detailed installation and configuration
- 🧪 [Testing Guide](TESTING.md) - Comprehensive testing procedures
- 🚀 [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository.

---

*This project was generated through Alpha. For more information, visit [dualite.dev](https://dualite.dev).*
