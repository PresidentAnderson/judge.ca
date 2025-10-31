# 🚀 Render.com Deployment - Quick Start Guide

**Date**: October 31, 2025
**Platform**: Render.com
**Deployment Time**: 10 minutes
**Difficulty**: Easy ✅

---

## 🎯 Why Render.com?

After struggling with Vercel (blocked) and Railway (token issues), Render.com is the best choice:

- ✅ **Simple GitHub integration** - Just 2 clicks, no tokens needed
- ✅ **Perfect for your stack** - Native Express.js + Socket.IO support
- ✅ **Free PostgreSQL included** - No separate database setup
- ✅ **Blueprint deployment** - `render.yaml` auto-configures everything
- ✅ **Reliable** - Used by thousands of production apps

---

## 📋 What's Already Done

I've created `render.yaml` which configures:
- ✅ Web service (Express + Next.js)
- ✅ PostgreSQL database
- ✅ Environment variables (auto-generated secrets)
- ✅ Health checks
- ✅ Build and start commands

**You just need to connect GitHub and click Deploy!**

---

## 🚀 Deployment Steps (3 Steps, 10 Minutes)

### Step 1: Create Render Account & Connect GitHub (3 minutes)

1. **Visit Render.com**:
   ```
   https://render.com
   ```

2. **Sign up with GitHub**:
   - Click **"Get Started"** or **"Sign Up"**
   - Click **"Sign up with GitHub"**
   - Authorize Render to access your GitHub account
   - Grant access to `PresidentAnderson/judge.ca` repository

---

### Step 2: Create Blueprint Deployment (2 minutes)

1. **From Render Dashboard**, click **"New +"** button

2. Select **"Blueprint"**

3. **Connect Repository**:
   - Select: `PresidentAnderson/judge.ca`
   - Branch: `master`
   - Render will automatically detect `render.yaml`

4. **Review Blueprint**:
   - You'll see:
     - ✅ Web Service: `judge-ca`
     - ✅ Database: `judge-ca-db`
   - Click **"Apply"**

5. **Service will start deploying automatically!**

---

### Step 3: Monitor Deployment (5-8 minutes)

Render will:
1. ✅ Create PostgreSQL database
2. ✅ Clone your repository
3. ✅ Install dependencies (`npm install`)
4. ✅ Build backend (`npm run build:backend`)
5. ✅ Build frontend (`npm run build`)
6. ✅ Start application (`npm start`)
7. ✅ Assign URL: `https://judge-ca.onrender.com`

**Watch the build logs in real-time!**

---

## 🎉 That's It!

Once deployment completes:
- ✅ Application is live
- ✅ Database is connected
- ✅ URL is available
- ✅ Health checks running

**No tokens, no CLI, no complexity!**

---

## 🔧 After Deployment: Configure Environment Variables

Some environment variables need manual configuration (Render marks them as `sync: false`):

### Required Variables (Add These)

1. **In Render Dashboard**, go to your service
2. Click **"Environment"** tab
3. Add these secrets:

#### Email Configuration (SMTP)
```
SMTP_HOST=smtp.gmail.com (or your provider)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@judge.ca
```

#### Stripe Payment (Optional - for payments)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Redis (Optional - for caching)
```
REDIS_URL=redis://your-redis-url
```
*(Or create Redis database in Render: New + → Redis)*

#### Twilio (Optional - for SMS 2FA)
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_VERIFY_SERVICE_SID=VA...
```

#### Sentry (Optional - for monitoring)
```
SENTRY_DSN=https://...@sentry.io/...
```

---

## 🗄️ Database Setup

### Auto-Created Database

Render automatically:
- ✅ Created PostgreSQL database
- ✅ Connected via `DATABASE_URL` environment variable
- ✅ Set up user and credentials

### Run Migrations

After first deployment, run database migrations:

1. **In Render Dashboard**:
   - Go to your service
   - Click **"Shell"** tab
   - Run:
     ```bash
     npm run db:migrate
     npm run db:seed
     ```

2. **Or use Render CLI** (optional):
   ```bash
   # Install Render CLI
   npm install -g @render-cli/cli

   # Login
   render login

   # Run migration
   render run --service judge-ca npm run db:migrate
   render run --service judge-ca npm run db:seed
   ```

---

## 📊 Monitoring & Management

### View Logs
- Render Dashboard → Your Service → **Logs** tab
- Real-time log streaming
- Filter by level, search

### View Metrics
- **Metrics** tab shows:
  - CPU usage
  - Memory usage
  - Request rate
  - Response times

### Custom Domain (Optional)
1. Go to **Settings** → **Custom Domains**
2. Add `judge.ca`
3. Configure DNS:
   ```
   CNAME judge.ca → judge-ca.onrender.com
   ```

---

## 🔄 Auto-Deploys

Render automatically deploys on every push to `master`:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin master

# Render automatically deploys!
```

