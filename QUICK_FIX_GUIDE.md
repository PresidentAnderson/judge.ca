# Quick Fix Guide - Judge.ca Build Errors

## Critical Fixes (Must Do Before Deployment)

### 1. Install Missing Dependencies (5 minutes)

```bash
cd "/Volumes/DevOPS 2025/01_DEVOPS_PLATFORM/judge.ca"

# Install all missing packages at once
npm install --save \
  googleapis \
  @microsoft/microsoft-graph-client \
  ical-generator \
  slugify \
  isomorphic-dompurify \
  firebase-admin \
  apn \
  expo-server-sdk \
  speakeasy \
  qrcode
```

### 2. Fix Redis Import Errors (2 files)

**File 1:** `src/backend/api/health.routes.ts`

Change line 3:
```typescript
// FROM:
import { redisService } from '../config/redis.config';

// TO:
import redis from '../config/redis.config';
```

**File 2:** `src/backend/middleware/monitoring.ts`

Change line 3:
```typescript
// FROM:
import { redisService } from '../config/redis.config';

// TO:
import redis from '../config/redis.config';
```

### 3. Fix Authentication Module Resolution (2 files)

**File 1:** `src/pages/api/auth/login.ts`

Change line 5:
```typescript
// FROM:
import { db } from '@/backend/utils/database';

// TO:
import { db } from '../../../src/backend/utils/database';
```

**File 2:** `src/pages/api/auth/register.ts`

Change line 5:
```typescript
// FROM:
import { db } from '@/backend/utils/database';

// TO:
import { db } from '../../../src/backend/utils/database';
```

### 4. Fix Backend Build Configuration

**File:** `tsconfig.server.json`

Replace entire file with:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist/backend",
    "rootDir": "./",
    "noEmit": false,
    "jsx": "react"
  },
  "include": ["src/backend/**/*", "src/shared/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "src/frontend/**/*",
    "*.js",
    "*.config.js",
    "knexfile.js"
  ]
}
```

### 5. Create Missing useAuth Hook

**Create file:** `src/hooks/useAuth.ts`

```typescript
import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'attorney' | 'admin';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
      return userData;
    }

    throw new Error('Login failed');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
};
```

## Verification Commands

After making the above fixes, run these commands to verify:

```bash
# 1. Verify dependencies are installed
npm list googleapis @microsoft/microsoft-graph-client ical-generator slugify

# 2. Run type check (should have far fewer errors)
npm run typecheck

# 3. Build frontend
npm run build

# 4. Build backend
npm run build:backend

# 5. Run tests
npm test

# 6. Start development server
npm run dev
```

## Expected Results

- **TypeScript errors:** Should drop from 155 to ~100 (removing critical blockers)
- **npm run build:** Should still succeed
- **npm run build:backend:** Should now succeed and create dist/backend/
- **Authentication endpoints:** Should work
- **Health checks:** Should work

## Still Need to Fix (Lower Priority)

After the critical fixes above, you'll still have ~100 TypeScript errors related to:
- Error type annotations (34 errors) - Non-blocking
- Type conversions (29 errors) - May cause runtime issues
- Union type guards (24 errors) - May cause runtime issues
- Implicit any parameters (23 errors) - Non-blocking

These can be fixed incrementally and won't prevent deployment.

## Quick Test After Fixes

```bash
# Start the app
npm run dev

# In another terminal, test the endpoints:

# Test health check
curl http://localhost:3000/api/health

# Test homepage loads
curl http://localhost:3000

# Test authentication endpoint exists
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Time Estimate

- **Step 1 (Dependencies):** 5 minutes
- **Steps 2-4 (File edits):** 10 minutes
- **Step 5 (Create hook):** 5 minutes
- **Verification:** 10 minutes
- **Total:** ~30 minutes

## Need Help?

If you encounter issues:

1. Check the full analysis: `BUILD_ERROR_ANALYSIS.md`
2. View raw typecheck errors: `npm run typecheck 2>&1 | less`
3. Check build logs: `npm run build 2>&1 | tee build.log`

---

**Last Updated:** October 30, 2025
**Status:** Critical fixes required before production deployment
