# GitHub Secrets and Environment Setup - Judge.ca

## Overview

This document provides detailed instructions for setting up GitHub repository secrets and environment variables required for the CI/CD pipeline of Judge.ca.

## Required GitHub Secrets

### Core Deployment Secrets

#### 1. Vercel Configuration
```
VERCEL_TOKEN
```
- **Description**: Vercel authentication token for deployments
- **How to get**: 
  1. Log in to Vercel dashboard
  2. Go to Settings → Tokens
  3. Create new token with appropriate scope
  4. Copy token value
- **Scope**: Full access for production deployments

```
VERCEL_ORG_ID
```
- **Description**: Vercel organization/team ID
- **How to get**:
  1. Run `vercel link` in project directory
  2. Check `.vercel/project.json` for orgId
  3. Or get from Vercel dashboard URL
- **Format**: String ID (e.g., "team_xxx" or "prj_xxx")

```
VERCEL_PROJECT_ID
```
- **Description**: Vercel project ID
- **How to get**:
  1. Run `vercel link` in project directory
  2. Check `.vercel/project.json` for projectId
  3. Or get from project settings in Vercel dashboard
- **Format**: String ID (e.g., "prj_xxx")

### Notification Secrets

#### 2. Slack Integration
```
SLACK_WEBHOOK_URL
```
- **Description**: Slack webhook URL for CI/CD notifications
- **How to get**:
  1. Go to Slack workspace
  2. Create new app or use existing
  3. Add Incoming Webhooks feature
  4. Create webhook for target channel
  5. Copy webhook URL
- **Format**: https://hooks.slack.com/services/xxx/xxx/xxx

### Security Scanning Secrets

#### 3. Snyk Security Scanning
```
SNYK_TOKEN
```
- **Description**: Snyk authentication token for security scanning
- **How to get**:
  1. Create Snyk account at https://snyk.io
  2. Go to Account Settings → API Token
  3. Generate new token
  4. Copy token value
- **Required for**: Dependency vulnerability scanning

#### 4. Semgrep Security Scanning
```
SEMGREP_APP_TOKEN
```
- **Description**: Semgrep App token for code security analysis
- **How to get**:
  1. Create account at https://semgrep.dev
  2. Go to Settings → Tokens
  3. Create new token
  4. Copy token value
- **Required for**: Static code security analysis

#### 5. Lighthouse CI
```
LHCI_GITHUB_APP_TOKEN
```
- **Description**: Lighthouse CI GitHub App token for performance monitoring
- **How to get**:
  1. Install Lighthouse CI GitHub App
  2. Configure for repository
  3. Get token from app settings
- **Required for**: Performance and accessibility testing

## Optional Secrets

### Database and External Services

#### 6. Database Configuration
```
DATABASE_URL_PRODUCTION
DATABASE_URL_STAGING
```
- **Description**: PostgreSQL connection strings for production and staging
- **Format**: postgresql://username:password@host:port/database
- **Security**: Use connection pooling and SSL

#### 7. Email Service
```
SENDGRID_API_KEY
SMTP_PASSWORD
```
- **Description**: Email service credentials for notifications
- **Providers**: SendGrid, AWS SES, or SMTP service

#### 8. External API Keys
```
STRIPE_SECRET_KEY_LIVE
STRIPE_SECRET_KEY_TEST
JWT_SECRET_PRODUCTION
JWT_SECRET_STAGING
```
- **Description**: Payment processing and authentication secrets
- **Security**: Use different keys for production and staging

## Setting Up GitHub Secrets

### Repository Secrets

1. **Navigate to Repository Settings**
   ```
   GitHub Repository → Settings → Secrets and variables → Actions
   ```

2. **Add New Repository Secret**
   ```
   Click "New repository secret"
   Name: SECRET_NAME
   Secret: secret_value
   Click "Add secret"
   ```

3. **Verify Secret Addition**
   ```
   Secret should appear in the list
   Value will be hidden for security
   ```

### Environment Secrets

1. **Create Environment**
   ```
   GitHub Repository → Settings → Environments
   Click "New environment"
   Name: production (or staging)
   ```

2. **Configure Environment Protection**
   ```
   Required reviewers: Add team members
   Wait timer: Set deployment delay if needed
   Deployment branches: Restrict to main/master
   ```

3. **Add Environment Secrets**
   ```
   In environment settings
   Click "Add secret"
   Add environment-specific secrets
   ```

## Environment Configuration

### Production Environment
```yaml
name: production
protection_rules:
  required_reviewers: 
    - devops-team
    - senior-developers
  wait_timer: 0
  deployment_branches:
    protected_branches: true
    custom_branches: 
      - main
      - master
```

### Staging Environment
```yaml
name: staging
protection_rules:
  required_reviewers: []
  wait_timer: 0
  deployment_branches:
    protected_branches: false
    custom_branches:
      - develop
      - staging
```

