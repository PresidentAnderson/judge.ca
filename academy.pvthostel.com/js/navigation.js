// PVT Ecosystem Navigation Controller

class NavigationController {
  constructor() {
    this.navbar = document.getElementById('navbar');
    this.navbarToggle = document.getElementById('navbarToggle');
    this.navbarMenu = document.getElementById('navbarMenu');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.isMenuOpen = false;
    this.lastScrollPosition = 0;
    
    this.init();
  }

  init() {
    // Mobile menu toggle
    this.initMobileMenu();
    
    // Scroll effects
    this.initScrollEffects();
    
    // Smooth scrolling for anchor links
    this.initSmoothScroll();
    
    // Active link highlighting
    this.initActiveLinks();
    
    // Close mobile menu on outside click
    this.initOutsideClick();
  }

  // Mobile menu functionality
  initMobileMenu() {
    if (!this.navbarToggle || !this.navbarMenu) return;
    
    this.navbarToggle.addEventListener('click', () => {
      this.toggleMenu();
    });
    
    // Close menu when clicking on nav links
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (this.isMenuOpen) {
          this.closeMenu();
        }
      });
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.navbarToggle.classList.toggle('active');
    this.navbarMenu.classList.toggle('active');
    document.body.classList.toggle('no-scroll', this.isMenuOpen);
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.navbarToggle.classList.remove('active');
    this.navbarMenu.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  // Navbar scroll effects
  initScrollEffects() {
    const handleScroll = PVTUtils.throttle(() => {
      const currentScrollPosition = window.pageYOffset;
      
      // Add scrolled class for navbar styling
      if (currentScrollPosition > 50) {
        this.navbar.classList.add('scrolled');
      } else {
        this.navbar.classList.remove('scrolled');
      }
      
      // Hide/show navbar on scroll
      if (currentScrollPosition > this.lastScrollPosition && currentScrollPosition > 200) {
        // Scrolling down
        this.navbar.style.transform = 'translateY(-100%)';
      } else {
        // Scrolling up
        this.navbar.style.transform = 'translateY(0)';
      }
      
      this.lastScrollPosition = currentScrollPosition;
    }, 100);
    
    window.addEventListener('scroll', handleScroll);
  }

  // Smooth scrolling for anchor links
  initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Skip if it's just '#'
        if (href === '#') return;
        
        const targetElement = document.querySelector(href);
        
        if (targetElement) {
          e.preventDefault();
          
          // Calculate offset for fixed navbar
          const navbarHeight = this.navbar.offsetHeight;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Update URL without jumping
          history.pushState(null, null, href);
          
          // Close mobile menu if open
          if (this.isMenuOpen) {
            this.closeMenu();
          }
        }
      });
    });
  }

  // Highlight active navigation links
  initActiveLinks() {
    const sections = document.querySelectorAll('section[id]');
    
    const observerOptions = {
      rootMargin: '-20% 0px -70% 0px'
    };
    
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
        
        if (navLink) {
          if (entry.isIntersecting) {
            // Remove active class from all links
            this.navLinks.forEach(link => link.classList.remove('active'));
            // Add active class to current link
            navLink.classList.add('active');
          }
        }
      });
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));
  }

  // Close mobile menu when clicking outside
  initOutsideClick() {
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && 
          !this.navbarMenu.contains(e.target) && 
          !this.navbarToggle.contains(e.target)) {
        this.closeMenu();
      }
    });
  }

  // Add dropdown menu functionality
  initDropdowns() {
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    
    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector('.nav-link');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (!trigger || !menu) return;
      
      // Toggle on click for mobile
      trigger.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
          e.preventDefault();
          dropdown.classList.toggle('active');
        }
      });
      
      // Show on hover for desktop
      dropdown.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 1024) {
          dropdown.classList.add('active');
        }
      });
      
      dropdown.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 1024) {
          dropdown.classList.remove('active');
        }
      });
    });
  }
}

// Initialize navigation controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.navigationController = new NavigationController();
});