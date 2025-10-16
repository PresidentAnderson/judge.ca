# WisdomOS Web Troubleshooting Guide

[![Support](https://img.shields.io/badge/Support-24%2F7-blue.svg)](https://github.com/your-org/wisdomos-web)
[![FAQ](https://img.shields.io/badge/FAQ-Updated-green.svg)](https://github.com/your-org/wisdomos-web/wiki)
[![Status](https://img.shields.io/badge/Status-Operational-brightgreen.svg)](https://status.example.com)

This comprehensive troubleshooting guide helps you quickly identify and resolve common issues with WisdomOS Web. Whether you're a user, developer, or administrator, you'll find solutions to the most frequently encountered problems.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [User Issues](#user-issues)
- [Authentication Problems](#authentication-problems)
- [Data & Sync Issues](#data--sync-issues)
- [Performance Problems](#performance-problems)
- [Development Issues](#development-issues)
- [Deployment Problems](#deployment-problems)
- [Database Issues](#database-issues)
- [Network & Connectivity](#network--connectivity)
- [Browser-Specific Issues](#browser-specific-issues)
- [Mobile Issues](#mobile-issues)
- [API Troubleshooting](#api-troubleshooting)
- [Getting Help](#getting-help)

## Quick Diagnostics

### System Health Check

Before diving into specific issues, run this quick health check:

```bash
# 1. Check application status
curl https://your-domain.com/api/health

# 2. Verify DNS resolution
nslookup your-domain.com

# 3. Test SSL certificate
curl -I https://your-domain.com

# 4. Check browser console for errors
# Open Developer Tools (F12) > Console tab
```

### Common Issue Patterns

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|----------|
| Page won't load | DNS/SSL issue | Clear browser cache, check internet |
| Login fails | Auth service down | Check Stack Auth status |
| Data not syncing | API connectivity | Check network, refresh page |
| Slow performance | Network/CDN issue | Try different network |
| Features missing | Browser compatibility | Update browser |

---

## User Issues

### Cannot Access Account

**Problem**: User cannot log in or access their account

**Solutions**:

1. **Check Credentials**:
   ```
   ✅ Verify email address spelling
   ✅ Check if caps lock is on
   ✅ Try typing password in a text editor first
   ✅ Check for extra spaces
   ```

2. **Reset Password**:
   - Click "Forgot Password" on login page
   - Check email for reset link (including spam folder)
   - Follow the reset instructions
   - Try logging in with new password

3. **Clear Browser Data**:
   ```bash
   # Chrome/Edge: Ctrl+Shift+Delete
   # Firefox: Ctrl+Shift+Delete
   # Safari: Cmd+Option+E
   
   Clear:
   ✅ Cookies and site data
   ✅ Cached images and files
   ✅ Browsing history (optional)
   ```

4. **Try Different Browser**:
   - Test with Chrome, Firefox, Safari, or Edge
   - Disable browser extensions temporarily
   - Try incognito/private mode

### Data Not Appearing

**Problem**: Journal entries, habits, or other data not showing

**Diagnostic Steps**:

1. **Check Network Connection**:
   ```bash
   # Test API connectivity
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-domain.com/api/journal
   ```

2. **Verify Data Exists**:
   - Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)
   - Check if data appears in different sections
   - Look for data in dashboard vs. individual pages

3. **Browser Console Errors**:
   - Open Developer Tools (F12)
   - Check Console tab for error messages
   - Look for network errors in Network tab

**Common Solutions**:
- Refresh the page
- Clear browser cache
- Check internet connection
- Try different browser
- Contact support if data is truly missing

### Features Not Working

**Problem**: Buttons, forms, or features not responding

**Troubleshooting**:

1. **JavaScript Errors**:
   ```javascript
   // Check browser console for errors like:
   // "Uncaught TypeError"
   // "Script error"
   // "Network error"
   ```

2. **Browser Compatibility**:
   - Ensure browser is up to date
   - Check if JavaScript is enabled
   - Disable ad blockers temporarily

3. **Clear Site Data**:
   - Right-click page → Inspect Element
   - Application/Storage tab
   - Clear storage for the site

---

## Authentication Problems

### Login Failures

**Stack Auth Integration Issues**:

1. **Check Stack Auth Status**:
   ```bash
   # Verify JWKS endpoint is accessible
   curl https://api.stack-auth.com/api/v1/projects/098f28b2-c387-4e71-8dab-bc81b9643abd/.well-known/jwks.json
   ```

2. **Token Validation Issues**:
   ```javascript
   // Check token in browser developer tools
   localStorage.getItem('stack-auth-token')
   // or
   document.cookie
   ```

3. **Common Auth Errors**:
   | Error Message | Cause | Solution |
   |---------------|-------|----------|
   | "Invalid token" | Expired JWT | Re-login required |
   | "Unauthorized" | Missing token | Check token storage |
   | "Forbidden" | Insufficient permissions | Contact support |
   | "Service unavailable" | Auth service down | Wait and retry |

### Session Expiry

**Problem**: User gets logged out frequently

**Solutions**:
- Check if "Remember Me" is selected
- Verify browser accepts cookies
- Clear corrupted session data
- Contact support for session timeout adjustments

### OAuth Issues

**Problem**: Google/GitHub login not working

**Diagnostic**:
1. Check if OAuth is enabled in Stack Auth
2. Verify redirect URLs are configured correctly
3. Test with different OAuth provider
4. Check browser popup blockers

---

## Data & Sync Issues

### Data Not Saving

**Problem**: Journal entries, habits, or changes not persisting

**Diagnostic Steps**:

1. **Check Network Requests**:
   ```bash
   # Open browser DevTools → Network tab
   # Look for failed POST/PUT requests
   # Status codes: 400, 401, 403, 500
   ```

2. **Validation Errors**:
   ```javascript
   // Common validation issues:
   {
     "error": "Validation error",
     "details": [
       {
         "path": ["content"],
         "message": "Content is required"
       }
     ]
   }
   ```

3. **Database Connection**:
   ```bash
   # Test API health
   curl https://your-domain.com/api/health
   ```

**Solutions**:
- Ensure all required fields are filled
- Check character limits (content < 10,000 chars)
- Verify internet connection
- Try saving again after page refresh

### Sync Conflicts

**Problem**: Changes made on different devices conflict

**Prevention**:
- Always sync before making changes
- Avoid simultaneous editing on multiple devices
- Use the "Last Modified" timestamp as reference

**Resolution**:
- Choose the version to keep
- Manually merge changes if needed
- Contact support for complex conflicts

### Missing Data

**Problem**: Previously saved data is missing

**Investigation Steps**:

1. **Check Data Export**:
   - Go to Profile → Data Export
   - Download your data to verify what exists
   - Look for patterns in missing data

2. **Review Activity Timeline**:
   - Check when data was last modified
   - Look for bulk deletion patterns
   - Verify user account integrity

3. **Database Query** (for developers):
   ```sql
   -- Check for soft-deleted records
   SELECT * FROM journal_entries 
   WHERE user_id = 'USER_ID' 
   AND deleted_at IS NOT NULL;
   ```

---

## Performance Problems

### Slow Loading

**Problem**: Pages load slowly or timeout

**Diagnostic Tools**:

1. **Browser Performance**:
   ```javascript
   // Check loading times in DevTools
   // Network tab → Look for:
   // - Large bundle sizes (>1MB)
   // - Slow API calls (>2 seconds)
   // - Failed resource loads
   ```

2. **Network Analysis**:
   ```bash
   # Test connection speed
   curl -o /dev/null -s -w "Time: %{time_total}s\n" https://your-domain.com
   
   # Check CDN performance
   curl -H "Accept-Encoding: gzip" -o /dev/null -s -w "Size: %{size_download} bytes\nTime: %{time_total}s\n" https://your-domain.com
   ```

**Optimization Steps**:
1. **Clear Browser Cache**: Ctrl+Shift+Delete
2. **Check Internet Speed**: Use speedtest.net
3. **Try Different Network**: Mobile hotspot vs. WiFi
4. **Disable Extensions**: Test in incognito mode
5. **Update Browser**: Ensure latest version

### Memory Issues

**Problem**: Browser becomes unresponsive or crashes

**Solutions**:
- Close other browser tabs
- Restart the browser
- Clear browser cache and cookies
- Check available system RAM
- Try a different browser

**Prevention**:
- Regularly restart browser
- Keep browser updated
- Monitor system resources
- Use browser task manager (Shift+Esc in Chrome)

---

## Development Issues

### Local Development Setup

**Problem**: Cannot start development server

**Common Issues & Fixes**:

1. **Node.js Version**:
   ```bash
   # Check version
   node --version  # Should be >= 18.17.0
   
   # Update if needed
   nvm install 18.17.0
   nvm use 18.17.0
   ```

2. **Dependencies**:
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   
   # Check for peer dependency issues
   npm ls
   ```

3. **Environment Variables**:
   ```bash
   # Verify .env.local exists and has required variables
   cat .env.local | grep -E "(DATABASE_URL|NEON_API_KEY|JWT_SECRET)"
   
   # Test environment loading
   node -e "console.log('DB:', process.env.DATABASE_URL ? 'SET' : 'MISSING')"
   ```

### Build Failures

**Problem**: `npm run build` fails

**Common Solutions**:

1. **TypeScript Errors**:
   ```bash
   # Run type checking
   npm run type-check
   
   # Fix TypeScript errors
   # Update type definitions
   npm install @types/node@latest
   ```

2. **ESLint Errors**:
   ```bash
   # Run linting
   npm run lint
   
   # Auto-fix issues
   npm run lint:fix
   ```

3. **Memory Issues**:
   ```bash
   # Increase memory for build
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

### Hot Reload Issues

**Problem**: Changes not reflecting in development

**Solutions**:
1. Restart development server
2. Clear browser cache (hard refresh)
3. Check file system permissions
4. Verify file paths are correct
5. Check for syntax errors in modified files

---

## Deployment Problems

### Build Deployment Failures

**Problem**: Netlify deployment fails

**Common Issues**:

1. **Build Command Errors**:
   ```bash
   # Check build logs in Netlify dashboard
   # Common issues:
   # - Missing environment variables
   # - TypeScript errors
   # - Dependency conflicts
   ```

2. **Environment Variables**:
   ```bash
   # Verify in Netlify dashboard
   # Site Settings → Environment Variables
   
   # Required variables:
   DATABASE_URL
   NEON_API_KEY
   STACK_AUTH_PROJECT_ID
   JWT_SECRET
   ```

3. **Build Settings**:
   ```toml
   # netlify.toml
   [build]
   command = "npm run build"
   publish = ".next"
   
   [build.environment]
   NODE_VERSION = "18.17.0"
   ```

### Function Deployment Issues

**Problem**: API routes not working after deployment

**Diagnostic**:
```bash
# Test API endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/.netlify/functions/api/health

# Check function logs in Netlify dashboard
```

**Solutions**:
- Verify function build configuration
- Check API route export syntax
- Ensure dependencies are installed
- Review function timeout settings

---

## Database Issues

### Connection Problems

**Problem**: Cannot connect to Neon database

**Diagnostic Steps**:

1. **Test Direct Connection**:
   ```bash
   # Test PostgreSQL connection
   psql $DATABASE_URL -c "SELECT version();"
   ```

2. **Test Data API**:
   ```bash
   # Test Neon Data API
   curl -X POST "$NEON_API_ENDPOINT/query" \
     -H "Authorization: Bearer $NEON_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"query": "SELECT 1 as test"}'
   ```

**Common Solutions**:
- Verify database URL format
- Check API key validity
- Confirm database exists and is active
- Review connection limits
- Test from different network

### Query Performance

**Problem**: Database queries are slow

**Optimization**:

1. **Add Indexes**:
   ```sql
   -- Common performance indexes
   CREATE INDEX IF NOT EXISTS idx_journal_user_created 
     ON journal_entries(user_id, created_at DESC);
   
   CREATE INDEX IF NOT EXISTS idx_habits_user_active 
     ON habits(user_id) WHERE is_active = true;
   ```

2. **Query Optimization**:
   ```typescript
   // Use limit and pagination
   const entries = await JournalModel.findMany({
     user_id: userId
   }, {
     limit: 50,
     offset: page * 50,
     order: 'created_at desc'
   });
   ```

### Data Migration Issues

**Problem**: Schema changes break application

**Safe Migration Process**:

1. **Test on Branch Database**:
   ```bash
   # Create test branch
   neonctl branches create --name migration-test
   
   # Apply migration to test branch
   psql $TEST_DATABASE_URL < migration.sql
   
   # Test application with test branch
   ```

2. **Rollback Plan**:
   ```sql
   -- Always create rollback scripts
   -- migration_rollback.sql
   DROP INDEX IF EXISTS new_index;
   ALTER TABLE table_name DROP COLUMN IF EXISTS new_column;
   ```

---

## Network & Connectivity

### CORS Issues

**Problem**: Cross-origin request blocked

**Solutions**:

1. **Check CORS Headers**:
   ```javascript
   // Verify response headers
   fetch('https://your-domain.com/api/journal')
     .then(response => {
       console.log('CORS headers:', {
         'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
         'access-control-allow-methods': response.headers.get('access-control-allow-methods')
       });
     });
   ```

2. **Configure CORS** (for developers):
   ```typescript
   // Add to API routes
   const corsHeaders = {
     'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
       ? 'https://your-domain.com' 
       : 'http://localhost:3000',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization'
   };
   ```

### SSL Certificate Issues

**Problem**: SSL/TLS certificate errors

**Diagnostic**:
```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate chain
curl -vI https://your-domain.com 2>&1 | grep -E "(SSL|TLS|certificate)"
```

**Solutions**:
- Wait for certificate propagation (up to 24 hours)
- Verify DNS configuration
- Contact Netlify support for certificate issues
- Clear browser SSL cache

### CDN Issues

**Problem**: Static assets not loading or outdated

**Solutions**:

1. **Cache Invalidation**:
   ```bash
   # Force cache refresh
   curl -X POST "https://api.netlify.com/api/v1/sites/SITE_ID/deploys" \
     -H "Authorization: Bearer NETLIFY_TOKEN" \
     -d '{"branch": "main"}'
   ```

2. **Bypass CDN Cache**:
   ```bash
   # Add cache-busting parameter
   https://your-domain.com/asset.js?v=timestamp
   ```

---

## Browser-Specific Issues

### Chrome Issues

**Common Problems**:
- Extensions interfering with functionality
- Memory usage causing crashes
- Cache corruption

**Solutions**:
```bash
# Reset Chrome
chrome://settings/reset

# Clear site data
chrome://settings/content/all

# Disable extensions
chrome://extensions/
```

### Safari Issues

**Common Problems**:
- Strict cookie policies
- Limited localStorage
- WebKit rendering differences

**Solutions**:
- Enable cross-site tracking (for auth)
- Clear website data: Safari → Preferences → Privacy
- Update to latest Safari version

### Firefox Issues

**Common Problems**:
- Tracking protection blocking resources
- Strict security settings
- Add-on conflicts

**Solutions**:
- Disable Enhanced Tracking Protection for site
- Check Content Blocking settings
- Test in private window

---

## Mobile Issues

### Mobile Browser Problems

**Common Issues**:
- Touch events not working
- Responsive layout issues
- iOS Safari specific bugs

**Diagnostic**:
```javascript
// Check mobile user agent
console.log(navigator.userAgent);

// Test touch support
console.log('Touch support:', 'ontouchstart' in window);

// Check viewport
console.log('Viewport:', window.innerWidth + 'x' + window.innerHeight);
```

**Solutions**:
- Clear mobile browser cache
- Update mobile browser
- Try different mobile browser
- Check responsive design in desktop browser

### App-like Experience Issues

**Problem**: PWA features not working

**Solutions**:
1. Check manifest.json is accessible
2. Verify service worker registration
3. Ensure HTTPS is enabled
4. Test "Add to Home Screen" functionality

---

## API Troubleshooting

### API Request Failures

**Diagnostic Tools**:

```bash
# Test API endpoints
# Health check
curl -v https://your-domain.com/api/health

# Authenticated request
curl -v -H "Authorization: Bearer TOKEN" \
     https://your-domain.com/api/journal

# POST request
curl -v -X POST \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","content":"Test content"}' \
     https://your-domain.com/api/journal
```

### Rate Limiting Issues

**Problem**: API requests being throttled

**Solutions**:
- Implement exponential backoff
- Reduce request frequency
- Contact support for rate limit increase
- Use bulk operations where available

### API Response Issues

**Common Error Codes**:

| Status | Meaning | Common Cause | Solution |
|--------|---------|--------------|----------|
| 400 | Bad Request | Invalid data format | Check request body |
| 401 | Unauthorized | Missing/invalid token | Re-authenticate |
| 403 | Forbidden | Insufficient permissions | Check user roles |
| 404 | Not Found | Resource doesn't exist | Verify resource ID |
| 429 | Too Many Requests | Rate limit exceeded | Implement backoff |
| 500 | Internal Server Error | Server-side issue | Contact support |
| 503 | Service Unavailable | Temporary outage | Retry later |

---

## Getting Help

### Self-Service Resources

1. **Documentation**:
   - [User Guide](./user-guide.md) - Complete feature walkthrough
   - [Developer Guide](./developer-guide.md) - Technical documentation
   - [API Documentation](./api/README.md) - API reference

2. **Status Pages**:
   - Application Status: https://status.wisdomos.com
   - Netlify Status: https://www.netlifystatus.com/
   - Neon Status: https://neon.tech/status
   - Stack Auth Status: https://status.stack-auth.com

3. **Community Resources**:
   - GitHub Discussions: Ask questions and share solutions
   - FAQ: Frequently asked questions and answers
   - Community Forums: Connect with other users

### Contact Support

**Before Contacting Support**:

Gather this information:
- **What you were trying to do**: Specific action or task
- **What happened**: Actual behavior or error
- **What you expected**: Expected behavior
- **Browser/Device**: Chrome 119, iPhone 15, etc.
- **Error Messages**: Exact error text or screenshots
- **Steps to Reproduce**: Detailed steps to recreate the issue
- **Account Information**: Email address (never share passwords)

**Support Channels**:

| Issue Type | Response Time | Contact Method |
|------------|---------------|----------------|
| Critical (service down) | 1 hour | emergency@wisdomos.com |
| High (feature broken) | 4 hours | support@wisdomos.com |
| Medium (minor issues) | 24 hours | support@wisdomos.com |
| Low (questions) | 48 hours | help@wisdomos.com |

### Bug Reports

**GitHub Issues**: [Report a Bug](https://github.com/your-org/wisdomos-web/issues/new?template=bug_report.md)

**Include**:
- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots or screen recordings
- Browser/device information
- Console errors (if applicable)

### Feature Requests

**GitHub Discussions**: [Request a Feature](https://github.com/your-org/wisdomos-web/discussions/categories/ideas)

**Include**:
- Clear description of the requested feature
- Use case and benefits
- Mockups or examples (if applicable)
- Priority and impact assessment

---

## Troubleshooting Checklist

### Quick Fixes (Try First)

- [ ] Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- [ ] Clear browser cache and cookies
- [ ] Try incognito/private browsing mode
- [ ] Check internet connection
- [ ] Try a different browser
- [ ] Restart browser completely
- [ ] Check if others can access the site

### System Information Gathering

```javascript
// Run this in browser console to gather system info
console.log({
  userAgent: navigator.userAgent,
  url: window.location.href,
  timestamp: new Date().toISOString(),
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  },
  localStorage: {
    available: typeof Storage !== 'undefined',
    usage: JSON.stringify(localStorage).length
  },
  cookies: {
    enabled: navigator.cookieEnabled,
    count: document.cookie.split(';').length
  }
});
```

### Error Reporting Template

```markdown
## Bug Report

**Description**: Brief description of the issue

**Steps to Reproduce**:
1. Go to...
2. Click on...
3. Scroll down to...
4. See error

**Expected Behavior**: What you expected to happen

**Actual Behavior**: What actually happened

**Screenshots**: If applicable, add screenshots

**Environment**:
- Browser: [e.g. Chrome 119.0.6045.105]
- OS: [e.g. macOS 14.0]
- Device: [e.g. MacBook Pro, iPhone 15]
- Screen Resolution: [e.g. 1920x1080]

**Additional Context**: Any other relevant information
```

---

**Last Updated**: October 2024  
**Troubleshooting Guide Version**: 1.0.0  
**Next Review**: January 2024

For immediate assistance, contact support@wisdomos.com or visit our [Help Center](https://help.wisdomos.com).