## Vercel Environment Variables

### Setting Up Vercel Environment Variables

1. **Using Vercel CLI**
   ```bash
   # Set production environment variables
   vercel env add NODE_ENV production
   vercel env add DATABASE_URL production
   
   # Set staging environment variables
   vercel env add NODE_ENV preview
   vercel env add DATABASE_URL preview
   ```

2. **Using Vercel Dashboard**
   ```
   Project Settings → Environment Variables
   Add variable name and value
   Select environments (Production, Preview, Development)
   Save changes
   ```

### Required Vercel Environment Variables

#### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://judge.ca
NEXTAUTH_SECRET=random_secret_string
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
JWT_SECRET=production_jwt_secret
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=sendgrid_api_key
```

#### Staging/Preview
```env
NODE_ENV=staging
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://staging.judge.ca
NEXTAUTH_SECRET=staging_secret_string
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
JWT_SECRET=staging_jwt_secret
SMTP_HOST=smtp.mailtrap.io
SMTP_USER=mailtrap_user
SMTP_PASS=mailtrap_pass
```

## Security Best Practices

### Secret Management
1. **Rotation**: Regularly rotate sensitive secrets
2. **Least Privilege**: Grant minimum required permissions
3. **Separate Environments**: Use different secrets for prod/staging
4. **No Hardcoding**: Never commit secrets to repository
5. **Audit Trail**: Monitor secret usage and access

### Access Control
1. **Team Permissions**: Limit who can view/modify secrets
2. **Environment Protection**: Require approvals for production
3. **Branch Protection**: Restrict deployment branches
4. **Audit Logs**: Monitor secret access and modifications

### Monitoring
1. **Secret Expiry**: Monitor for expiring tokens/certificates
2. **Usage Tracking**: Track secret usage in workflows
3. **Failed Authentications**: Monitor for authentication failures
4. **Anomaly Detection**: Watch for unusual access patterns

## Troubleshooting

### Common Issues

#### 1. Vercel Token Issues
```bash
# Test Vercel token
vercel whoami --token=$VERCEL_TOKEN

# Check token permissions
vercel teams ls --token=$VERCEL_TOKEN
```

#### 2. Missing Environment Variables
```bash
# List Vercel environment variables
vercel env ls

# Check specific environment
vercel env ls --environment=production
```

#### 3. Slack Webhook Issues
```bash
# Test webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  $SLACK_WEBHOOK_URL
```

#### 4. Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

### Validation Scripts

#### Secret Validation
```bash
#!/bin/bash
# validate-secrets.sh

echo "Validating GitHub Secrets..."

# Check if secrets are set (without revealing values)
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN not set"
else
  echo "✅ VERCEL_TOKEN is set"
fi

if [ -z "$SLACK_WEBHOOK_URL" ]; then
  echo "❌ SLACK_WEBHOOK_URL not set"
else
  echo "✅ SLACK_WEBHOOK_URL is set"
fi

# Add checks for other secrets...
```

#### Environment Validation
```bash
#!/bin/bash
# validate-environment.sh

echo "Validating Environment Variables..."

# Required for production
REQUIRED_VARS=(
  "NODE_ENV"
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "JWT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ $var not set"
  else
    echo "✅ $var is set"
  fi
done
```

## Setup Checklist

### Initial Setup
- [ ] Create GitHub repository
- [ ] Set up Vercel project
- [ ] Configure Slack webhook
- [ ] Create external service accounts (Snyk, Semgrep, etc.)

### GitHub Configuration
- [ ] Add all required repository secrets
- [ ] Create production environment
- [ ] Create staging environment
- [ ] Configure environment protection rules
- [ ] Set up branch protection rules

### Vercel Configuration
- [ ] Link GitHub repository
- [ ] Configure production environment variables
- [ ] Configure preview environment variables
- [ ] Set up custom domains
- [ ] Configure build settings

### External Services
- [ ] Configure Snyk integration
- [ ] Set up Semgrep scanning
- [ ] Configure Lighthouse CI
- [ ] Set up monitoring and alerting

### Testing
- [ ] Test workflow with dummy commit
- [ ] Verify Slack notifications
- [ ] Test deployment to staging
- [ ] Test deployment to production
- [ ] Verify rollback procedure

## Maintenance

### Regular Tasks
- **Weekly**: Check for expiring tokens
- **Monthly**: Rotate sensitive secrets
- **Quarterly**: Review access permissions
- **Annually**: Audit all secrets and configurations

### Monitoring
- Set up alerts for:
  - Failed authentications
  - Expiring certificates/tokens
  - Unusual access patterns
  - Deployment failures

## Support

### Contacts
- **DevOps Team**: devops@judge.ca
- **Security Team**: security@judge.ca
- **Platform Team**: platform@judge.ca

### Resources
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides)

---

*Last updated: [Current Date]*
*Version: 1.0*