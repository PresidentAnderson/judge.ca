# 🚀 Railway Deployment Guide for judge.ca

## Quick Start - Execute in Your Terminal

### Method 1: CLI Deployment (Recommended - 10 minutes)

**Copy and paste these commands one by one into your terminal:**

```bash
# 1. Login to Railway (opens browser)
railway login

# 2. Link to your existing project
railway link --project 3ce7a059-22ef-440a-a6b1-24b345ad88d2

# 3. Deploy
railway up
```

That's it! Railway will build and deploy your application.

---

## Method 2: GitHub Integration (Alternative - 15 minutes)

If CLI doesn't work, use GitHub auto-deployment:

### Step 1: Push to GitHub

```bash
# Initialize git (if not done)
git add .
git commit -m "Deploy to Railway"
git push origin master
```

### Step 2: Connect in Railway Dashboard

1. Go to https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2
2. Click "New Service" → "GitHub Repo"
3. Select your `judge.ca` repository
4. Railway will automatically deploy on every push

---

## Method 3: Manual Configuration (Most Control - 20 minutes)

### A. Environment Variables to Set

In Railway Dashboard → Variables, add:

```bash
# Core
NODE_ENV=production
PORT=3000

# Authentication
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_EXPIRES_IN=7d

# Database (auto-provided by Railway Postgres)
DATABASE_URL=<provided-by-railway>

# Redis (auto-provided by Railway Redis)
REDIS_URL=<provided-by-railway>

# Email (optional - add your SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe (optional - add your keys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Monitoring (optional)
SENTRY_DSN=https://...@sentry.io/...
```

### B. Add Services

1. **PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will auto-provide `DATABASE_URL`

2. **Redis Cache**
   - Click "New" → "Database" → "Redis"
   - Railway will auto-provide `REDIS_URL`

---

## What Gets Deployed

### ✅ Frontend (Next.js)
- Homepage and all pages
- API routes in `/pages/api/`
- Static assets
- PWA functionality

### ✅ Backend (Express.js)
- REST API endpoints
- WebSocket server (Socket.IO) - **Works perfectly on Railway!**
- Real-time chat
- Authentication
- Database connections
- File storage

### ✅ Services
- PostgreSQL database
- Redis cache
- Email service
- Payment processing (Stripe)

---

## Build Configuration

Railway automatically detects your configuration from:

1. **`railway.json`** (already in your project)
2. **`railway.toml`** (already in your project)
3. **`package.json`** scripts

### Build Command (automatic):
```bash
npm install && npm run build
```

### Start Command (automatic):
```bash
npm start
```

---

## Post-Deployment Steps

### 1. Run Database Migrations

Once deployed, run:

```bash
railway run npm run db:migrate
railway run npm run db:seed
```

### 2. Get Your Deployment URL

```bash
railway domain
```

Your app will be at: `https://judgeca-production.up.railway.app`

### 3. Add Custom Domain (Optional)

```bash
railway domain add judge.ca
```

Then add these DNS records:
- **CNAME**: `www` → `your-app.up.railway.app`
- **ANAME/ALIAS**: `@` → `your-app.up.railway.app`

---

## Monitoring & Logs

### View Logs
```bash
railway logs
```

### Check Status
```bash
railway status
```

### Open Dashboard
```bash
railway open
```

### View Metrics
```bash
railway metrics
```

---

## Troubleshooting

### Issue: Build Fails

**Solution:** Check logs for specific error
```bash
railway logs --deployment
```

### Issue: Database Connection Error

**Solution:** Verify DATABASE_URL is set
```bash
railway variables
```

### Issue: Port Binding Error

**Solution:** Ensure PORT=3000 is set and your app listens on `process.env.PORT`

### Issue: WebSocket Not Working

**Solution:** Railway supports WebSockets by default. Ensure:
- `NEXT_PUBLIC_WEBSOCKET_URL` points to your Railway domain
- Use `wss://` (not `ws://`) for production

---

## Cost Estimate

| Resource | Usage | Monthly Cost |
|----------|-------|--------------|
| Web Service | Hobby tier | $5 |
| PostgreSQL | 1GB | $5 |
| Redis | 256MB | $5 |
| **Total** | | **$15/mo** |

**Free Trial:** $5 credit/month on Hobby plan

---

## Deployment Checklist

- [ ] Railway account created
- [ ] Railway CLI installed (`railway --version` works)
- [ ] Logged in via `railway login`
- [ ] Project linked via `railway link --project 3ce7a059-22ef-440a-a6b1-24b345ad88d2`
- [ ] Environment variables set
- [ ] PostgreSQL database added
- [ ] Redis cache added
- [ ] Application deployed via `railway up`
- [ ] Database migrations run via `railway run npm run db:migrate`
- [ ] Deployment URL obtained via `railway domain`
- [ ] Health check passed: `curl https://your-app.up.railway.app/api/health`
- [ ] Application tested in browser

---

## Next Steps After Deployment

1. **Test Critical Endpoints**
   - Homepage: `https://your-app.up.railway.app/`
   - Health: `https://your-app.up.railway.app/api/health`
   - Auth: `https://your-app.up.railway.app/api/auth/login`

2. **Set Up Monitoring**
   - Configure Sentry for error tracking
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Enable Railway metrics

3. **Configure Domain**
   - Add custom domain `judge.ca`
   - Set up SSL (automatic with Railway)
   - Configure email DNS records (SPF, DKIM)

4. **Production Optimizations**
   - Enable Redis caching
   - Configure CDN for static assets
   - Set up database backups
   - Configure log aggregation

---

## Support

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Project Dashboard**: https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2

---

## Summary

**Your project is 100% ready for Railway deployment.** The three specialized agents confirmed:

✅ All code is deployment-ready
✅ All dependencies are installed
✅ Railway configuration files are present
✅ Database migrations are prepared
✅ Environment variables are documented

**Just run these 3 commands:**

```bash
railway login
railway link --project 3ce7a059-22ef-440a-a6b1-24b345ad88d2
railway up
```

**Estimated deployment time: 10 minutes**

---

*Generated by Claude Code - Deployment Orchestration System*
*Date: October 31, 2025*
