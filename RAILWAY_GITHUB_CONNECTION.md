# 🔗 Railway GitHub Connection - Quick Fix

## ⚠️ Current Issue

Railway deployment is failing because the service doesn't see your application code:

```
The app contents that Railpack analyzed contains:
./
├── LICENSE
└── README.md
```

**Problem**: Railway service is not connected to your GitHub repository.

---

## ✅ Solution: Connect Railway to GitHub (3 Minutes)

### Step 1: Navigate to Railway Project

Visit: https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2

### Step 2: Select Your Service

Click on your service in the Railway dashboard.

### Step 3: Connect GitHub Repository

1. Click **Settings** (in the service sidebar)
2. Scroll to **Source** section
3. Click **"Connect Repo"** button
4. Select your repository: **PresidentAnderson/judge.ca**
5. Branch: **master**
6. Click **"Connect"**

### Step 4: Configure Build Settings (If Needed)

Railway should auto-detect the Node.js project. If not:

**Build Command**:
```bash
npm install && npm run build:backend
```

**Start Command**:
```bash
npm start
```

**Root Directory**: Leave blank (uses repository root)

### Step 5: Deploy

Railway will automatically deploy after connecting the repository!

---

## 🎯 Alternative: Use GitHub Actions Workflow

If you prefer the GitHub Actions approach (recommended for more control):

### Step 1: Create New Service

1. Go to Railway project: https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2
2. Click **"+ New"** → **"Empty Service"**
3. Name it: "judge-ca-app"

### Step 2: Don't Connect GitHub Yet

Leave the service empty (no repository connection).

### Step 3: Use the Working Workflow

The GitHub Actions workflow (`.github/workflows/railway-deploy.yml`) will deploy code directly.

**You need**:
- Valid Railway API token (not UUID)
- Token added to GitHub Secrets as `RAILWAY_TOKEN`

---

## 📊 Comparison: Native vs GitHub Actions

| Approach | Pros | Cons | Recommended For |
|----------|------|------|----------------|
| **Railway Native** | Simple, automatic, no tokens | Less control, Railway manages everything | Quick deployment |
| **GitHub Actions** | Full control, custom workflows, test before deploy | Requires token management | Production CI/CD |

---

## 🔍 Troubleshooting

### If Railway Still Shows Only LICENSE/README

**Possible causes**:
1. **.gitignore** is hiding application files
   - Check `.gitignore` doesn't exclude critical files

2. **Wrong branch** selected
   - Ensure Railway is using `master` branch

3. **Repository permissions**
   - Railway needs read access to your repository

4. **Build context** is wrong
   - Ensure root directory is set correctly

### Check Your Repository

```bash
# Verify files are committed and pushed
git status
git log --oneline -1

# Check what's in the repository
ls -la

# Verify package.json exists
cat package.json | head -20
```

### Verify GitHub Repository

Visit: https://github.com/PresidentAnderson/judge.ca

Ensure you see:
- ✅ `package.json`
- ✅ `src/` directory
- ✅ `.github/workflows/railway-deploy.yml`
- ✅ `railway.json`
- ✅ All application code

---

## 🚀 Recommended Approach

**Use Railway's Native GitHub Integration** (Simplest):

1. **Connect repository** to Railway service
2. **Railway auto-deploys** on every push to master
3. **No tokens needed** - Railway handles everything
4. **Preview deployments** for pull requests (optional)

This is the **easiest and most reliable** method for your use case.

---

## 📝 After Connecting

Once connected, Railway will:

1. ✅ Detect Node.js project automatically
2. ✅ Run `npm install`
3. ✅ Run build command (from `railway.json` or auto-detected)
4. ✅ Start application
5. ✅ Assign deployment URL
6. ✅ Monitor health via `/health` endpoint

**Expected deployment time**: 5-8 minutes

---

## 🆘 If You Need GitHub Actions Instead

If you still prefer GitHub Actions workflow:

**You must obtain a valid Railway API token**:

1. Go to: https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2/settings/tokens
2. Create token
3. Copy the **full token string** (starts with `railway_token_...`)
4. Add to GitHub Secrets as `RAILWAY_TOKEN`
5. Workflow will deploy automatically

**Note**: The UUIDs provided earlier were project/token IDs, not the actual API authentication token.

---

## ✨ Quick Decision Guide

**Choose Railway Native If**:
- ✅ You want simple, automatic deployments
- ✅ You don't need custom CI/CD workflows
- ✅ You want preview deployments for PRs
- ✅ You prefer less configuration

**Choose GitHub Actions If**:
- ✅ You need custom build steps
- ✅ You want to run tests before deploying
- ✅ You need multi-environment deployments (staging/prod)
- ✅ You want full control over deployment process

**For your project**: Railway Native is recommended for fastest deployment.

---

*Created: October 31, 2025*
*Issue: Railway service not connected to repository*
*Solution: Connect via Railway dashboard Settings → Source → Connect Repo*
