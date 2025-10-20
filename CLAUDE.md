# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Judge.ca is a comprehensive attorney referral service and legal platform for Quebec, Canada. It connects clients with qualified attorneys through intelligent matching algorithms while providing professional practice management tools.

## Key Technologies

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, React Hook Form, React Query, Framer Motion
- **Backend**: Express.js with TypeScript, PostgreSQL, Knex.js, Socket.IO, JWT authentication
- **Infrastructure**: Docker, Vercel deployment, Sentry monitoring, PWA support
- **Bilingual**: Full French/English support via next-i18next

## Development Commands

### Running the Application
```bash
npm run dev              # Start both frontend (port 3000) and backend (port 3001)
npm run dev:frontend     # Start Next.js frontend only
npm run dev:backend      # Start Express backend only
```

### Building and Deployment
```bash
npm run build            # Build Next.js production bundle
npm run build:backend    # Compile TypeScript backend
npm start                # Start production server
```

### Database Management
```bash
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with initial data
npm run db:reset         # Reset and reseed database (rollback + migrate + seed)
```

### Code Quality
```bash
npm run lint             # Run ESLint checks
npm run lint:fix         # Fix ESLint issues automatically
npm run typecheck        # TypeScript type checking
npm run format           # Format code with Prettier
npm run validate         # Run lint + typecheck + tests (pre-push validation)
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage reports
npm run test:integration # Run integration tests
npm run test:e2e         # Run Playwright E2E tests
```

### Security
```bash
npm run security:audit   # Run security audit
npm run security:fix     # Fix security vulnerabilities
```

## Architecture Overview

### Directory Structure
- `src/backend/` - Express.js API server
  - `api/` - API route handlers
  - `controllers/` - Business logic
  - `middleware/` - Express middleware (auth, rate limiting, error handling)
  - `models/` - Data models
  - `services/` - Business services (matching algorithm, email, payment)
  - `websocket/` - Socket.IO real-time features
  
- `src/frontend/` - Next.js application components
- `pages/` - Next.js pages and API routes
- `components/` - React UI components
- `database/` - Database schema, migrations, and seeds
- `public/locales/` - i18n translation files (fr/en)

### Path Aliases
The project uses TypeScript path aliases for cleaner imports:
- `@/` - Project root
- `@/components/*` - UI components
- `@frontend/*` - Frontend-specific code
- `@backend/*` - Backend-specific code
- `@shared/*` - Shared types and constants

### Key Services

#### Matching Algorithm (`src/backend/services/matchingService.ts`)
Advanced attorney-client matching based on:
- Practice area compatibility
- Budget alignment
- Geographic proximity
- Experience level requirements
- Language preferences
- Availability status

#### Authentication System
- JWT-based authentication with refresh tokens
- Role-based access control (Client, Attorney, Admin)
- Session management with Redis caching
- Rate limiting per endpoint

#### Real-time Features
- WebSocket-based messaging via Socket.IO
- Live notifications for matches and messages
- Real-time availability updates
- Typing indicators and read receipts

### Database Schema
PostgreSQL database with comprehensive schema including:
- Users (clients and attorneys)
- Attorney profiles with credentials
- Practice areas and specializations
- Matches with scoring
- Messages with encryption
- Appointments and calendar
- Subscriptions and payments
- Audit logs for compliance

### Environment Configuration
Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Authentication secret
- `STRIPE_SECRET_KEY` - Payment processing
- `SMTP_*` - Email configuration
- `NEXT_PUBLIC_WEBSOCKET_URL` - WebSocket server URL
- `SENTRY_DSN` - Error monitoring

### Quebec-Specific Compliance
- PIPEDA privacy protection compliance
- Bill 101 language law (French-first interface)
- Law Society of Quebec integration
- Attorney-client privilege protection in messaging

### Development Workflow

1. **Database Setup**: Ensure PostgreSQL is running locally (port 5432)
2. **Environment**: Copy `.env.example` to `.env` and configure
3. **Dependencies**: Run `npm install`
4. **Database**: Run `npm run db:migrate` then `npm run db:seed`
5. **Development**: Run `npm run dev` to start both servers
6. **Testing**: Run `npm test` before committing

### Code Style Conventions
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Husky pre-commit hooks for validation
- Component naming: PascalCase for components, camelCase for utilities
- API routes: RESTful conventions with `/api/v1/` prefix
- Database: snake_case for tables/columns
- Use existing UI components from `components/ui/` directory

### Testing Strategy
- Unit tests for utilities and services
- Integration tests for API endpoints
- E2E tests for critical user flows (registration, matching, booking)
- Minimum 80% code coverage target
- Mock external services (Stripe, email) in tests

### Performance Considerations
- Next.js ISR for static pages
- React Query for client-side caching
- Database query optimization with proper indexing
- Image optimization with Next.js Image component
- PWA with service worker for offline support
- Bundle size monitoring with Webpack Bundle Analyzer

### Deployment
- Vercel for frontend hosting
- Database hosted on managed PostgreSQL service
- Environment-specific configurations (development, staging, production)
- GitHub Actions for CI/CD pipeline
- Sentry for error tracking and performance monitoring