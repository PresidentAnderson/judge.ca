# 🪝 Railway Webhook Setup Guide

## Overview

This guide will help you set up automated deployments to Railway whenever you push code to GitHub.

## Method 1: GitHub Actions (Recommended)

### Step 1: Get Your Railway API Token

1. Go to https://railway.app/account/tokens
2. Click "Create Token"
3. Name it: `GitHub Actions Deploy`
4. Copy the token (starts with `railway_token_...`)

### Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository: https://github.com/YOUR_USERNAME/judge.ca
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `RAILWAY_TOKEN`
5. Value: Paste your Railway token
6. Click **Add secret**

### Step 3: Enable GitHub Actions

The workflow file is already created at `.github/workflows/railway-deploy.yml`

Just push it to GitHub:

```bash
git add .github/workflows/railway-deploy.yml
git commit -m "Add Railway deployment webhook"
git push origin master
```

### Step 4: Test the Webhook

Make any change and push:

```bash
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test Railway webhook"
git push origin master
```

Watch the deployment at: https://github.com/YOUR_USERNAME/judge.ca/actions

---

## Method 2: Railway Native Webhook

### Step 1: Connect GitHub Repository

1. Go to https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2
2. Click your service
3. Click **Settings**
4. Under **Source**, click **Connect Repo**
5. Select your `judge.ca` repository
6. Click **Connect**

### Step 2: Configure Auto-Deploy

Railway will now automatically deploy on every push to `master` branch.

No additional configuration needed!

---

## Method 3: Custom Webhook Endpoint

### Create a Webhook Handler

```javascript
// pages/api/webhooks/railway-deploy.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import crypto from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify GitHub webhook signature
  const signature = req.headers['x-hub-signature-256'] as string;
  const secret = process.env.GITHUB_WEBHOOK_SECRET || '';

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

  if (signature !== digest) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Trigger Railway deployment
  const { ref, repository } = req.body;

  if (ref === 'refs/heads/master') {
    exec('railway up --detach', (error, stdout, stderr) => {
      if (error) {
        console.error('Deployment failed:', error);
        return;
      }
      console.log('Deployment triggered:', stdout);
    });

    return res.status(200).json({
      message: 'Deployment triggered',
      repository: repository.full_name,
      branch: ref
    });
  }

  return res.status(200).json({ message: 'No deployment triggered' });
}
```

### Configure GitHub Webhook

1. Go to GitHub repository settings
2. Click **Webhooks** → **Add webhook**
3. Payload URL: `https://your-domain.com/api/webhooks/railway-deploy`
4. Content type: `application/json`
5. Secret: Generate a secure secret
6. Events: Select "Just the push event"
7. Click **Add webhook**

---

## Webhook Features

### ✅ What the Webhook Does

- **Automatic Deployment**: Deploys on every push to master
- **Build Status**: Reports success/failure in GitHub
- **Health Checks**: Validates deployment after completion
- **Rollback Support**: Easy rollback to previous deployment
- **Environment Management**: Separate staging/production

### 🔔 Notifications

Add notifications to your workflow:

```yaml
- name: 📢 Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Railway deployment ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Environment-Specific Deployments

### Deploy to Staging

Create `.github/workflows/railway-staging.yml`:

```yaml
name: Deploy to Railway Staging

on:
  push:
    branches:
      - develop

env:
  RAILWAY_PROJECT_ID: 3ce7a059-22ef-440a-a6b1-24b345ad88d2
  RAILWAY_ENVIRONMENT: staging

jobs:
  deploy:
    # Same as production workflow but with staging environment
```

### Deploy to Production

Only deploy to production on tagged releases:

```yaml
name: Deploy to Railway Production

on:
  push:
    tags:
      - 'v*'

# Same workflow as above
```

---

## Webhook Security

### Verify Webhook Signatures

Always verify webhook signatures to prevent unauthorized deployments:

```typescript
const verifySignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};
```

### Use GitHub Secrets

Never hardcode tokens in your workflow files. Always use GitHub Secrets:

```yaml
env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Monitoring Deployments

### View Deployment Logs

