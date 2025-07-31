# PVT Ecosystem Brand Guidelines

## Brand Identity

### Mission Statement
"Transforming hospitality through compassionate education, democratized automation, and collective independence."

### Brand Personality
- **Revolutionary**: Challenging the status quo
- **Compassionate**: Human-first approach
- **Empowering**: Democratizing access
- **United**: Building community
- **Professional**: Enterprise-grade quality

## Visual Identity

### Logo System

#### Primary Logo
```
PVT ECOSYSTEM
Academy • Automation • United
```

#### Logo Variations
- Full Logo (icon + wordmark)
- Icon Only (for app/favicon)
- Wordmark Only (for headers)
- Stacked Version (for mobile)

### Color Palette

#### Primary Colors
```css
/* Brand Colors */
--pvt-rebel-red: #DC2626;      /* Revolutionary red - primary CTA */
--pvt-midnight: #0F172A;        /* Deep professional blue-black */
--pvt-freedom-blue: #2563EB;   /* Trust and stability */
--pvt-unity-purple: #7C3AED;   /* Innovation and creativity */

/* Secondary Colors */
--pvt-success-green: #16A34A;  /* Growth and success */
--pvt-wisdom-gold: #F59E0B;    /* Knowledge and premium */
--pvt-hope-teal: #0891B2;      /* Progress and clarity */
--pvt-courage-orange: #EA580C; /* Energy and action */

/* Neutral Palette */
--pvt-slate-900: #0F172A;
--pvt-slate-700: #334155;
--pvt-slate-500: #64748B;
--pvt-slate-300: #CBD5E1;
--pvt-slate-100: #F1F5F9;
--pvt-white: #FFFFFF;

/* Gradients */
--pvt-hero-gradient: linear-gradient(135deg, #DC2626 0%, #7C3AED 100%);
--pvt-trust-gradient: linear-gradient(135deg, #2563EB 0%, #0891B2 100%);
--pvt-premium-gradient: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%);
```

### Typography

#### Font Stack
```css
/* Primary Font - Modern, Clean, Professional */
--font-primary: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;

/* Display Font - Bold, Impactful */
--font-display: 'Clash Display', 'Plus Jakarta Sans', sans-serif;

/* Monospace - Code, Numbers */
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

#### Type Scale
```css
/* Display Sizes */
--text-6xl: 4rem;      /* 64px - Hero headlines */
--text-5xl: 3rem;      /* 48px - Section headers */
--text-4xl: 2.25rem;   /* 36px - Page titles */
--text-3xl: 1.875rem;  /* 30px - Major headings */
--text-2xl: 1.5rem;    /* 24px - Subheadings */
--text-xl: 1.25rem;    /* 20px - Large body */
--text-lg: 1.125rem;   /* 18px - Emphasis */
--text-base: 1rem;     /* 16px - Body text */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-xs: 0.75rem;    /* 12px - Labels */
```

### Visual Elements

#### Border Radius System
```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px - Subtle */
--radius-md: 0.375rem;   /* 6px - Default */
--radius-lg: 0.5rem;     /* 8px - Cards */
--radius-xl: 0.75rem;    /* 12px - Buttons */
--radius-2xl: 1rem;      /* 16px - Modal */
--radius-full: 9999px;   /* Pills */
```

#### Shadow System
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-glow: 0 0 30px rgb(220 38 38 / 0.3);
```

### Icons & Imagery

#### Icon Style
- Line icons for navigation
- Filled icons for emphasis
- Custom illustrations for features
- Consistent 24px grid system

#### Photography Style
- Authentic, candid moments
- Diverse, inclusive representation
- Natural lighting preferred
- Focus on human connections
- Avoid stock photo clichés

#### Illustration Style
- Geometric, modern approach
- Use brand gradient colors
- Simple, clear messaging
- Consistent line weights
- Subtle animations

## UI Components

### Button Hierarchy

#### Primary Button
- Background: rebel-red
- Text: white
- Hover: Darker red with shadow
- Use: Main CTAs

#### Secondary Button
- Background: transparent
- Border: 2px solid current
- Hover: Fill with color
- Use: Secondary actions

#### Ghost Button
- Background: transparent
- Text: colored
- Hover: Light background
- Use: Tertiary actions

### Card System
- White background
- Subtle shadow
- Rounded corners (lg)
- Hover: Lift effect
- Active: Pressed effect

### Form Elements
- Full-width inputs
- Clear labels
- Inline validation
- Success/error states
- Accessible focus states

## Voice & Tone

### Brand Voice Attributes
- **Bold**: We don't mince words about OTA exploitation
- **Empowering**: We believe in our users' potential
- **Clear**: We explain complex things simply
- **Human**: We're people helping people
- **Revolutionary**: We're changing an industry

### Messaging Examples

#### Headlines
- ❌ "Welcome to our platform"
- ✅ "Join the Hospitality Revolution"

#### CTAs
- ❌ "Submit"
- ✅ "Start Your Journey"

#### Error Messages
- ❌ "Error: Invalid input"
- ✅ "Let's fix that together - check your email format"

## Platform-Specific Guidelines

### Academy
- Colors: Freedom blue, wisdom gold
- Tone: Encouraging, educational
- Imagery: Students learning, growth

### Automation
- Colors: Unity purple, hope teal
- Tone: Innovative, efficient
- Imagery: Technology, connection

### United
- Colors: Rebel red, courage orange
- Tone: Defiant, empowering
- Imagery: Unity, resistance

## Animation Guidelines

### Micro-Interactions
- Duration: 200-300ms
- Easing: ease-out
- Purpose: Feedback
- Subtle, not distracting

### Page Transitions
- Duration: 400-600ms
- Stagger: 100ms between elements
- Direction: Natural flow
- Performance: 60fps

### Loading States
- Skeleton screens preferred
- Branded spinner as fallback
- Progress indicators for long tasks
- Meaningful loading messages

## Accessibility Standards

### Color Contrast
- WCAG AAA for body text
- WCAG AA for large text
- Test all color combinations
- Provide alternative indicators

### Interactive Elements
- 44px minimum touch targets
- Clear focus indicators
- Keyboard navigation
- Screen reader optimization

### Content Guidelines
- Clear heading hierarchy
- Descriptive link text
- Alt text for images
- Captions for videos

## Application Examples

### Marketing Site
- Hero: Bold gradient background
- Features: Card-based layout
- Testimonials: Photo + quote
- CTA: High contrast buttons

### Dashboard
- Sidebar: Dark theme
- Content: Light background
- Data: Clear visualization
- Actions: Consistent placement

### Mobile App
- Navigation: Bottom tabs
- Headers: Sticky with blur
- Cards: Full-width with padding
- Buttons: Thumb-friendly placement

---

## Brand Assets Checklist

- [ ] Logo files (SVG, PNG)
- [ ] Color swatches (ASE, CSS)
- [ ] Typography specimens
- [ ] Icon library
- [ ] Pattern library
- [ ] Component library
- [ ] Email templates
- [ ] Social media templates
- [ ] Presentation template
- [ ] Brand guidelines PDF

---

*These guidelines ensure consistent, powerful brand expression across all touchpoints of the PVT Ecosystem platform.*