// Adaptive UI Components System for PVT Ecosystem
// Rich features for easy adaptability and drag-and-drop functionality

class AdaptiveUISystem {
    constructor() {
        this.components = new Map();
        this.dragDropManager = new DragDropManager();
        this.themeManager = new ThemeManager();
        this.responsiveManager = new ResponsiveManager();
        this.accessibilityManager = new AccessibilityManager();
        this.init();
    }

    init() {
        this.registerComponents();
        this.setupDragDrop();
        this.initializeThemeSystem();
        this.setupResponsiveHandlers();
        this.enableAccessibilityFeatures();
        this.setupAnimationSystem();
    }

    registerComponents() {
        // Register all adaptive components
        this.components.set('adaptive-card', AdaptiveCard);
        this.components.set('adaptive-modal', AdaptiveModal);
        this.components.set('adaptive-form', AdaptiveForm);
        this.components.set('adaptive-navigation', AdaptiveNavigation);
        this.components.set('adaptive-carousel', AdaptiveCarousel);
        this.components.set('adaptive-tabs', AdaptiveTabs);
        this.components.set('adaptive-accordion', AdaptiveAccordion);
        this.components.set('adaptive-tooltip', AdaptiveTooltip);
        this.components.set('adaptive-dropdown', AdaptiveDropdown);
        this.components.set('adaptive-progress', AdaptiveProgress);
    }

    setupDragDrop() {
        this.dragDropManager.initialize();
    }

    createComponent(type, config = {}) {
        const ComponentClass = this.components.get(type);
        if (!ComponentClass) {
            throw new Error(`Component type "${type}" not found`);
        }
        return new ComponentClass(config);
    }
}

// Drag and Drop Manager
class DragDropManager {
    constructor() {
        this.draggedElement = null;
        this.dropZones = new Set();
        this.dragHandlers = new Map();
    }

    initialize() {
        this.setupDragHandlers();
        this.setupDropZones();
        this.addDragStyles();
    }