```bash
# Via Railway CLI
railway logs --deployment latest

# Via GitHub Actions
# Go to Actions tab → Select workflow run → View logs
```

### Check Deployment Status

```bash
railway status
```

### Rollback Failed Deployment

```bash
# Via Railway CLI
railway rollback

# Via Railway Dashboard
# Go to Deployments → Click "Rollback" on previous successful deployment
```

---

## Webhook Events

The webhook triggers on these events:

| Event | Trigger | Action |
|-------|---------|--------|
| **push** | Code pushed to master | Full deployment |
| **pull_request** | PR opened/updated | Preview deployment |
| **release** | Release published | Tagged production deployment |
| **workflow_dispatch** | Manual trigger | On-demand deployment |

---

## Testing the Webhook

### Manual Test via GitHub Actions

1. Go to https://github.com/YOUR_USERNAME/judge.ca/actions
2. Click "Deploy to Railway" workflow
3. Click "Run workflow"
4. Select branch: `master`
5. Click "Run workflow"

### Test via cURL

```bash
# Get webhook URL from Railway dashboard
WEBHOOK_URL="https://railway.app/api/webhooks/..."

# Send test payload
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/master",
    "repository": {
      "full_name": "YOUR_USERNAME/judge.ca"
    }
  }'
```

---

## Troubleshooting

### Webhook Not Triggering

**Check:**
- GitHub Actions is enabled in repository settings
- Workflow file is in `.github/workflows/` directory
- Railway token is correctly set in GitHub Secrets
- Push is to the `master` or `main` branch

### Deployment Failing

**Check logs:**
```bash
railway logs --deployment latest
```

**Common issues:**
- Missing environment variables
- Build errors (check TypeScript/ESLint)
- Database connection issues
- Port binding conflicts

### Token Expired

If Railway token expires:
1. Generate new token at https://railway.app/account/tokens
2. Update `RAILWAY_TOKEN` in GitHub Secrets
3. Re-run failed workflow

---

## Best Practices

### 1. Use Branch Protection

Protect your `master` branch:
- Require pull request reviews
- Require status checks to pass
- Include deployment status in checks

### 2. Implement Preview Deployments

Deploy preview environments for pull requests:
```yaml
on:
  pull_request:
    branches: [master]

jobs:
  deploy-preview:
    # Deploy to preview environment
```

### 3. Add Deployment Notifications

Notify your team on Slack/Discord:
```yaml
- name: Notify Team
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 4. Run Tests Before Deployment

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
      - run: npm run typecheck

  deploy:
    needs: test  # Only deploy if tests pass
    runs-on: ubuntu-latest
    # ... deployment steps
```

---

## Webhook URLs

### Railway Dashboard
- **Project**: https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2
- **Settings**: https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2/settings
- **Deployments**: https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2/deployments

### GitHub Actions
- **Workflows**: https://github.com/YOUR_USERNAME/judge.ca/actions
- **Secrets**: https://github.com/YOUR_USERNAME/judge.ca/settings/secrets/actions

---

## Quick Start Checklist

- [ ] Create Railway API token
- [ ] Add `RAILWAY_TOKEN` to GitHub Secrets
- [ ] Push `.github/workflows/railway-deploy.yml` to repository
- [ ] Test deployment by pushing code
- [ ] Verify deployment at Railway dashboard
- [ ] Check application at deployment URL
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring (optional)

---

## Next Steps

After webhook setup:

1. **Configure Environments**
   - Staging: `railway environment staging`
   - Production: `railway environment production`

2. **Set Up Monitoring**
   - Add Sentry for error tracking
   - Configure uptime monitoring
   - Set up log aggregation

3. **Optimize Deployments**
   - Enable caching for faster builds
   - Use Railway's build cache
   - Implement zero-downtime deployments

---

## Support

- **Railway Docs**: https://docs.railway.app/deploy/deployments
- **GitHub Actions**: https://docs.github.com/en/actions
- **Webhooks**: https://docs.railway.app/deploy/webhooks

---

*Generated by Claude Code - Deployment Orchestration System*
*Date: October 31, 2025*
