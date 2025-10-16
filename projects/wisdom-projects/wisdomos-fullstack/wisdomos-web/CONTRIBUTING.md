# Contributing to WisdomOS Web

[![Contributors](https://img.shields.io/badge/Contributors-Welcome-brightgreen.svg)](https://github.com/your-org/wisdomos-web)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant-blue.svg)](https://www.contributor-covenant.org/)
[![Good First Issues](https://img.shields.io/badge/Good%20First%20Issues-Available-purple.svg)](https://github.com/your-org/wisdomos-web/labels/good%20first%20issue)

Thank you for your interest in contributing to WisdomOS Web! This document provides guidelines and information for contributors to help make the process smooth and collaborative.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Contribution Workflow](#contribution-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@wisdomos.com.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:
- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, education, nationality, personal appearance
- Race, religion, or sexual identity and orientation

### Our Standards

**Positive behavior includes**:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes**:
- Harassment, trolling, or discriminatory comments
- Personal or political attacks
- Publishing others' private information without consent
- Other conduct which could reasonably be considered inappropriate

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

**🐛 Bug Reports**: Help us identify and fix issues
**✨ Feature Requests**: Suggest new features or improvements
**📝 Documentation**: Improve or add documentation
**📈 Code Contributions**: Fix bugs or implement features
**💬 Community Support**: Help other users in discussions
**🎨 Design**: UI/UX improvements and suggestions
**🗺️ Translation**: Help translate the application (future)

### Getting Started

1. **Fork the Repository**: Click the "Fork" button on GitHub
2. **Set up Development Environment**: Follow the [Development Setup](#development-setup) guide
3. **Find an Issue**: Look for issues labeled `good first issue` or `help wanted`
4. **Ask Questions**: Don't hesitate to ask questions in issues or discussions

### Good First Issues

New contributors should look for issues labeled:
- `good first issue`: Perfect for first-time contributors
- `help wanted`: We need help with these
- `documentation`: Help improve our docs
- `bug`: Fix reported bugs
- `enhancement`: Add new features

## Development Setup

### Prerequisites

- **Node.js**: 18.17.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: Latest version
- **Code Editor**: VS Code recommended (with extensions)

### Local Setup

1. **Clone Your Fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/wisdomos-web.git
   cd wisdomos-web
   ```

2. **Add Upstream Remote**:
   ```bash
   git remote add upstream https://github.com/your-org/wisdomos-web.git
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Set Up Environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

6. **Verify Setup**:
   Open http://localhost:3000 and ensure the application loads correctly.

### Development Environment

**Recommended VS Code Extensions**:
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Contribution Workflow

### 1. Create a Branch

Create a descriptive branch name:
```bash
# For features
git checkout -b feature/add-habit-categories

# For bug fixes
git checkout -b fix/journal-save-error

# For documentation
git checkout -b docs/update-api-examples
```

### 2. Make Changes

- Write clear, readable code
- Follow our [coding standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Build check
npm run build
```

### 4. Commit Changes

Follow our [commit guidelines](#commit-guidelines):
```bash
git add .
git commit -m "feat(habits): add category support for habit organization"
```

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a pull request on GitHub.

## Coding Standards

### TypeScript Guidelines

**Type Definitions**:
```typescript
// Always define interfaces for props
interface HabitCardProps {
  habit: Habit;
  onToggle: (habitId: string) => void;
  onEdit?: (habit: Habit) => void;
}

// Use proper return types
function calculateStreak(completions: HabitCompletion[]): number {
  // Implementation
}

// Avoid 'any' type - use specific types
interface ApiResponse<T> {
  data: T;
  error?: string;
  meta?: ResponseMetadata;
}
```

**Import Organization**:
```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';

// 2. Internal utilities
import { cn } from '@/lib/utils';
import { HabitModel } from '@/lib/database/models';

// 3. Type imports (separate)
import type { Habit, HabitFormData } from '@/types/habits';

// 4. Relative imports
import { Button } from '../ui/Button';
import { Modal } from './Modal';
```

### React Best Practices

**Component Structure**:
```typescript
// Use function components with TypeScript
export function HabitCard({ habit, onToggle, onEdit }: HabitCardProps) {
  // 1. State and hooks at the top
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, [habit.id]);
  
  // 3. Event handlers
  const handleToggle = useCallback(async () => {
    setIsLoading(true);
    try {
      await onToggle(habit.id);
    } catch (err) {
      setError('Failed to toggle habit');
    } finally {
      setIsLoading(false);
    }
  }, [habit.id, onToggle]);
  
  // 4. Early returns for loading/error states
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // 5. Main render
  return (
    <div className="habit-card">
      {/* Component JSX */}
    </div>
  );
}
```

**Custom Hooks**:
```typescript
// Encapsulate related logic
export function useHabitToggle(habitId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const toggle = useCallback(async () => {
    // Implementation
  }, [habitId]);
  
  return { toggle, isLoading, error };
}
```

### CSS/Tailwind Guidelines

**Component Styling**:
```typescript
// Use utility classes with semantic organization
const cardClasses = cn(
  // Layout
  'flex flex-col gap-4 p-6',
  // Appearance
  'bg-white rounded-lg shadow-sm border border-gray-200',
  // Interactive states
  'hover:shadow-md hover:border-gray-300 transition-all duration-200',
  // Responsive
  'sm:flex-row sm:items-center',
  // Conditional classes
  isCompleted && 'bg-green-50 border-green-200',
  isLoading && 'opacity-50 pointer-events-none'
);
```

**Design Tokens**:
```typescript
// Use consistent spacing
const spacing = {
  xs: '0.5rem',  // 8px
  sm: '0.75rem', // 12px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
};

// Use semantic color names
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
};
```

### API Development

**Route Structure**:
```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // 2. Input validation
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 50;
    
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }
    
    // 3. Business logic
    const habits = await HabitModel.findByUserId(user.id, { limit });
    
    // 4. Response formatting
    return NextResponse.json({
      data: habits,
      meta: {
        count: habits.length,
        limit,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Validation with Zod**:
```typescript
const createHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  targetValue: z.number().int().positive().optional(),
  lifeAreaId: z.string().uuid().optional(),
});

// Usage in API route
const body = await request.json();
const validatedData = createHabitSchema.parse(body);
```

## Testing Guidelines

### Test Structure

Organize tests by type:
```
__tests__/
├── components/          # Component tests
├── pages/              # Page tests
├── api/                # API route tests
├── utils/              # Utility tests
└── integration/        # Integration tests
```

### Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HabitCard } from '@/components/habits/HabitCard';
import { mockHabit } from '../__mocks__/habits';

describe('HabitCard', () => {
  const mockProps = {
    habit: mockHabit,
    onToggle: jest.fn(),
    onEdit: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders habit information correctly', () => {
    render(<HabitCard {...mockProps} />);
    
    expect(screen.getByText(mockHabit.name)).toBeInTheDocument();
    expect(screen.getByText(mockHabit.description)).toBeInTheDocument();
  });
  
  it('calls onToggle when toggle button is clicked', async () => {
    render(<HabitCard {...mockProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle habit/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(mockProps.onToggle).toHaveBeenCalledWith(mockHabit.id);
    });
  });
  
  it('shows loading state during toggle', async () => {
    const slowOnToggle = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<HabitCard {...mockProps} onToggle={slowOnToggle} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle habit/i });
    fireEvent.click(toggleButton);
    
    expect(toggleButton).toBeDisabled();
    
    await waitFor(() => {
      expect(toggleButton).not.toBeDisabled();
    });
  });
});
```

### API Testing

```typescript
import { GET, POST } from '@/app/api/habits/route';
import { NextRequest } from 'next/server';
import { mockUser, mockHabit } from '../__mocks__';

// Mock dependencies
jest.mock('@/lib/middleware', () => ({
  getUserFromHeaders: jest.fn(),
}));

jest.mock('@/lib/database/models', () => ({
  HabitModel: {
    findByUserId: jest.fn(),
    create: jest.fn(),
  },
}));

describe('/api/habits', () => {
  describe('GET', () => {
    it('returns habits for authenticated user', async () => {
      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (HabitModel.findByUserId as jest.Mock).mockResolvedValue([mockHabit]);
      
      const request = new NextRequest('http://localhost:3000/api/habits');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toEqual([mockHabit]);
    });
    
    it('returns 401 for unauthenticated requests', async () => {
      (getUserFromHeaders as jest.Mock).mockReturnValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/habits');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });
  });
});
```

### Test Coverage

**Minimum Requirements**:
- Unit tests: 80% coverage
- Integration tests: Key user flows
- API tests: All endpoints
- Component tests: Core functionality

**Running Tests**:
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test HabitCard.test.tsx

# Watch mode for development
npm run test:watch
```

## Documentation

### Documentation Types

1. **Code Comments**: For complex logic
2. **README Updates**: For setup and usage changes
3. **API Documentation**: For new endpoints
4. **User Guide**: For new features
5. **Developer Guide**: For technical changes

### Documentation Standards

**Code Comments**:
```typescript
/**
 * Calculates the current streak for a habit based on completion history.
 * 
 * @param completions - Array of habit completions, sorted by date
 * @param frequency - How often the habit should be completed
 * @returns The current streak count in days
 * 
 * @example
 * const streak = calculateStreak(completions, 'daily');
 * console.log(`Current streak: ${streak} days`);
 */
function calculateStreak(
  completions: HabitCompletion[], 
  frequency: HabitFrequency
): number {
  // Implementation with clear logic
}
```

**API Documentation**:
```typescript
/**
 * POST /api/habits
 * 
 * Creates a new habit for the authenticated user.
 * 
 * @body {
 *   name: string;           // Required: Habit name (1-200 chars)
 *   description?: string;   // Optional: Description (max 1000 chars)
 *   frequency: 'daily' | 'weekly' | 'monthly';
 *   targetValue?: number;   // Optional: Target value for tracking
 *   lifeAreaId?: string;    // Optional: Associated life area UUID
 * }
 * 
 * @returns {
 *   data: Habit;           // Created habit object
 *   meta: {
 *     timestamp: string;   // ISO 8601 creation timestamp
 *   }
 * }
 * 
 * @throws {
 *   400: Validation error
 *   401: Unauthorized
 *   500: Server error
 * }
 */
```

### Updating Documentation

When making changes:
1. Update relevant documentation files
2. Add examples for new features
3. Update API documentation for endpoint changes
4. Consider user impact and update user guide
5. Add troubleshooting information if needed

## Commit Guidelines

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

### Scope Examples

- `auth`: Authentication related
- `habits`: Habit tracking features
- `journal`: Journaling features
- `dashboard`: Dashboard components
- `api`: API changes
- `db`: Database related
- `ui`: UI components
- `docs`: Documentation

### Commit Examples

**Good commits**:
```bash
# New feature
feat(habits): add category support for habit organization

# Bug fix
fix(auth): resolve token refresh issue on page reload

# Documentation
docs(api): update endpoint examples with new response format

# Performance improvement
perf(dashboard): optimize habit list rendering with virtualization

# Breaking change
feat(api)!: change habits endpoint to return paginated results

BREAKING CHANGE: The /api/habits endpoint now returns paginated results.
Migration: Update client code to handle pagination.
```

**Avoid these**:
```bash
# Too vague
fix: bug fix
update: stuff

# Missing scope
feat: add new feature

# Too detailed for subject line
feat(habits): add support for categorizing habits into different life areas with color coding and custom icons
```

## Pull Request Process

### Before Creating a PR

1. **Test Everything**:
   ```bash
   npm run test
   npm run type-check
   npm run lint
   npm run build
   ```

2. **Update Documentation**: Ensure all relevant docs are updated

3. **Check Compatibility**: Test on different browsers if UI changes

4. **Sync with Main**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of what this PR does and why.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- List key changes made
- Be specific about modified files/components
- Mention any new dependencies

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Tested on multiple browsers (if UI changes)
- [ ] Tested with different user scenarios

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Code is commented where necessary
- [ ] Documentation has been updated
- [ ] Tests have been added/updated
- [ ] No breaking changes (or breaking changes documented)

## Related Issues
Closes #123
Related to #456
```

### PR Review Process

1. **Automated Checks**: CI/CD pipeline must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Reviewers will test functionality
4. **Documentation**: Ensure docs are updated
5. **Approval**: PR approved by maintainer
6. **Merge**: Maintainer merges the PR

### Review Guidelines

**For Authors**:
- Respond promptly to feedback
- Make requested changes in new commits
- Ask questions if feedback is unclear
- Update PR description if scope changes

**For Reviewers**:
- Focus on code quality, not personal preferences
- Provide constructive, actionable feedback
- Test the changes if possible
- Approve when ready, request changes when needed

## Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots.

## Environment
- Browser: [e.g. Chrome 119, Firefox 118]
- OS: [e.g. macOS 14, Windows 11]
- Device: [e.g. MacBook Pro, iPhone 15]

## Additional Context
Any other relevant information.
```

### Feature Requests

Use the feature request template:

```markdown
## Feature Description
A clear description of what you want to happen.

## Problem Statement
What problem does this solve?

## Proposed Solution
Describe your preferred solution.

## Alternatives Considered
Describe alternatives you've considered.

## Additional Context
Any other context or screenshots.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

### Issue Labels

We use labels to categorize issues:

**Type Labels**:
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to docs
- `question`: Further information is requested

**Priority Labels**:
- `priority: critical`: Security issues, data loss
- `priority: high`: Major functionality broken
- `priority: medium`: Important but not urgent
- `priority: low`: Nice to have

**Difficulty Labels**:
- `good first issue`: Perfect for newcomers
- `help wanted`: We need help with this
- `difficulty: easy`: Can be completed quickly
- `difficulty: medium`: Requires some experience
- `difficulty: hard`: Complex issue

**Component Labels**:
- `auth`: Authentication related
- `habits`: Habit tracking
- `journal`: Journaling features
- `dashboard`: Dashboard components
- `api`: Backend API
- `ui`: User interface
- `database`: Database related

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community chat
- **Discord**: Real-time chat (coming soon)
- **Email**: team@wisdomos.com for sensitive matters

### Community Guidelines

1. **Be Respectful**: Treat everyone with respect and kindness
2. **Be Helpful**: Help others when you can
3. **Stay On Topic**: Keep discussions relevant
4. **Be Patient**: Everyone is learning and growing
5. **Give Credit**: Acknowledge others' contributions

### Recognition

We recognize contributors through:
- **Contributors List**: All contributors listed in README
- **Release Notes**: Major contributors mentioned
- **Special Recognition**: Outstanding contributions highlighted
- **Maintainer Invitations**: Active contributors may be invited as maintainers

### Becoming a Maintainer

Maintainers are trusted community members who help guide the project. To become a maintainer:

1. **Consistent Contributions**: Regular, quality contributions over time
2. **Community Involvement**: Help others in issues and discussions  
3. **Code Quality**: Demonstrate understanding of project standards
4. **Reliability**: Follow through on commitments
5. **Team Collaboration**: Work well with existing team

**Maintainer Responsibilities**:
- Review and merge pull requests
- Triage and label issues
- Help with releases and planning
- Mentor new contributors
- Maintain code quality standards

---

## Getting Help

If you need help contributing:

1. **Check Documentation**: Start with our guides
2. **Search Issues**: See if your question was already asked
3. **Ask in Discussions**: Community Q&A
4. **Contact Maintainers**: Reach out to team members

### Maintainer Contact

- **Technical Lead**: @technical-lead
- **Project Lead**: @project-lead
- **Community Manager**: @community-manager

---

## Thank You

Thank you for contributing to WisdomOS Web! Your contributions help make personal development tools more accessible and effective for everyone. Every contribution, no matter how small, makes a difference.

**Happy Contributing!** 🎉

---

**Last Updated**: October 2024  
**Contributing Guide Version**: 1.0.0  
**Next Review**: January 2024

For questions about this guide, please [open an issue](https://github.com/your-org/wisdomos-web/issues/new) or contact the maintainers.