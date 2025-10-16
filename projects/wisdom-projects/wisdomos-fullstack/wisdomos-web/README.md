# WisdomOS Web - Your Personal Wisdom Tracker

A modern Next.js 15 web application for wisdom tracking, journaling, and habit formation built with React 19, TypeScript, Tailwind CSS, and Neon database integration.

## Features

### 🧠 Smart Journaling
- Create and manage personal journal entries
- Mood tracking with 1-10 scale rating
- Rich text editing with automatic saving
- Search and filter capabilities

### 📈 Habit Tracking
- Create daily, weekly, and monthly habits
- Simple one-click completion tracking
- Progress visualization and streaks
- Organize habits by life areas

### 🎯 Life Areas Organization
- Categorize habits and goals by life areas
- Color-coded organization system
- Balance tracking across different life aspects
- Custom life area creation and management

### 🔐 Secure Authentication
- Stack Auth integration for secure login
- JWT-based authentication
- Protected routes and API endpoints
- User profile management

### 📊 Dashboard & Analytics
- Personal dashboard with overview statistics
- Recent activity tracking
- Mood pattern analysis
- Progress visualization

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **Database**: Neon PostgreSQL with Data API
- **Authentication**: Stack Auth with JWT verification
- **State Management**: React hooks and context
- **Deployment**: Netlify with automatic CI/CD

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Neon database account
- Stack Auth project setup

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd wisdomos-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables:
```env
# Database Configuration
DATABASE_URL="your-neon-database-url"

# Neon Data API
NEON_API_ENDPOINT="https://ep-autumn-violet-aeft6u7n.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1"
NEON_API_KEY="your-neon-api-key"

# Stack Auth Configuration
STACK_AUTH_PROJECT_ID="098f28b2-c387-4e71-8dab-bc81b9643abd"
STACK_AUTH_JWKS_URL="https://api.stack-auth.com/api/v1/projects/098f28b2-c387-4e71-8dab-bc81b9643abd/.well-known/jwks.json"

# JWT Configuration
JWT_SECRET="your-jwt-secret-key"
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/                 # Next.js 15 app directory
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── journal/    # Journal CRUD operations
│   │   ├── habits/     # Habit tracking APIs
│   │   └── life-areas/ # Life areas management
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Main dashboard
│   ├── journal/        # Journal management
│   ├── habits/         # Habit tracking
│   ├── life-areas/     # Life areas management
│   ├── profile/        # User profile
│   └── globals.css     # Global styles
├── components/         # Reusable React components
│   ├── ui/            # Base UI components
│   └── layout/        # Layout components
├── lib/               # Utilities and configurations
│   ├── database/      # Database models and API client
│   │   ├── neon-api.ts    # Neon Data API client
│   │   ├── models.ts      # Database models
│   │   └── types.ts       # TypeScript types
│   ├── auth.ts        # Authentication utilities
│   ├── middleware.ts  # Request middleware
│   └── utils.ts       # General utilities
└── public/            # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## API Routes

### Authentication
- `GET/POST /api/users` - User management
- Middleware handles JWT verification

### Journal
- `GET /api/journal` - Get user's journal entries
- `POST /api/journal` - Create new journal entry
- `GET /api/journal/[id]` - Get specific journal entry
- `PUT /api/journal/[id]` - Update journal entry
- `DELETE /api/journal/[id]` - Delete journal entry

### Habits
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create new habit
- `GET /api/habits/[id]` - Get specific habit
- `PUT /api/habits/[id]` - Update habit
- `DELETE /api/habits/[id]` - Delete habit
- `POST /api/habits/track` - Track habit completion
- `GET /api/habits/track` - Get tracking data

### Life Areas
- `GET /api/life-areas` - Get user's life areas
- `POST /api/life-areas` - Create new life area
- `GET /api/life-areas/[id]` - Get specific life area
- `PUT /api/life-areas/[id]` - Update life area
- `DELETE /api/life-areas/[id]` - Delete life area

## Database Schema

The application uses the following main models:

- **Users**: User authentication and profile data
- **Journal Entries**: Personal journal with mood tracking
- **Life Areas**: Categories for organizing habits and goals
- **Habits**: Trackable habits with frequency settings
- **Habit Tracking**: Individual completion records

## Authentication Flow

1. User visits protected route
2. Middleware checks for JWT token in cookies
3. Token verified against Stack Auth JWKS
4. User info added to request headers for API routes
5. Redirect to login if authentication fails

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Deployment

### Netlify Deployment

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

The `netlify.toml` file includes:
- Build configuration
- Redirect rules for SPA routing
- Security headers
- Caching policies

### Manual Deployment

```bash
npm run build
npm start
```

## Security

- JWT-based authentication with Stack Auth
- Protected API routes with middleware
- Input validation with Zod schemas
- Security headers via Netlify configuration
- Environment variable protection

## Performance

- Next.js 15 with React 19 optimizations
- Tailwind CSS for minimal bundle size
- Lazy loading and code splitting
- Optimized images and assets
- CDN delivery via Netlify

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is private and proprietary.

## Support

For support and questions, please contact the development team.

---

Built with ❤️ using Next.js 15, React 19, and modern web technologies.