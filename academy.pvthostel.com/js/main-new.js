// PVT Ecosystem Main JavaScript

// Initialize all components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize form handlers
  initializeForms();
  
  // Initialize testimonial carousel
  initializeTestimonials();
  
  // Initialize video modals
  initializeVideoModals();
  
  // Initialize tooltips
  initializeTooltips();
  
  // Initialize loading states
  initializeLoadingStates();
  
  // Initialize analytics
  initializeAnalytics();
  
});

// Form handling
function initializeForms() {
  const forms = document.querySelectorAll('form[data-ajax]');
  
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      
      // Show loading state
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Processing...';
      
      // Get form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      try {
        // Simulate API call
        const response = await PVTUtils.apiRequest(form.action, {
          method: form.method || 'POST',
          body: JSON.stringify(data)
        });
        
        if (response.success) {
          // Show success message
          showNotification('Success! We\'ll be in touch soon.', 'success');
          form.reset();
        } else {
          showNotification('Something went wrong. Please try again.', 'error');
        }
      } catch (error) {
        showNotification('Network error. Please check your connection.', 'error');
      }
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    });
  });
}

// Testimonial carousel
function initializeTestimonials() {
  const testimonialContainer = document.querySelector('.testimonials-grid');
  if (!testimonialContainer) return;
  
  // Add navigation buttons
  const prevButton = document.createElement('button');
  prevButton.className = 'testimonial-nav testimonial-prev';
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  
  const nextButton = document.createElement('button');
  nextButton.className = 'testimonial-nav testimonial-next';
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  
  testimonialContainer.parentElement.appendChild(prevButton);
  testimonialContainer.parentElement.appendChild(nextButton);
  
  // Carousel functionality
  let currentIndex = 0;
  const testimonials = testimonialContainer.querySelectorAll('.testimonial-card');
  const totalTestimonials = testimonials.length;
  
  function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
      testimonial.style.display = i === index ? 'block' : 'none';
    });
  }
  
  prevButton.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalTestimonials) % totalTestimonials;
    showTestimonial(currentIndex);
  });
  
  nextButton.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalTestimonials;
    showTestimonial(currentIndex);
  });
  
  // Auto-rotate testimonials
  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalTestimonials;
    showTestimonial(currentIndex);
  }, 5000);
  
  // Initialize
  showTestimonial(0);
}

// Video modal functionality
function initializeVideoModals() {
  const videoTriggers = document.querySelectorAll('[data-video]');
  
  videoTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const videoId = trigger.dataset.video;
      openVideoModal(videoId);
    });
  });
}

function openVideoModal(videoId) {
  const modal = document.createElement('div');
  modal.className = 'video-modal';
  modal.innerHTML = `
    <div class="video-modal-content">
      <button class="video-modal-close">&times;</button>
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.classList.add('no-scroll');
  
  // Close modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('video-modal-close')) {
      modal.remove();
      document.body.classList.remove('no-scroll');
    }
  });
}

// Initialize tooltips
function initializeTooltips() {
  const tooltips = document.querySelectorAll('[data-tooltip]');
  
  tooltips.forEach(element => {
    let tooltipElement;
    
    element.addEventListener('mouseenter', () => {
      const text = element.dataset.tooltip;
      tooltipElement = document.createElement('div');
      tooltipElement.className = 'tooltip';
      tooltipElement.textContent = text;
      
      document.body.appendChild(tooltipElement);
      
      const rect = element.getBoundingClientRect();
      tooltipElement.style.left = `${rect.left + rect.width / 2}px`;
      tooltipElement.style.top = `${rect.top - tooltipElement.offsetHeight - 10}px`;
    });
    
    element.addEventListener('mouseleave', () => {
      if (tooltipElement) {
        tooltipElement.remove();
      }
    });
  });
}

// Loading states
function initializeLoadingStates() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.classList.add('loaded');
    });
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Auto close after 5 seconds
  setTimeout(() => {
    closeNotification(notification);
  }, 5000);
  
  // Manual close
  notification.querySelector('.notification-close').addEventListener('click', () => {
    closeNotification(notification);
  });
}

function closeNotification(notification) {
  notification.classList.remove('show');
  setTimeout(() => {
    notification.remove();
  }, 300);
}

// Initialize analytics (placeholder)
function initializeAnalytics() {
  // Track page views
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: window.location.pathname
    });
  }
  
  // Track events
  document.addEventListener('click', (e) => {
    const element = e.target.closest('[data-track]');
    if (element) {
      const eventData = JSON.parse(element.dataset.track);
      trackEvent(eventData);
    }
  });
}

function trackEvent(data) {
  if (typeof gtag !== 'undefined') {
    gtag('event', data.action, {
      event_category: data.category,
      event_label: data.label,
      value: data.value
    });
  }
  console.log('Analytics event:', data);
}

// Handle dynamic content updates
window.addEventListener('contentUpdated', () => {
  // Reinitialize components for new content
  initializeForms();
  initializeTooltips();
  initializeLoadingStates();
  
  // Reinitialize animations
  if (window.reinitializeAnimations) {
    window.reinitializeAnimations();
  }
});