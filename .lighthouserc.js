module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/attorney/profile',
        'http://localhost:3000/user/dashboard',
      ],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless',
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        
        // Performance budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 250000 }], // 250KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 500000 }],   // 500KB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 50000 }], // 50KB
        'resource-summary:total:size': ['warn', { maxNumericValue: 1000000 }],   // 1MB
        'resource-summary:third-party:size': ['warn', { maxNumericValue: 200000 }], // 200KB
        
        // Best practices
        'uses-http2': 'error',
        'uses-text-compression': 'error',
        'efficient-animated-content': 'warn',
        'modern-image-formats': 'warn',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'uses-optimized-images': 'warn',
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'heading-order': 'error',
        'link-name': 'error',
        'button-name': 'error',
        
        // SEO
        'meta-description': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'canonical': 'warn',
        'robots-txt': 'warn',
        
        // PWA
        'service-worker': 'warn',
        'works-offline': 'warn',
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'filesystem',
        sqlDatabasePath: './lighthouse-ci.db',
      },
    },
  },
}