# S.Essences Application Runbook

## Table of Contents
1. [Overview](#overview)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Common Issues & Resolutions](#common-issues--resolutions)
4. [Database Troubleshooting](#database-troubleshooting)
5. [Performance Issues](#performance-issues)
6. [Security Incidents](#security-incidents)
7. [Deployment & Rollback](#deployment--rollback)
8. [Contact Information](#contact-information)

## Overview

This runbook provides guidance for on-call engineers supporting the S.Essences e-commerce application. It includes procedures for monitoring, troubleshooting, and resolving common issues.

### Application Architecture
- Frontend: React with TypeScript, Vite build system
- Backend: Supabase (PostgreSQL, Auth, Storage, Functions)
- Hosting: Vercel/Netlify
- Monitoring: Sentry, LogRocket
- CI/CD: GitHub Actions

## Monitoring & Alerting

### Key Metrics to Monitor
1. **Error Rate**: Application errors, API failures
2. **Response Time**: Page load times, API response times
3. **Database Performance**: Query execution times, connection pool usage
4. **Authentication**: Login failures, session issues
5. **E-commerce Functions**: Cart operations, checkout process, payment processing

### Alert Thresholds
- Error rate > 1% for 5 minutes
- Response time > 2 seconds for 10 minutes
- Database connection pool usage > 80%
- Authentication failure rate > 5% for 5 minutes

### Monitoring Tools
1. **Sentry**: Error tracking and performance monitoring
2. **LogRocket**: Session replay and user behavior tracking
3. **Supabase Dashboard**: Database performance and logs
4. **Vercel/Netlify Analytics**: Frontend performance and deployment status

## Common Issues & Resolutions

### 1. Authentication Issues
**Symptoms**: Users unable to log in, session timeouts, 401 errors

**Troubleshooting Steps**:
1. Check Supabase Auth service status
2. Verify JWT token validity
3. Review RLS policies in database
4. Check for rate limiting

**Resolution**:
- Reset user password if needed
- Clear browser storage and cache
- Restart authentication service if applicable
- Apply RLS policy fixes if recursion detected

### 2. Database Connection Issues
**Symptoms**: Slow queries, connection timeouts, "database unavailable" errors

**Troubleshooting Steps**:
1. Check database connection pool usage
2. Review slow query logs
3. Verify RLS policies are not causing recursion
4. Check for long-running transactions

**Resolution**:
- Optimize slow queries
- Increase connection pool size if needed
- Apply RLS policy fixes from `rls_policies_fix.sql`
- Restart database service if necessary

### 3. Performance Degradation
**Symptoms**: Slow page loads, delayed API responses

**Troubleshooting Steps**:
1. Check frontend performance metrics (LCP, FID, CLS)
2. Review API response times
3. Analyze bundle sizes
4. Check CDN performance

**Resolution**:
- Optimize images using `vite-plugin-image-optimizer`
- Implement code splitting for large bundles
- Add caching headers
- Preload critical resources

### 4. Payment Processing Failures
**Symptoms**: Checkout failures, payment errors

**Troubleshooting Steps**:
1. Check payment provider status (Stripe, etc.)
2. Review payment logs
3. Verify webhook configurations
4. Check for network connectivity issues

**Resolution**:
- Retry failed payments
- Update payment provider configurations
- Verify webhook endpoints
- Contact payment provider support if needed

## Database Troubleshooting

### RLS Policy Issues
**Symptoms**: Infinite recursion errors, permission denied errors

**Resolution**:
1. Apply the RLS policy fix script:
   ```sql
   -- Run rls_policies_fix.sql in Supabase SQL editor
   ```
2. Verify policies are applied correctly
3. Test with different user roles

### Query Performance
**Symptoms**: Slow database queries, timeouts

**Resolution**:
1. Identify slow queries using Supabase query logs
2. Add appropriate indexes:
   ```sql
   CREATE INDEX idx_products_category ON products(category);
   CREATE INDEX idx_orders_user_id ON orders(user_id);
   ```
3. Optimize complex queries
4. Consider materialized views for expensive aggregations

### Connection Pool Exhaustion
**Symptoms**: Database connection errors, timeouts

**Resolution**:
1. Increase connection pool size in Supabase settings
2. Optimize queries to reduce connection time
3. Implement connection pooling in application code
4. Add retry logic with exponential backoff

## Performance Issues

### Frontend Performance
**Symptoms**: Slow LCP, high bundle sizes, poor Core Web Vitals

**Resolution**:
1. Optimize images:
   - Use WebP/AVIF formats
   - Implement proper sizing
   - Enable compression with `vite-plugin-image-optimizer`
2. Code splitting:
   - Lazy load non-critical components
   - Use dynamic imports for large libraries
3. Caching:
   - Implement HTTP caching headers
   - Use service workers for offline support
4. Bundle optimization:
   - Remove unused dependencies
   - Minify CSS/JS
   - Enable tree shaking

### API Performance
**Symptoms**: Slow API responses, timeouts

**Resolution**:
1. Implement caching strategies:
   - HTTP caching with proper headers
   - In-memory caching for frequently accessed data
2. Optimize database queries:
   - Add indexes for common query patterns
   - Use pagination for large result sets
3. Implement request batching:
   - Combine multiple requests into single calls
4. Add CDN for static assets

## Security Incidents

### Unauthorized Access
**Symptoms**: Suspicious user activity, data access violations

**Response**:
1. Immediately revoke affected user sessions
2. Review audit logs for suspicious activity
3. Rotate compromised credentials
4. Update RLS policies if needed
5. Notify security team

### Data Breach
**Symptoms**: Unauthorized data access, data exfiltration

**Response**:
1. Isolate affected systems
2. Preserve evidence for forensic analysis
3. Notify incident response team
4. Follow data breach notification procedures
5. Implement additional security measures

### DDoS Attack
**Symptoms**: Service unavailability, high traffic volumes

**Response**:
1. Enable rate limiting
2. Activate DDoS protection services
3. Scale infrastructure if possible
4. Block malicious IP addresses
5. Coordinate with hosting provider

## Deployment & Rollback

### Deployment Process
1. Verify all tests pass in CI pipeline
2. Deploy to staging environment first
3. Run smoke tests on staging
4. Deploy to production during maintenance window
5. Monitor key metrics post-deployment

### Rollback Procedure
1. Identify the problematic deployment
2. Revert to the previous stable version:
   ```bash
   # For Vercel
   vercel rollback <deployment-url>
   
   # For Netlify
   netlify deploy --prod --dir=dist-previous
   ```
3. Verify application functionality
4. Notify stakeholders of rollback
5. Investigate root cause of failure

### Database Migrations
1. Always backup database before applying migrations
2. Test migrations in staging first
3. Apply migrations during low-traffic periods
4. Have rollback plan for each migration
5. Monitor database performance post-migration

## Contact Information

### Primary On-Call Engineer
- Name: [Primary Engineer Name]
- Phone: [Phone Number]
- Email: [Email Address]

### Secondary On-Call Engineer
- Name: [Secondary Engineer Name]
- Phone: [Phone Number]
- Email: [Email Address]

### Database Administrator
- Name: [DBA Name]
- Phone: [Phone Number]
- Email: [Email Address]

### Security Team
- Email: [Security Team Email]
- Phone: [Security Team Phone]

### Vendor Contacts
- Supabase Support: https://supabase.com/support
- Hosting Provider (Vercel/Netlify): Support portals
- Payment Provider: Vendor support contacts

## Escalation Process

1. **Level 1**: Handle by on-call engineer using this runbook
2. **Level 2**: Escalate to team lead if issue persists > 30 minutes
3. **Level 3**: Escalate to CTO/Engineering Director for critical outages
4. **External**: Contact vendor support for platform issues

## Change History
- v1.0 (2025-09-05): Initial version