# E-Commerce Platform Deployment Guide

## Overview

This guide covers deploying the e-commerce platform to production environments with recommended hosting providers and best practices.

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] Build process verified
- [ ] Error handling implemented
- [ ] Security measures in place

### 2. Production Environment Setup
- [ ] Domain name registered
- [ ] SSL certificate ready
- [ ] CDN configured (optional)
- [ ] Monitoring tools setup
- [ ] Backup strategy planned

## Recommended Hosting Providers

### Frontend Hosting

#### Netlify (Recommended)
**Pros:** Easy deployment, automatic builds, form handling, edge functions
**Cons:** Limited server-side functionality

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables (in Netlify dashboard)
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

#### Vercel
**Pros:** Excellent Next.js support, serverless functions, global CDN
**Cons:** Build time limits on free tier

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### AWS Amplify
**Pros:** Full AWS integration, scalable, comprehensive features
**Cons:** More complex setup, higher cost

### Backend & Database

#### Supabase (Recommended)
**Pros:** PostgreSQL, real-time, auth, storage, edge functions
**Cons:** Vendor lock-in, pricing at scale

**Production Setup:**
1. Create production Supabase project
2. Apply database schema
3. Configure RLS policies
4. Set up authentication providers
5. Configure storage buckets

## Deployment Steps

### 1. Supabase Production Setup

```sql
-- Run in Supabase SQL Editor
-- Copy contents from supabase_schema_fixed.sql
```

**Environment Configuration:**
```env
# Production .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_APP_ENV=production
```

### 2. Frontend Deployment (Netlify)

**Option A: Git Integration**
1. Connect GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables
4. Deploy

**Option B: Manual Deployment**
```bash
# Build for production
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### 3. Domain Configuration

**Custom Domain Setup:**
1. Add custom domain in hosting provider
2. Configure DNS records
3. Enable HTTPS/SSL
4. Set up redirects

**DNS Records:**
```
Type: A
Name: @
Value: [hosting_provider_ip]

Type: CNAME
Name: www
Value: your-domain.com
```

### 4. Environment Variables

**Production Variables:**
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# App Configuration
VITE_APP_ENV=production
VITE_APP_NAME="Your Store Name"
VITE_APP_VERSION=1.0.0

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID

# Payment (when implemented)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Performance Optimization

### 1. Build Optimization

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### 2. Image Optimization

```javascript
// Use optimized image URLs
const optimizedImageUrl = (url, width = 800, height = 800) => {
  return `${url}?w=${width}&h=${height}&fit=crop&auto=format`;
};
```

### 3. Caching Strategy

**Netlify Headers:**
```
# netlify.toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Security Configuration

### 1. Content Security Policy

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.supabase.co;">
```

### 2. Environment Security

- Never commit `.env` files
- Use different keys for production
- Rotate keys regularly
- Monitor for exposed secrets

### 3. Supabase Security

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ... for all tables

-- Review and test all RLS policies
-- Ensure proper user isolation
-- Validate admin access controls
```

## Monitoring & Analytics

### 1. Error Tracking

**Sentry Integration:**
```bash
npm install @sentry/react @sentry/tracing
```

```javascript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.VITE_APP_ENV,
});
```

### 2. Performance Monitoring

**Web Vitals:**
```javascript
// utils/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric) => {
  // Send to your analytics service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 3. Business Analytics

**Google Analytics 4:**
```javascript
// utils/gtag.ts
export const GA_TRACKING_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
```

## Backup & Recovery

### 1. Database Backups

**Supabase Backups:**
- Enable automatic daily backups
- Test restore procedures
- Document recovery steps

### 2. Code Backups

- Use Git for version control
- Tag releases
- Maintain deployment history

## Post-Deployment Tasks

### 1. Verification Checklist
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Database connections active
- [ ] Forms submit properly
- [ ] Images display correctly
- [ ] Mobile responsiveness verified
- [ ] SSL certificate active
- [ ] Analytics tracking
- [ ] Error monitoring active

### 2. Performance Testing
- [ ] Page load speeds acceptable
- [ ] Database queries optimized
- [ ] CDN functioning
- [ ] Caching working

### 3. Security Verification
- [ ] HTTPS enforced
- [ ] Security headers set
- [ ] API endpoints secured
- [ ] User data protected

## Maintenance

### Regular Tasks
- Monitor error rates
- Review performance metrics
- Update dependencies
- Backup verification
- Security patches
- Content updates

### Scaling Considerations
- Database performance monitoring
- CDN usage optimization
- Server resource utilization
- User growth planning

## Troubleshooting

### Common Issues

**Build Failures:**
- Check environment variables
- Verify dependencies
- Review build logs
- Test locally first

**Database Connection Issues:**
- Verify Supabase URL/keys
- Check RLS policies
- Review network settings
- Test with Supabase client

**Performance Problems:**
- Analyze bundle size
- Check image optimization
- Review database queries
- Monitor network requests

## Support & Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Performance Guide](https://react.dev/learn/render-and-commit)
