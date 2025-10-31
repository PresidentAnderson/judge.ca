# 🔑 Railway Token Setup Required

## ❌ Current Status: Deployment Failed

The GitHub Actions webhook deployment failed because the `RAILWAY_TOKEN` secret is missing from your GitHub repository.

**Error from workflow:**
```
RAILWAY_TOKEN: (empty)
Cannot login in non-interactive mode
Process completed with exit code 1
```

---

## ✅ Quick Fix (5 minutes)

### Step 1: Get Your Railway API Token

1. Open: https://railway.app/account/tokens
2. Click **"Create Token"**
3. Name it: `GitHub Actions Deploy`
4. **Copy the token** (it will look like: `railway_...`)
   - ⚠️ **Important**: Save it somewhere safe - Railway only shows it once!

---

### Step 2: Add Token to GitHub Secrets

1. Open: https://github.com/PresidentAnderson/judge.ca/settings/secrets/actions
2. Click **"New repository secret"**
3. Fill in:
   - **Name**: `RAILWAY_TOKEN`
   - **Value**: Paste your Railway token from Step 1
4. Click **"Add secret"**

---

### Step 3: Re-Deploy

**Option A: Re-run Failed Workflow**
1. Go to: https://github.com/PresidentAnderson/judge.ca/actions
2. Click on the failed "Deploy to Railway" run
3. Click **"Re-run all jobs"**

**Option B: Trigger New Deployment**
```bash
# Make a small change and push
echo "# Deployment test" >> README.md
git add README.md
git commit -m "Trigger Railway deployment"
git push origin master
```

**Option C: Manual Railway CLI Deployment**
```bash
# Run the automated deployment script
./deploy-railway-now.sh
```

---

## 🔍 Verify Token Setup

After adding the secret, verify it exists:

```bash
gh secret list
```

You should see:
```
RAILWAY_TOKEN  Updated YYYY-MM-DD
```

---

## 📋 What Happens After Token Setup

Once the token is configured:

1. ✅ GitHub Actions will authenticate with Railway
2. ✅ Workflow will link to project: `3ce7a059-22ef-440a-a6b1-24b345ad88d2`
3. ✅ Railway will build and deploy your application
4. ✅ Deployment URL will be generated
5. ✅ Health checks will verify the deployment

---

## 🚀 Post-Deployment Checklist

After successful deployment, configure Railway environment variables:

### Required Environment Variables

```bash
# Railway Dashboard: https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2/variables

# Core
NODE_ENV=production
PORT=3000

# Authentication (generate JWT secret)
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# Database (auto-provided by Railway PostgreSQL plugin)
DATABASE_URL=postgresql://...

# Redis (auto-provided by Railway Redis plugin)
REDIS_URL=redis://...

# Email (your SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payments (your Stripe keys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Frontend URL
FRONTEND_URL=https://your-app.up.railway.app
```

### Add Services in Railway

1. **PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway auto-provides `DATABASE_URL`

2. **Redis Cache**
   - Click "New" → "Database" → "Redis"
   - Railway auto-provides `REDIS_URL`

---

## 📊 Monitoring Deployment

### View Live Logs
```bash
railway logs
```

### Check Deployment Status
```bash
railway status
```

### View in Dashboard
https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2/deployments

---

## 🐛 Troubleshooting

### If deployment still fails after token setup:

1. **Check token is valid:**
   ```bash
   railway whoami
   ```

2. **Verify project exists:**
   ```bash
   railway projects
   ```

3. **Check workflow logs:**
   ```bash
   gh run list --limit 1
   gh run view --log
   ```

4. **Re-authenticate Railway CLI:**
   ```bash
   railway logout
   railway login
   ```

---

## 📁 Related Files

- **Webhook Configuration**: `.github/workflows/railway-deploy.yml`
- **Railway Config**: `railway.json`, `railway.toml`
- **Deployment Script**: `deploy-railway-now.sh`
- **Full Guide**: `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Webhook Setup**: `WEBHOOK_SETUP_GUIDE.md`

---

## ✨ Critical Fixes Applied

The following fixes were already committed (commit `b08c74d3a`):

✅ Fixed package.json start command path
✅ Fixed tsconfig.server.json build output
✅ Redis lazy connection with retry strategy
✅ Logger console-only transports for Railway
✅ Real database health checks implemented
✅ Added @types/speakeasy dependency

**The codebase is READY for deployment** - only the Railway token is needed!

---

*Generated: October 31, 2025*
*Last Deployment Attempt: Failed - Missing RAILWAY_TOKEN*
*Next Action: Add RAILWAY_TOKEN to GitHub Secrets*
