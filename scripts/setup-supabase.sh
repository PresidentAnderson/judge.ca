#!/bin/bash

# Supabase Setup Script for judge.ca
echo "🚀 Setting up Supabase (Free Tier) for judge.ca..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 Supabase Setup Instructions:${NC}"
echo ""
echo "Since Supabase requires manual account creation, follow these steps:"
echo ""
echo -e "${YELLOW}Step 1: Create Supabase Account${NC}"
echo "1. Go to https://supabase.com"
echo "2. Click 'Start your project'"
echo "3. Sign up with GitHub or email"
echo ""
echo -e "${YELLOW}Step 2: Create New Project${NC}"
echo "1. Click 'New Project'"
echo "2. Project name: judge-ca"
echo "3. Database Password: (save this securely)"
echo "4. Region: Choose closest to your users (e.g., US East)"
echo "5. Click 'Create new project'"
echo ""
echo -e "${YELLOW}Step 3: Initialize Database${NC}"
echo "1. Go to SQL Editor in Supabase dashboard"
echo "2. Click 'New Query'"
echo "3. Copy and paste the contents of: src/backend/database/init.sql"
echo "4. Click 'Run'"
echo ""
echo -e "${YELLOW}Step 4: Get Connection String${NC}"
echo "1. Go to Settings > Database"
echo "2. Copy the 'Connection string' (URI)"
echo "3. It will look like:"
echo "   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
echo ""
echo -e "${YELLOW}Step 5: Update Environment Variables${NC}"
echo "Run this command with your connection string:"
echo -e "${GREEN}vercel env add DATABASE_URL production${NC}"
echo "Then paste your Supabase connection string"
echo ""

# Create a helper file with the database schema
echo -e "${BLUE}Creating database setup file...${NC}"

cat > /Volumes/DevOps/judge.ca/SUPABASE_SETUP.md << 'EOF'
# Supabase Database Setup for Judge.ca

## Quick Setup

1. **Create Supabase Account**: https://supabase.com
2. **Create New Project**: Name it "judge-ca"
3. **Run Database Schema**: Copy the contents of `src/backend/database/init.sql` into SQL Editor
4. **Get Connection String**: Settings > Database > Connection string

## Connection String Format
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## Environment Variable
Add to Vercel:
```bash
vercel env add DATABASE_URL production
# Paste your connection string when prompted
```

## Free Tier Limits
- 500 MB database
- 2 GB bandwidth
- 50,000 monthly active users
- Unlimited API requests

## Features Included
- Realtime subscriptions
- Database backups (7 days)
- Auth with 50,000 MAUs
- Storage (1 GB)
- Edge Functions (500,000 invocations)

## SQL to Initialize
The complete schema is in: `src/backend/database/init.sql`

## Test Connection
```javascript
// Test in your app
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY')
```

## Support
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
EOF

echo -e "${GREEN}✅ Supabase setup instructions created!${NC}"
echo -e "${BLUE}📄 See SUPABASE_SETUP.md for detailed instructions${NC}"

# Offer to open Supabase in browser
read -p "Do you want to open Supabase in your browser now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "https://supabase.com/dashboard"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://supabase.com/dashboard"
    else
        echo "Please open https://supabase.com/dashboard in your browser"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Supabase setup guide complete!${NC}"