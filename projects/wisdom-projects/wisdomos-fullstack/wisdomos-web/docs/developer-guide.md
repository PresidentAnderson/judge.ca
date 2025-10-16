# WisdomOS Web Developer Guide

[![Developer Guide](https://img.shields.io/badge/Guide-Developer-orange.svg)](https://github.com/your-org/wisdomos-web)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://netlify.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black.svg)](https://nextjs.org/)

Welcome to the WisdomOS Web developer guide! This comprehensive document will help you set up, develop, and contribute to the WisdomOS Web project.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Environment](#development-environment)
- [Architecture Overview](#architecture-overview)
- [Database Setup](#database-setup)
- [Authentication](#authentication)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Code Standards](#code-standards)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js**: 18.17.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: Latest version
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/wisdomos-web.git
cd wisdomos-web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local with your configuration
# (See Environment Variables section below)

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:turbo        # Start with turbo mode (faster builds)

# Build and Production
npm run build            # Build for production
npm run start            # Start production server
npm run export           # Export static files

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues automatically
npm run type-check       # Run TypeScript type checking

# Database (if using Prisma)
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database
npm run prisma:seed      # Seed database with sample data
npm run prisma:studio    # Open Prisma Studio (database GUI)

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

---

## Project Structure

```
wisdomos-web/
├── app/                          # Next.js App Router (main application)
│   ├── (auth)/                  # Auth route group
│   │   ├── login/               # Login page
│   │   └── signup/              # Signup page
│   ├── api/                     # API routes (serverless functions)
│   │   ├── auth/                # Authentication endpoints
│   │   ├── habits/              # Habit management APIs
│   │   ├── journal/             # Journal entry APIs
│   │   ├── life-areas/          # Life areas APIs
│   │   ├── users/               # User management APIs
│   │   └── health/              # Health check endpoint
│   ├── dashboard/               # Dashboard page
│   ├── habits/                  # Habit tracking pages
│   ├── journal/                 # Journal pages
│   ├── profile/                 # User profile pages
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Home page
│   ├── loading.tsx              # Global loading UI
│   ├── error.tsx                # Global error UI
│   └── not-found.tsx            # 404 page
├── components/                   # Reusable React components
│   ├── ui/                      # Base UI components
│   │   ├── Button.tsx           # Button component
│   │   ├── Input.tsx            # Input component
│   │   ├── Modal.tsx            # Modal component
│   │   └── ...                  # Other UI components
│   ├── features/                # Feature-specific components
│   │   ├── auth/                # Authentication components
│   │   ├── habits/              # Habit-related components
│   │   ├── journal/             # Journal components
│   │   └── dashboard/           # Dashboard components
│   └── layout/                  # Layout components
│       ├── Header.tsx           # Site header
│       ├── Navigation.tsx       # Main navigation
│       └── Footer.tsx           # Site footer
├── lib/                         # Utility libraries and configurations
│   ├── database/                # Database layer
│   │   ├── neon-api.ts         # Neon Data API client
│   │   ├── models.ts           # Database models
│   │   └── types.ts            # Database type definitions
│   ├── auth.ts                  # Authentication utilities
│   ├── middleware.ts            # Custom middleware
│   └── utils.ts                 # General utility functions
├── types/                       # TypeScript type definitions
│   ├── auth.ts                  # Authentication types
│   ├── database.ts              # Database types
│   └── api.ts                   # API types
├── public/                      # Static assets
│   ├── images/                  # Image files
│   ├── icons/                   # Icon files
│   └── favicon.ico              # Site favicon
├── docs/                        # Documentation
│   ├── api/                     # API documentation
│   ├── developer-guide.md       # This guide
│   └── ...                      # Other documentation
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Project configuration and dependencies
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── next.config.js               # Next.js configuration
├── netlify.toml                 # Netlify deployment configuration
└── README.md                    # Project README
```

### Key Directories Explained

**`app/` Directory (Next.js App Router)**
- Uses the new App Router architecture from Next.js 13+
- Each folder represents a route
- Special files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- API routes in `app/api/` are serverless functions

**`components/` Directory**
- Organized by UI hierarchy and features
- `ui/` for basic, reusable components
- `features/` for business logic components
- `layout/` for structural components

**`lib/` Directory**
- Database abstraction and models
- Authentication logic
- Shared utilities and configurations
- Business logic that's not UI-specific

---

## Development Environment

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/wisdomos"

# Neon Data API Configuration
NEON_API_ENDPOINT="https://ep-autumn-violet-aeft6u7n.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1"
NEON_API_KEY="your-neon-api-key-here"

# Stack Auth Configuration
STACK_AUTH_PROJECT_ID="098f28b2-c387-4e71-8dab-bc81b9643abd"
STACK_AUTH_JWKS_URL="https://api.stack-auth.com/api/v1/projects/098f28b2-c387-4e71-8dab-bc81b9643abd/.well-known/jwks.json"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"

# Optional: Development Settings
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEON_API_ENDPOINT` | Neon Data API endpoint | Yes |
| `NEON_API_KEY` | Neon API authentication key | Yes |
| `STACK_AUTH_PROJECT_ID` | Stack Auth project identifier | Yes |
| `STACK_AUTH_JWKS_URL` | Stack Auth JWKS endpoint | Yes |
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |

### IDE Configuration

**VS Code (Recommended)**

Install these extensions:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## Architecture Overview

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser                             │
├─────────────────────────────────────────────────────────┤
│  React 19 Components + Next.js 15 App Router           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │   Pages     │ │ Components  │ │   API Routes    │   │
│  │             │ │             │ │                 │   │
│  │ - Dashboard │ │ - UI        │ │ - /api/journal  │   │
│  │ - Journal   │ │ - Features  │ │ - /api/habits   │   │
│  │ - Habits    │ │ - Layout    │ │ - /api/auth     │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  State Management: TanStack React Query + React State  │
├─────────────────────────────────────────────────────────┤
│  Styling: Tailwind CSS v4 + Custom Components          │
└─────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Next.js API Routes                      │
├─────────────────────────────────────────────────────────┤
│  Authentication Middleware (Stack Auth + JWT)          │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer (Models + Services)              │
├─────────────────────────────────────────────────────────┤
│  Database Abstraction Layer (Neon Data API)            │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL Database (Neon Serverless)                 │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Interaction
      ↓
React Component
      ↓
TanStack Query (API Call)
      ↓
Next.js API Route
      ↓
Authentication Middleware
      ↓
Database Model
      ↓
Neon Data API
      ↓
PostgreSQL Database
```

---

## Database Setup

### Neon Database Configuration

WisdomOS Web uses **Neon** (serverless PostgreSQL) with their Data API for database operations.

**Setting up Neon:**

1. **Create Neon Account**
   - Sign up at [Neon Console](https://neon.tech)
   - Create a new project
   - Note your connection string

2. **Enable Data API**
   - Navigate to your project settings
   - Enable the Data API feature
   - Copy the API endpoint and generate an API key

3. **Database Schema**
   
   The database schema includes these main tables:

   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR UNIQUE NOT NULL,
     name VARCHAR NOT NULL,
     avatar_url VARCHAR,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Life Areas table
   CREATE TABLE life_areas (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     name VARCHAR NOT NULL,
     description TEXT,
     color VARCHAR(7), -- Hex color code
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Habits table
   CREATE TABLE habits (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     life_area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL,
     name VARCHAR NOT NULL,
     description TEXT,
     frequency VARCHAR CHECK (frequency IN ('daily', 'weekly', 'monthly')),
     target_value INTEGER,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Habit Tracking table
   CREATE TABLE habit_tracking (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
     value INTEGER,
     notes TEXT,
     completed_at TIMESTAMP DEFAULT NOW()
   );

   -- Journal Entries table
   CREATE TABLE journal_entries (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     title VARCHAR,
     content TEXT NOT NULL,
     mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Database Models

The application uses custom models in `lib/database/models.ts`:

```typescript
// Example model usage
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

---

## Authentication

WisdomOS Web uses **Stack Auth** for authentication with JWT tokens.

### Authentication Flow

1. **User Registration/Login**
   - User interacts with Stack Auth UI
   - Stack Auth handles registration/login process
   - Returns JWT token on successful authentication

2. **Token Storage**
   - Frontend stores JWT token (secure httpOnly cookie recommended)
   - Token included in API requests via Authorization header

3. **API Request Authentication**
   - Middleware extracts JWT from request headers
   - Validates token using Stack Auth JWKS endpoint
   - Extracts user information from token
   - Attaches user to request context

### Implementation Details

**Authentication Middleware** (`lib/middleware.ts`):

```typescript
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function getUserFromHeaders(request: NextRequest): User | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    // Validate token using Stack Auth JWKS
    const payload = jwt.verify(token, /* JWKS key */);
    return extractUserFromPayload(payload);
  } catch (error) {
    return null;
  }
}
```

**Protected API Routes**:

```typescript
export async function GET(request: NextRequest) {
  const user = getUserFromHeaders(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proceed with authenticated user
  // ...
}
```

---

## API Development

### API Structure

All API endpoints are located in `app/api/` and follow RESTful conventions:

```
GET    /api/resource      # List resources
POST   /api/resource      # Create resource
GET    /api/resource/[id] # Get specific resource
PUT    /api/resource/[id] # Update resource
DELETE /api/resource/[id] # Delete resource
```

### Request/Response Format

**Request Format:**
- Content-Type: `application/json`
- Authorization: `Bearer <jwt_token>`
- Body: JSON payload with validated data

**Response Format:**
```typescript
// Success Response
{
  data: T; // The actual data
  meta?: {
    timestamp: string;
    version: string;
  };
}

// Error Response
{
  error: string;
  details?: ValidationError[]; // For validation errors
  code?: string;
}
```

### Validation with Zod

All API endpoints use Zod for request validation:

```typescript
import { z } from 'zod';

const createJournalSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  mood_rating: z.number().min(1).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createJournalSchema.parse(body);
    
    // Process validated data...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
  }
}
```

### Error Handling

Consistent error handling across all API routes:

```typescript
export async function GET(request: NextRequest) {
  try {
    // API logic...
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle different error types
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.details },
        { status: 400 }
      );
    }
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Frontend Development

### Component Structure

**Base UI Components** (`components/ui/`):
- Reusable, unstyled components
- Accept all necessary props
- Use TypeScript interfaces for props
- Include proper accessibility attributes

```typescript
// Example: Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  children,
  className,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'bg-transparent hover:bg-gray-100': variant === 'ghost',
        },
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-base': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
```

### State Management

**TanStack React Query** for server state:

```typescript
// Custom hook for journal entries
export function useJournalEntries() {
  return useQuery({
    queryKey: ['journal', 'entries'],
    queryFn: async () => {
      const response = await fetch('/api/journal', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }
      
      return response.json();
    },
  });
}

// Mutation for creating entries
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateJournalEntryData) => {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create journal entry');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch journal entries
      queryClient.invalidateQueries({ queryKey: ['journal', 'entries'] });
    },
  });
}
```

**React State** for UI state:

```typescript
// Simple state for form handling
const [formData, setFormData] = useState({
  title: '',
  content: '',
  moodRating: 5,
});

// Reducer for complex state
const [state, dispatch] = useReducer(habitsReducer, initialState);
```

### Styling with Tailwind CSS

**Tailwind CSS v4 Configuration** (`tailwind.config.js`):

```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Custom color palette
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
```

**Utility Functions** (`lib/utils.ts`):

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine classes with proper merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format dates consistently
export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

// Handle API errors
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
```

---

## Testing

### Testing Stack

- **Framework**: Jest + React Testing Library
- **E2E**: Playwright (planned)
- **Coverage**: Istanbul

### Test Structure

```
__tests__/
├── components/          # Component tests
├── pages/              # Page tests
├── api/                # API route tests
├── utils/              # Utility function tests
└── setup.ts            # Test configuration
```

### Example Tests

**Component Test**:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading...</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

**API Route Test**:

```typescript
import { GET } from '@/app/api/journal/route';
import { NextRequest } from 'next/server';

describe('/api/journal', () => {
  it('returns journal entries for authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/journal', {
      headers: {
        'Authorization': 'Bearer valid-jwt-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeInstanceOf(Array);
  });

  it('returns 401 for unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/journal');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- Button.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="should render"
```

---

## Code Standards

### TypeScript Guidelines

**Strict Type Safety**:
```typescript
// Always define interfaces for props
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

// Use proper return types
function calculateStreak(habits: Habit[]): number {
  // Implementation
}

// Avoid 'any' type
// Bad
const data: any = await fetch('/api/data');

// Good
interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
}
const data: ApiResponse<User[]> = await fetch('/api/users');
```

**Import Organization**:
```typescript
// External libraries (React, Next.js, etc.)
import React from 'react';
import { NextRequest, NextResponse } from 'next/server';

// Internal utilities and configurations
import { getUserFromHeaders } from '@/lib/middleware';
import { JournalModel } from '@/lib/database/models';

// Type imports
import type { User, JournalEntry } from '@/types/database';

// Relative imports
import { Button } from '../ui/Button';
```

### React Best Practices

**Component Design**:
```typescript
// Use function components with TypeScript
export function JournalEntry({ entry, onEdit, onDelete }: JournalEntryProps) {
  // Use custom hooks for logic
  const { isEditing, startEdit, cancelEdit } = useEditMode();
  const { deleteEntry } = useDeleteEntry();

  // Event handlers
  const handleEdit = useCallback(() => {
    startEdit();
    onEdit(entry);
  }, [entry, onEdit, startEdit]);

  // Early returns for loading/error states
  if (!entry) {
    return <EntryPlaceholder />;
  }

  return (
    <div className="journal-entry">
      {/* Component content */}
    </div>
  );
}
```

**Custom Hooks**:
```typescript
// Encapsulate related logic in custom hooks
export function useJournalEntry(entryId: string) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch entry logic
  }, [entryId]);

  const updateEntry = useCallback(async (updates: Partial<JournalEntry>) => {
    // Update logic
  }, [entryId]);

  return { entry, loading, error, updateEntry };
}
```

### File Naming Conventions

- **Components**: PascalCase (`Button.tsx`, `JournalEntry.tsx`)
- **Utilities**: camelCase (`formatDate.ts`, `apiClient.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Types**: PascalCase (`User.ts`, `DatabaseTypes.ts`)

### Git Workflow

**Commit Message Format**:
```
type(scope): description

feat(journal): add mood tracking functionality
fix(auth): resolve token refresh issue  
docs(api): update endpoint documentation
style(ui): improve button component styling
refactor(database): simplify model interfaces
test(habits): add unit tests for tracking
```

**Branch Naming**:
- `feature/journal-mood-tracking`
- `fix/authentication-bug`
- `docs/api-documentation`
- `refactor/database-models`

---

## Deployment

### Build Process

```bash
# Install dependencies
npm ci

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Test build locally
npm run start
```

### Environment Configuration

**Production Environment Variables**:
```bash
# Database
DATABASE_URL="postgresql://user:pass@db.example.com:5432/wisdomos"
NEON_API_ENDPOINT="https://your-neon-endpoint/rest/v1"
NEON_API_KEY="production-api-key"

# Authentication
STACK_AUTH_PROJECT_ID="your-project-id"
STACK_AUTH_JWKS_URL="https://api.stack-auth.com/..."
JWT_SECRET="super-secret-production-key"

# App Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Netlify Deployment

**Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"
```

**Deployment Steps**:
1. Connect GitHub repository to Netlify
2. Configure environment variables in Netlify dashboard
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Enable automatic deployments on push

### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/ci.yml`):
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Netlify
        # Deployment steps
```

---

## Contributing

### Getting Started

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/wisdomos-web.git
   cd wisdomos-web
   ```

2. **Set Up Development Environment**
   ```bash
   npm install
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm run dev
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. **Write Tests**: Add tests for new functionality
2. **Implement Feature**: Write the code with proper types
3. **Update Documentation**: Document new features/changes
4. **Test Thoroughly**: Ensure all tests pass
5. **Submit Pull Request**: Follow the PR template

### Pull Request Process

1. **Update Documentation**: Ensure docs reflect changes
2. **Add Tests**: New code should have appropriate tests
3. **Follow Code Standards**: Use consistent formatting
4. **Write Clear Commits**: Use conventional commit messages
5. **Request Review**: Tag relevant maintainers

### Code Review Guidelines

**For Contributors**:
- Self-review your code before submitting
- Provide context and reasoning in PR description
- Respond promptly to feedback
- Make requested changes in separate commits

**For Reviewers**:
- Focus on architecture, performance, and maintainability
- Provide constructive feedback with examples
- Approve when code meets standards
- Request changes when necessary

---

## Troubleshooting

### Common Development Issues

**Build Errors**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18.17.0+
npm --version   # Should be 9.0.0+
```

**TypeScript Errors**:
```bash
# Restart TypeScript server in VS Code
# Command Palette → "TypeScript: Restart TS Server"

# Check types manually
npm run type-check
```

**Database Connection Issues**:
```bash
# Verify environment variables
echo $DATABASE_URL
echo $NEON_API_KEY

# Test API connection
curl -X GET "$NEON_API_ENDPOINT/health" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

**Authentication Issues**:
```bash
# Verify Stack Auth configuration
curl -X GET "$STACK_AUTH_JWKS_URL"

# Check JWT token format
node -e "console.log(require('jsonwebtoken').decode('YOUR_TOKEN_HERE'))"
```

### Performance Optimization

**Bundle Analysis**:
```bash
# Analyze bundle size
npm run build
npm run analyze  # If configured

# Check for large dependencies
npx bundlephobia [package-name]
```

**Database Optimization**:
- Use proper indexing for frequently queried fields
- Implement pagination for large datasets
- Cache frequently accessed data
- Use database connection pooling

### Debugging Tips

**API Routes**:
```typescript
// Add detailed logging
console.log('Request headers:', Object.fromEntries(request.headers));
console.log('Request body:', await request.clone().text());

// Use proper error logging
import { logger } from '@/lib/logger';
logger.error('API Error', { error, context: { userId, action } });
```

**React Components**:
```typescript
// Use React Developer Tools
// Add debug props in development
const debug = process.env.NODE_ENV === 'development';

return (
  <div {...(debug && { 'data-component': 'JournalEntry' })}>
    {/* Component content */}
  </div>
);
```

### Getting Help

1. **Check Documentation**: Review relevant docs sections
2. **Search Issues**: Look for similar problems on GitHub
3. **Community**: Ask questions in GitHub Discussions
4. **Support**: Contact maintainers for complex issues

---

## Resources

### Documentation Links
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Stack Auth Documentation](https://docs.stack-auth.com)

### Development Tools
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### Learning Resources
- [Next.js Learn Course](https://nextjs.org/learn)
- [React Query Documentation](https://tanstack.com/query/latest)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

**Last Updated**: October 2024  
**Developer Guide Version**: 1.0.0  
**App Version**: 0.1.0

For questions or improvements to this guide, please [open an issue](https://github.com/your-org/wisdomos-web/issues/new) or submit a pull request.