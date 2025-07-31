// Hostels United JavaScript

document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize counters
  initCounters();
  
  // Initialize member filters
  initMemberFilters();
  
  // Initialize join form
  initJoinForm();
  
  // Initialize dependency slider
  initDependencySlider();
  
  // Initialize countdown timer
  initCountdown();
  
  // Initialize manifesto animations
  initManifestoAnimations();
  
});

// Animated Counters
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  
  if (counters.length === 0) return;
  
  const animateCounter = (element) => {
    const target = parseInt(element.dataset.counter);
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const updateCounter = () => {
      current += increment;
      
      if (current < target) {
        // Format large numbers with commas
        if (target > 1000) {
          element.textContent = Math.floor(current).toLocaleString();
        } else {
          element.textContent = Math.floor(current);
        }
        requestAnimationFrame(updateCounter);
      } else {
        // Final value
        if (target > 1000) {
          element.textContent = target.toLocaleString();
        } else {
          element.textContent = target;
        }
        
        // Add % or $ prefix/suffix if needed
        if (element.parentElement.textContent.includes('%')) {
          element.textContent += '%';
        } else if (element.parentElement.textContent.includes('$')) {
          element.textContent = '$' + element.textContent;
        }
      }
    };
    
    updateCounter();
  };
  
  // Intersection Observer for triggering animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        animateCounter(entry.target);
        entry.target.classList.add('counted');
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
}

// Member Filters
function initMemberFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const memberCards = document.querySelectorAll('.member-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Filter members
      memberCards.forEach(card => {
        if (filter === 'all' || card.dataset.region === filter) {
          card.style.display = 'block';
          card.classList.add('animate-fade-in');
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Join Form
function initJoinForm() {
  const form = document.getElementById('joinForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Validate form
    if (!validateForm(form)) return;
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Joining the Revolution...';
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Simulate API call
    setTimeout(() => {
      // Show success message
      showNotification('Welcome to the resistance! Check your email for next steps.', 'success');
      
      // Show confetti animation
      launchConfetti();
      
      // Reset form
      form.reset();
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
      
      // Update dependency slider
      const slider = form.querySelector('.slider');
      if (slider) {
        slider.value = 50;
        updateDependencyDisplay(50);
      }
    }, 2000);
  });
}

// Validate Form
function validateForm(form) {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (field.type === 'checkbox') {
      if (!field.checked) {
        field.parentElement.classList.add('error');
        isValid = false;
      } else {
        field.parentElement.classList.remove('error');
      }
    } else {
      if (!field.value.trim()) {
        field.classList.add('input-error');
        isValid = false;
      } else {
        field.classList.remove('input-error');
      }
    }
  });
  
  if (!isValid) {
    showNotification('Please complete all required fields and commitments', 'error');
  }
  
  return isValid;
}

// Dependency Slider
function initDependencySlider() {
  const slider = document.querySelector('.dependency-slider .slider');
  const valueDisplay = document.querySelector('.dependency-value');
  
  if (!slider) return;
  
  slider.addEventListener('input', (e) => {
    updateDependencyDisplay(e.target.value);
  });
}

function updateDependencyDisplay(value) {
  const valueDisplay = document.querySelector('.dependency-value');
  if (valueDisplay) {
    valueDisplay.textContent = `${value}%`;
    
    // Change color based on dependency level
    if (value < 30) {
      valueDisplay.style.color = '#16A34A'; // Green
    } else if (value < 60) {
      valueDisplay.style.color = '#F59E0B'; // Yellow
    } else {
      valueDisplay.style.color = '#DC2626'; // Red
    }
  }
}

// Countdown Timer
function initCountdown() {
  const countdownElement = document.getElementById('countdown');
  if (!countdownElement) return;
  
  // Random time between 30-90 minutes
  let totalSeconds = Math.floor(Math.random() * 3600) + 1800;
  
  const updateCountdown = () => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (totalSeconds > 0) {
      totalSeconds--;
      setTimeout(updateCountdown, 1000);
    } else {
      // Reset countdown
      totalSeconds = Math.floor(Math.random() * 3600) + 1800;
      updateCountdown();
      
      // Show notification
      showNotification('Another property just joined the resistance!', 'success');
    }
  };
  
  updateCountdown();
}

// Manifesto Animations
function initManifestoAnimations() {
  const principles = document.querySelectorAll('.principles-list li');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('animate-slide-up');
          entry.target.style.opacity = '1';
        }, index * 100);
      }
    });
  }, { threshold: 0.1 });
  
  principles.forEach(principle => {
    principle.style.opacity = '0';
    observer.observe(principle);
  });
}

// Confetti Animation
function launchConfetti() {
  const colors = ['#DC2626', '#F59E0B', '#16A34A', '#2563EB', '#7C3AED'];
  const confettiCount = 100;
  
  for (let i = 0; i < confettiCount; i++) {
    createConfettiPiece(colors);
  }
}

function createConfettiPiece(colors) {
  const confetti = document.createElement('div');
  confetti.className = 'confetti';
  
  // Random properties
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 10 + 5;
  const left = Math.random() * 100;
  const animationDuration = Math.random() * 3 + 2;
  const animationDelay = Math.random() * 2;
  
  Object.assign(confetti.style, {
    position: 'fixed',
    left: `${left}%`,
    top: '-10px',
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: color,
    transform: `rotate(${Math.random() * 360}deg)`,
    zIndex: '9999',
    pointerEvents: 'none'
  });
  
  document.body.appendChild(confetti);
  
  // Animate
  confetti.animate([
    { 
      transform: `translateY(0) rotate(0deg)`,
      opacity: 1
    },
    { 
      transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`,
      opacity: 0
    }
  ], {
    duration: animationDuration * 1000,
    delay: animationDelay * 1000,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }).onfinish = () => confetti.remove();
}

// Show Notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: type === 'success' ? '#16A34A' : type === 'error' ? '#DC2626' : '#2563EB',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: '9999',
    transform: 'translateX(400px)',
    transition: 'transform 0.3s ease'
  });
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto close
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
  
  // Manual close
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  });
}

// Add styles
const style = document.createElement('style');
style.textContent = `
  .input-error {
    border-color: #DC2626 !important;
  }
  
  .error {
    color: #DC2626;
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s;
  }
  
  .notification-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;
document.head.appendChild(style);