    setupDragHandlers() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.draggable) {
                this.draggedElement = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.draggable) {
                e.target.classList.remove('dragging');
                this.draggedElement = null;
            }
        });
    }

    setupDropZones() {
        document.addEventListener('dragover', (e) => {
            if (e.target.classList.contains('drop-zone')) {
                e.preventDefault();
                e.target.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('drop-zone')) {
                e.target.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            if (e.target.classList.contains('drop-zone')) {
                e.preventDefault();
                e.target.classList.remove('drag-over');
                this.handleDrop(e);
            }
        });
    }

    handleDrop(e) {
        const dropZone = e.target;
        const droppedData = e.dataTransfer.getData('text/html');
        
        if (this.draggedElement) {
            const clone = this.draggedElement.cloneNode(true);
            clone.classList.remove('dragging');
            dropZone.appendChild(clone);
            
            // Fire custom drop event
            const dropEvent = new CustomEvent('uiComponentDropped', {
                detail: {
                    element: clone,
                    dropZone: dropZone,
                    originalElement: this.draggedElement
                }
            });
            document.dispatchEvent(dropEvent);
        }
    }

    addDragStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .dragging {
                opacity: 0.5;
                transform: scale(0.95);
                transition: all 0.2s ease;
            }
            
            .drop-zone {
                min-height: 100px;
                border: 2px dashed transparent;
                border-radius: 8px;
                transition: all 0.3s ease;
            }
            
            .drop-zone.drag-over {
                border-color: var(--primary-500);
                background: rgba(59, 130, 246, 0.05);
            }
            
            .draggable-handle {
                cursor: move;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .draggable-handle:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
}

// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themes = {
            light: {
                primary: '#3b82f6',
                secondary: '#64748b',
                background: '#ffffff',
                surface: '#f8fafc',
                text: '#0f172a'
            },
            dark: {
                primary: '#60a5fa',
                secondary: '#94a3b8',
                background: '#0f172a',
                surface: '#1e293b',
                text: '#f1f5f9'
            },
            high_contrast: {
                primary: '#000000',
                secondary: '#666666',
                background: '#ffffff',
                surface: '#f0f0f0',
                text: '#000000'
            }
        };
    }

    setTheme(themeName) {
        if (!this.themes[themeName]) return;
        
        this.currentTheme = themeName;
        const theme = this.themes[themeName];
        
        Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--theme-${key}`, value);
        });
        
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('preferred-theme', themeName);
        
        // Fire theme change event
        const themeEvent = new CustomEvent('themeChanged', {
            detail: { theme: themeName }
        });
        document.dispatchEvent(themeEvent);
    }

    detectPreferredTheme() {
        const saved = localStorage.getItem('preferred-theme');
        if (saved && this.themes[saved]) {
            return saved;
        }
        
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            return 'high_contrast';
        }
        
        return 'light';
    }
}

// Responsive Manager
class ResponsiveManager {
    constructor() {
        this.breakpoints = {
            sm: 640,
            md: 768,
            lg: 1024,
            xl: 1280,
            '2xl': 1536
        };
        this.currentBreakpoint = 'lg';
        this.observers = new Set();
    }

    initialize() {
        this.updateBreakpoint();
        this.setupResizeHandler();
        this.setupContainerQueries();
    }

    updateBreakpoint() {
        const width = window.innerWidth;
        let newBreakpoint = 'sm';
        
        for (const [name, minWidth] of Object.entries(this.breakpoints)) {
            if (width >= minWidth) {
                newBreakpoint = name;
            }
        }
        
        if (newBreakpoint !== this.currentBreakpoint) {
            this.currentBreakpoint = newBreakpoint;
            this.notifyObservers();
        }
    }

    setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.updateBreakpoint();
            }, 100);
        });
    }

    setupContainerQueries() {
        // Polyfill for container queries
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(entries => {
                entries.forEach(entry => {
                    const element = entry.target;
                    const width = entry.contentRect.width;
                    
                    // Apply container-based classes
                    element.classList.remove('container-sm', 'container-md', 'container-lg');
                    
                    if (width >= 768) {
                        element.classList.add('container-lg');
                    } else if (width >= 480) {
                        element.classList.add('container-md');
                    } else {
                        element.classList.add('container-sm');
                    }
                });
            });
            
            // Observe all elements with container-query class
            document.querySelectorAll('.container-query').forEach(el => {
                resizeObserver.observe(el);
            });
        }
    }

    addObserver(callback) {
        this.observers.add(callback);
    }

    removeObserver(callback) {
        this.observers.delete(callback);
    }

    notifyObservers() {
        this.observers.forEach(callback => {
            callback(this.currentBreakpoint);
        });
    }
}

// Accessibility Manager
class AccessibilityManager {
    constructor() {
        this.focusVisible = false;
        this.reducedMotion = false;
        this.highContrast = false;
    }

    initialize() {
        this.setupFocusManagement();
        this.setupMotionPreferences();
        this.setupContrastPreferences();
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
    }

    setupFocusManagement() {
        // Add focus-visible polyfill behavior
        document.addEventListener('keydown', () => {
            this.focusVisible = true;
            document.body.classList.add('focus-visible');
        });

        document.addEventListener('mousedown', () => {
            this.focusVisible = false;
            document.body.classList.remove('focus-visible');
        });
    }

    setupMotionPreferences() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.reducedMotion = mediaQuery.matches;
        
        mediaQuery.addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            document.body.classList.toggle('reduce-motion', this.reducedMotion);
        });
        
        if (this.reducedMotion) {
            document.body.classList.add('reduce-motion');
        }
    }

    setupContrastPreferences() {
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        this.highContrast = mediaQuery.matches;
        
        mediaQuery.addEventListener('change', (e) => {
            this.highContrast = e.matches;
            document.body.classList.toggle('high-contrast', this.highContrast);
        });
        
        if (this.highContrast) {
            document.body.classList.add('high-contrast');
        }
    }

    setupKeyboardNavigation() {
        // Skip links
        this.addSkipLinks();
        
        // Focus trap for modals
        this.setupFocusTrap();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#footer" class="skip-link">Skip to footer</a>
        `;
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    setupFocusTrap() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal[aria-hidden="false"]');
                if (modal) {
                    this.trapFocus(e, modal);
                }
            }
        });
    }

    trapFocus(event, container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + M: Open main menu
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                const menu = document.querySelector('.main-menu');
                if (menu) menu.focus();
            }
            
            // Alt + S: Open search
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                const search = document.querySelector('.search-input');
                if (search) search.focus();
            }
            
            // Escape: Close modals/dropdowns
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal[aria-hidden="false"]');
                if (modal) {
                    this.closeModal(modal);
                }
                
                const dropdown = document.querySelector('.dropdown.open');
                if (dropdown) {
                    this.closeDropdown(dropdown);
                }
            }
        });
    }

    setupScreenReaderSupport() {
        // Add live regions for dynamic content
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
}

// Adaptive Component Base Class
class AdaptiveComponent {
    constructor(config = {}) {
        this.config = {
            responsive: true,
            accessible: true,
            draggable: false,
            theme: 'auto',
            ...config
        };
        this.element = null;
        this.initialized = false;
    }

    create() {
        if (this.initialized) return this.element;
        
        this.element = this.render();
        this.setupEventListeners();
        this.setupAccessibility();
        this.setupResponsive();
        this.setupDragDrop();
        
        this.initialized = true;
        return this.element;
    }