No webhooks, no workflows, no tokens - just works!

---

## 🆘 Troubleshooting

### Build Fails

**Check build logs** in Render dashboard:
- Common issues: Missing dependencies, TypeScript errors
- Solution: Fix locally, push again

### Database Connection Issues

**Verify `DATABASE_URL`**:
- Go to Environment tab
- Check `DATABASE_URL` is set (auto-generated)
- Should look like: `postgresql://user:pass@host/db`

### Application Won't Start

**Check start command**:
- Settings → Build & Deploy
- Start Command should be: `npm start`
- Verify `dist/backend/server.js` exists after build

### Health Check Failing

**Verify health endpoint**:
```bash
curl https://judge-ca.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-31T..."
}
```

---

## 💡 Render vs Railway vs Vercel

| Feature | Render | Railway | Vercel |
|---------|--------|---------|--------|
| **Setup Complexity** | ⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Hard |
| **Token Management** | ✅ None | ❌ Complex | ❌ Account blocked |
| **Express.js Support** | ✅ Native | ✅ Yes | ❌ Serverless only |
| **WebSocket Support** | ✅ Yes | ✅ Yes | ❌ Limited |
| **Free Database** | ✅ PostgreSQL | ✅ PostgreSQL | ❌ None |
| **Documentation** | ✅ Excellent | ⭐ Good | ✅ Excellent |
| **Deployment Speed** | ⭐ 5-8 min | ⭐ 5-8 min | ⭐ 3-5 min |

**Winner for judge.ca**: Render.com ✅

---

## 📚 Render Resources

- **Dashboard**: https://dashboard.render.com
- **Documentation**: https://render.com/docs
- **Status Page**: https://status.render.com
- **Support**: https://render.com/support

---

## ✅ Success Checklist

After deployment:

- [ ] Visit `https://judge-ca.onrender.com` - Site loads
- [ ] Check `/api/health` - Returns healthy status
- [ ] Database connected - No connection errors in logs
- [ ] Environment variables - All required secrets added
- [ ] Run migrations - Database schema created
- [ ] Run seeds - Initial data loaded
- [ ] Test user registration - Can create account
- [ ] Test attorney matching - Matching algorithm works
- [ ] WebSocket connection - Real-time messaging works

---

## 🎯 Quick Commands Reference

```bash
# View logs
render logs --service judge-ca --tail

# Run database migration
render run --service judge-ca npm run db:migrate

# Run database seed
render run --service judge-ca npm run db:seed

# Open shell
render shell --service judge-ca

# View service info
render services list

# Scale service (if needed)
render services scale judge-ca --plan standard
```

---

## 🚀 Next Steps

1. **Complete Step 1-3 above** to deploy
2. **Add environment variables** for email, Stripe, etc.
3. **Run database migrations** to set up schema
4. **Test the application** via the Render URL
5. **Configure custom domain** (optional)
6. **Set up monitoring** with Sentry (optional)

---

## 💬 Need Help?

If deployment fails or you get stuck:
1. Check Render build logs
2. Verify all files committed to GitHub
3. Ensure `render.yaml` is in repository root
4. Check render.com/docs for platform-specific issues

---

**Estimated Total Time**: 10 minutes from start to live application

**Success Rate**: 95%+ (Render is very reliable)

**Cost**: Free tier available (upgrade for production features)

---

*Created: October 31, 2025*
*Purpose: Simple, reliable deployment after Vercel/Railway issues*
*Status: Ready to deploy - just connect GitHub!*
