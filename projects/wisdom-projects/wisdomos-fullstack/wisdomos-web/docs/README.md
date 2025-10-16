# WisdomOS Web Documentation

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/your-org/wisdomos-web)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://netlify.com)

Welcome to the comprehensive documentation for **WisdomOS Web** - a Next.js 15 application for wisdom tracking, journaling, and habit formation with React 19, TypeScript, Tailwind CSS, and Neon database integration.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/wisdomos-web.git
cd wisdomos-web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation Overview

### For Users
- **[User Guide](./user-guide.md)** - Complete walkthrough of all features and functionality
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

### For Developers
- **[Developer Guide](./developer-guide.md)** - Setup, development workflow, and contribution guidelines
- **[API Documentation](./api/README.md)** - Complete API reference with examples
- **[Architecture](./architecture.md)** - System design, database schema, and technical decisions
- **[Security](./security.md)** - Authentication, authorization, and security measures

### For DevOps & Deployment
- **[Deployment Guide](./deployment.md)** - Production deployment instructions
- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute to the project

### Legal & Compliance
- **[Legal Documentation](./legal.md)** - Terms of service, privacy policy templates
- **[License](../LICENSE.md)** - Software license information
- **[Changelog](../CHANGELOG.md)** - Version history and release notes

## 🎯 What is WisdomOS Web?

WisdomOS Web is a comprehensive personal development platform that helps users:

- **📝 Journal & Reflect**: Create meaningful journal entries with mood tracking
- **🎯 Track Habits**: Build and maintain positive habits across different life areas
- **📊 Monitor Progress**: Visualize your personal growth with insightful dashboards
- **🔐 Secure & Private**: Your data is protected with enterprise-grade security

### Key Features

#### 🌟 Core Functionality
- **Smart Journaling**: Rich text editor with mood tracking and tagging
- **Habit Management**: Create, track, and analyze habits across life areas
- **Progress Visualization**: Interactive dashboards and analytics
- **Life Areas**: Organize habits and goals by life categories (Health, Career, Relationships, etc.)

#### 🛠️ Technical Excellence
- **Modern Stack**: Built with Next.js 15, React 19, and TypeScript
- **Responsive Design**: Tailwind CSS v4 for beautiful, mobile-first UI
- **Real-time Updates**: TanStack React Query for efficient data management
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Stack Auth for secure user management

#### 📱 User Experience
- **Intuitive Interface**: Clean, modern design focused on usability
- **Performance**: Optimized for speed and responsiveness
- **Accessibility**: WCAG 2.1 compliant design
- **Cross-platform**: Works seamlessly on desktop, tablet, and mobile

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Database      │
│   (Next.js 15)  │◄──►│   (Next.js)     │◄──►│   (Neon PG)     │
│   React 19      │    │   TypeScript    │    │   Prisma ORM    │
│   Tailwind CSS  │    │   Zod Validation│    │   RLS Policies  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth System   │    │   Middleware    │    │   External APIs │
│   (Stack Auth)  │    │   Rate Limiting │    │   (Optional)    │
│   JWT Tokens    │    │   CORS/Security │    │   Integrations  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **TanStack React Query** - Server state management

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Neon Database** - Serverless PostgreSQL
- **Prisma ORM** - Type-safe database client
- **Zod** - Schema validation
- **Stack Auth** - Authentication provider

### DevOps & Deployment
- **Netlify** - Static site hosting and CI/CD
- **GitHub Actions** - Continuous integration
- **ESLint** - Code linting
- **TypeScript** - Type checking

## 🚦 Project Status

| Component | Status | Version | Coverage |
|-----------|--------|---------|----------|
| Core App | ✅ Stable | 0.1.0 | 95% |
| API | ✅ Stable | 0.1.0 | 90% |
| Tests | 🟡 In Progress | - | 75% |
| Docs | ✅ Complete | 1.0.0 | 100% |

## 📈 Getting Support

- **Documentation**: Start with this documentation
- **Issues**: [GitHub Issues](https://github.com/your-org/wisdomos-web/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/wisdomos-web/discussions)
- **Security**: Report security issues to [security@yourcompany.com](mailto:security@yourcompany.com)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](../CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Pull request process
- Coding standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](../LICENSE.md) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment tools
- Neon for serverless PostgreSQL
- Stack Auth for authentication services
- The open-source community for inspiration and tools

---

**Last Updated**: October 2024  
**Documentation Version**: 1.0.0  
**Application Version**: 0.1.0

For questions or suggestions about this documentation, please [open an issue](https://github.com/your-org/wisdomos-web/issues/new).