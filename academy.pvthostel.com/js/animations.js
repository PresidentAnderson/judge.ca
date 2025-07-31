// PVT Ecosystem Animation Controller

class AnimationController {
  constructor() {
    this.observers = new Map();
    this.animatedElements = new Set();
    this.init();
  }

  init() {
    // Initialize scroll animations
    this.initScrollAnimations();
    
    // Initialize parallax effects
    this.initParallax();
    
    // Initialize counter animations
    this.initCounters();
    
    // Initialize text animations
    this.initTextAnimations();
  }

  // Scroll-triggered animations
  initScrollAnimations() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const callback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          entry.target.classList.add('visible');
          this.animatedElements.add(entry.target);
          
          // Unobserve after animation to improve performance
          if (entry.target.dataset.animateOnce !== 'false') {
            observer.unobserve(entry.target);
          }
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    
    // Observe all elements with scroll animation classes
    const animatedElements = document.querySelectorAll('.scroll-fade-in, .scroll-scale-in');
    animatedElements.forEach(el => observer.observe(el));
    
    this.observers.set('scroll', observer);
  }

  // Parallax scrolling effects
  initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax');
    
    if (parallaxElements.length === 0) return;
    
    const handleParallax = PVTUtils.throttle(() => {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach(el => {
        const speed = el.dataset.speed || 0.5;
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
      });
    }, 10);
    
    window.addEventListener('scroll', handleParallax);
  }

  // Animated counters
  initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    if (counters.length === 0) return;
    
    const animateCounter = (element) => {
      const target = parseInt(element.dataset.counter);
      const duration = parseInt(element.dataset.duration) || 2000;
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;
      
      const updateCounter = () => {
        current += increment;
        
        if (current < target) {
          element.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target;
        }
      };
      
      updateCounter();
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          animateCounter(entry.target);
          this.animatedElements.add(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
    this.observers.set('counter', counterObserver);
  }

  // Text reveal animations
  initTextAnimations() {
    const textElements = document.querySelectorAll('[data-text-animation]');
    
    if (textElements.length === 0) return;
    
    textElements.forEach(element => {
      const animationType = element.dataset.textAnimation;
      
      switch (animationType) {
        case 'typewriter':
          this.typewriterEffect(element);
          break;
        case 'word-reveal':
          this.wordRevealEffect(element);
          break;
        case 'letter-reveal':
          this.letterRevealEffect(element);
          break;
      }
    });
  }

  // Typewriter effect
  typewriterEffect(element) {
    const text = element.textContent;
    element.textContent = '';
    element.style.visibility = 'visible';
    
    let index = 0;
    const speed = parseInt(element.dataset.speed) || 50;
    
    const type = () => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      }
    };
    
    // Start animation when element is in view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          type();
          this.animatedElements.add(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(element);
  }

  // Word reveal effect
  wordRevealEffect(element) {
    const text = element.textContent;
    const words = text.split(' ');
    element.textContent = '';
    element.style.visibility = 'visible';
    
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.textContent = word + ' ';
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      span.style.transform = 'translateY(20px)';
      span.style.transition = `all 0.5s ease ${index * 0.1}s`;
      element.appendChild(span);
    });
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          const spans = entry.target.querySelectorAll('span');
          spans.forEach(span => {
            span.style.opacity = '1';
            span.style.transform = 'translateY(0)';
          });
          this.animatedElements.add(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(element);
  }

  // Letter reveal effect
  letterRevealEffect(element) {
    const text = element.textContent;
    element.textContent = '';
    element.style.visibility = 'visible';
    
    [...text].forEach((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter === ' ' ? '\u00A0' : letter;
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      span.style.transform = 'translateY(20px)';
      span.style.transition = `all 0.3s ease ${index * 0.05}s`;
      element.appendChild(span);
    });
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          const spans = entry.target.querySelectorAll('span');
          spans.forEach(span => {
            span.style.opacity = '1';
            span.style.transform = 'translateY(0)';
          });
          this.animatedElements.add(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(element);
  }

  // Add stagger animation to elements
  staggerAnimation(selector, animationClass, delay = 100) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((element, index) => {
      element.style.animationDelay = `${index * delay}ms`;
      element.classList.add(animationClass);
    });
  }

  // Clean up observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.animatedElements.clear();
  }
}

// Initialize animation controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.animationController = new AnimationController();
});

// Reinitialize animations on dynamic content load
window.reinitializeAnimations = () => {
  if (window.animationController) {
    window.animationController.destroy();
    window.animationController = new AnimationController();
  }
};