    render() {
        // To be implemented by subclasses
        throw new Error('render() method must be implemented');
    }

    setupEventListeners() {
        // To be implemented by subclasses
    }

    setupAccessibility() {
        if (!this.config.accessible) return;
        
        // Add basic accessibility attributes
        if (!this.element.getAttribute('role')) {
            this.element.setAttribute('role', this.getDefaultRole());
        }
        
        // Add keyboard navigation
        if (this.isInteractive()) {
            this.element.setAttribute('tabindex', '0');
            this.setupKeyboardHandlers();
        }
    }

    setupResponsive() {
        if (!this.config.responsive) return;
        
        // Add responsive classes
        this.element.classList.add('responsive-component');
        
        // Setup resize observer
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(() => {
                this.handleResize();
            });
            resizeObserver.observe(this.element);
        }
    }

    setupDragDrop() {
        if (!this.config.draggable) return;
        
        this.element.draggable = true;
        this.element.classList.add('draggable-component');
        
        // Add drag handle
        const handle = document.createElement('div');
        handle.className = 'draggable-handle';
        handle.innerHTML = '⋮⋮';
        this.element.appendChild(handle);
    }

    getDefaultRole() {
        return 'region';
    }

    isInteractive() {
        return false;
    }

    setupKeyboardHandlers() {
        this.element.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
    }

    handleKeydown(e) {
        // To be implemented by subclasses
    }

    handleResize() {
        // To be implemented by subclasses
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.initialized = false;
    }
}

// Adaptive Card Component
class AdaptiveCard extends AdaptiveComponent {
    render() {
        const card = document.createElement('div');
        card.className = 'adaptive-card card';
        
        if (this.config.header) {
            const header = document.createElement('div');
            header.className = 'card-header';
            header.innerHTML = this.config.header;
            card.appendChild(header);
        }
        
        const body = document.createElement('div');
        body.className = 'card-body';
        body.innerHTML = this.config.content || '';
        card.appendChild(body);
        
        if (this.config.footer) {
            const footer = document.createElement('div');
            footer.className = 'card-footer';
            footer.innerHTML = this.config.footer;
            card.appendChild(footer);
        }
        
        return card;
    }

    getDefaultRole() {
        return 'article';
    }
}

// Adaptive Modal Component
class AdaptiveModal extends AdaptiveComponent {
    render() {
        const modal = document.createElement('div');
        modal.className = 'adaptive-modal modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        modal.appendChild(backdrop);
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        if (this.config.title) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            header.innerHTML = `
                <h2 class="modal-title">${this.config.title}</h2>
                <button class="modal-close" aria-label="Close modal">&times;</button>
            `;
            content.appendChild(header);
        }
        
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.innerHTML = this.config.content || '';
        content.appendChild(body);
        
        modal.appendChild(content);
        
        return modal;
    }

    setupEventListeners() {
        const closeBtn = this.element.querySelector('.modal-close');
        const backdrop = this.element.querySelector('.modal-backdrop');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        if (backdrop) {
            backdrop.addEventListener('click', () => this.close());
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    open() {
        this.element.setAttribute('aria-hidden', 'false');
        this.element.classList.add('open');
        document.body.classList.add('modal-open');
        
        // Focus management
        const firstFocusable = this.element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    close() {
        this.element.setAttribute('aria-hidden', 'true');
        this.element.classList.remove('open');
        document.body.classList.remove('modal-open');
    }

    isOpen() {
        return this.element.getAttribute('aria-hidden') === 'false';
    }

    getDefaultRole() {
        return 'dialog';
    }

    isInteractive() {
        return true;
    }
}

// Initialize the Adaptive UI System
const adaptiveUI = new AdaptiveUISystem();

// Export for global use
window.AdaptiveUI = adaptiveUI;
window.AdaptiveComponent = AdaptiveComponent;
window.AdaptiveCard = AdaptiveCard;
window.AdaptiveModal = AdaptiveModal;

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    adaptiveUI.themeManager.setTheme(adaptiveUI.themeManager.detectPreferredTheme());
    adaptiveUI.responsiveManager.initialize();
    adaptiveUI.accessibilityManager.initialize();
});

// Add CSS for skip links and accessibility
const accessibilityStyles = document.createElement('style');
accessibilityStyles.textContent = `
    .skip-links {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10000;
    }
    
    .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        transition: top 0.3s;
    }
    
    .skip-link:focus {
        top: 6px;
    }
    
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    
    .focus-visible button:focus,
    .focus-visible input:focus,
    .focus-visible select:focus,
    .focus-visible textarea:focus,
    .focus-visible a:focus {
        outline: 2px solid var(--primary-500);
        outline-offset: 2px;
    }
    
    .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
`;
document.head.appendChild(accessibilityStyles);