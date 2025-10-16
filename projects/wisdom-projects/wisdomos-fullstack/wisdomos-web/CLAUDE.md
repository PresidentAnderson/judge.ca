# WisdomOS Web - Claude Code Configuration

## Project Overview
A Next.js 15 web application with React 19, TypeScript, Tailwind CSS, and Neon database integration for wisdom tracking and journaling.

## Development Commands
```bash
# Development
npm run dev

# Build and deployment
npm run build
npm start

# Code quality
npm run lint
npm run type-check

# Database operations (if using Prisma)
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run prisma:studio
```

## Key Dependencies
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS v4
- **Database**: Neon PostgreSQL with Data API
- **Authentication**: Stack Auth
- **State Management**: TanStack React Query
- **UI Components**: Custom React components

## Project Structure
```
/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   └── journal/    # Journal API
├── components/         # React components
├── lib/               # Utilities and configurations
│   └── database/      # Database utilities
│       ├── neon-api.ts    # Neon Data API client
│       ├── models.ts      # Database models
│       └── types.ts       # TypeScript types
├── public/            # Static assets
└── types/             # TypeScript type definitions
```

## Database Configuration

### Neon Data API
- **Endpoint**: `https://ep-autumn-violet-aeft6u7n.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1`
- **Features**: Auto-generated REST API endpoints
- **Security**: Requires API key and Row Level Security setup

### Database Models Available
- **Users**: User management and profiles
- **Journal Entries**: Personal journal with mood tracking
- **Life Areas**: Organization categories for habits/goals
- **Habits**: Habit tracking system
- **Habit Tracking**: Individual habit completion records

## Environment Variables Required
```bash
# Database Configuration
DATABASE_URL=          # PostgreSQL connection string

# Neon Data API
NEON_API_ENDPOINT=     # https://ep-autumn-violet-aeft6u7n.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1
NEON_API_KEY=          # Your Neon API key for authentication

# Stack Auth
STACK_AUTH_PROJECT_ID= # 098f28b2-c387-4e71-8dab-bc81b9643abd
STACK_AUTH_JWKS_URL=   # https://api.stack-auth.com/api/v1/projects/098f28b2-c387-4e71-8dab-bc81b9643abd/.well-known/jwks.json

# JWT Configuration
JWT_SECRET=
```

## Authentication
- **Provider**: Stack Auth
- **JWKS URL**: https://api.stack-auth.com/api/v1/projects/098f28b2-c387-4e71-8dab-bc81b9643abd/.well-known/jwks.json
- **Project ID**: 098f28b2-c387-4e71-8dab-bc81b9643abd

## Deployment
- **GitHub**: Repository configured with CI/CD pipeline
- **Netlify**: `netlify.toml` configured for automatic deployment
- **Build**: Uses standard Next.js build process

## Usage Examples

### Using Neon Data API
```typescript
import { UserModel, JournalModel } from '@/lib/database/models';

// Create a user
const user = await UserModel.create({
  email: 'user@example.com',
  name: 'John Doe'
});

// Create journal entry
const entry = await JournalModel.create({
  user_id: user.id,
  title: 'My Day',
  content: 'Today was productive...',
  mood_rating: 8
});

// Get user's journal entries
const entries = await JournalModel.findByUserId(user.id);
```

## Security Notes
- Set up Row Level Security (RLS) policies for production
- Configure proper API key authentication
- Use environment variables for sensitive data
- Never commit secrets to repository

## Common Tasks
1. **Database operations**: Use models in `lib/database/models.ts`
2. **API routes**: Add to `app/api/` directory following Next.js 15 conventions
3. **UI components**: Create in `components/` with TypeScript and Tailwind
4. **Authentication**: Handled via Stack Auth integration