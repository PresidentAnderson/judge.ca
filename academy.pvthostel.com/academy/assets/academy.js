// PVT Academy JavaScript

document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize course track interactions
  initializeTrackCards();
  
  // Initialize video demos
  initializeVideoDemos();
  
  // Initialize enrollment forms
  initializeEnrollmentForms();
  
  // Initialize module expansion
  initializeModuleExpansion();
  
  // Initialize progress tracking
  initializeProgressTracking();
  
});

// Track card interactions
function initializeTrackCards() {
  const trackCards = document.querySelectorAll('.track-card');
  
  trackCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const trackType = card.dataset.track;
      // Add specific hover effects based on track type
      card.style.borderColor = getTrackColor(trackType);
    });
    
    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('featured')) {
        card.style.borderColor = 'transparent';
      }
    });
  });
}

function getTrackColor(trackType) {
  const colors = {
    'foundations': '#2563EB',     // Freedom blue
    'mental-health': '#DC2626',   // Rebel red
    'operations': '#7C3AED',      // Unity purple
    'marketing': '#F59E0B',       // Wisdom gold
    'technology': '#0891B2',      // Hope teal
    'leadership': '#16A34A'       // Success green
  };
  return colors[trackType] || '#2563EB';
}

// Video demo functionality
function initializeVideoDemos() {
  const demoButtons = document.querySelectorAll('[data-video]');
  
  demoButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const videoType = button.dataset.video;
      openDemoVideo(videoType);
    });
  });
}

function openDemoVideo(videoType) {
  // Placeholder video IDs - replace with actual video IDs
  const videos = {
    'academy-demo': 'dQw4w9WgXcQ',
    'foundations-preview': 'dQw4w9WgXcQ',
    'mental-health-preview': 'dQw4w9WgXcQ'
  };
  
  const videoId = videos[videoType] || videos['academy-demo'];
  
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
  
  // Close modal functionality
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('video-modal-close')) {
      modal.remove();
      document.body.classList.remove('no-scroll');
    }
  });
}

// Enrollment form handling
function initializeEnrollmentForms() {
  const enrollButtons = document.querySelectorAll('.btn[href="#enroll"]');
  
  enrollButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      openEnrollmentModal();
    });
  });
}

function openEnrollmentModal() {
  const modal = document.createElement('div');
  modal.className = 'enrollment-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Enroll in PVT Academy</h2>
        <button class="modal-close">&times;</button>
      </div>
      
      <form class="enrollment-form" data-ajax>
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" class="form-input" name="name" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Email Address *</label>
          <input type="email" class="form-input" name="email" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input type="tel" class="form-input" name="phone">
        </div>
        
        <div class="form-group">
          <label class="form-label">Organization</label>
          <input type="text" class="form-input" name="organization">
        </div>
        
        <div class="form-group">
          <label class="form-label">Select Course Track *</label>
          <select class="form-select" name="track" required>
            <option value="">Choose a track...</option>
            <option value="foundations">Hospitality Foundations - $299</option>
            <option value="mental-health">Mental Health First Response - $499</option>
            <option value="operations">Advanced Operations - $699</option>
            <option value="marketing">Direct Booking Mastery - $399</option>
            <option value="technology">Technology Integration - $349</option>
            <option value="leadership">Leadership & Culture - $599</option>
            <option value="bundle">Complete Bundle - $1,499 (Save $896)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Preferred Language</label>
          <select class="form-select" name="language">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-checkbox">
            <input type="checkbox" name="newsletter" checked>
            <span>Send me updates about new courses and features</span>
          </label>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-lg btn-block">
            Continue to Payment
            <i class="fas fa-arrow-right"></i>
          </button>
          <p class="form-note">
            <i class="fas fa-lock"></i>
            Secure payment processing. 30-day money-back guarantee.
          </p>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.classList.add('no-scroll');
  
  // Close modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-close')) {
      modal.remove();
      document.body.classList.remove('no-scroll');
    }
  });
  
  // Handle form submission
  const form = modal.querySelector('.enrollment-form');
  form.addEventListener('submit', handleEnrollmentSubmit);
}

async function handleEnrollmentSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  
  // Show loading state
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Processing...';
  
  // Get form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Simulate API call
  setTimeout(() => {
    // Show success message
    showNotification('Enrollment successful! Redirecting to payment...', 'success');
    
    // Simulate redirect to payment
    setTimeout(() => {
      console.log('Redirecting to payment with data:', data);
      // In production: window.location.href = `/payment?track=${data.track}`;
    }, 2000);
    
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }, 2000);
}

// Module expansion for course pages
function initializeModuleExpansion() {
  const moduleCards = document.querySelectorAll('.module-card');
  
  moduleCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
      
      // Animate chevron icon
      const chevron = card.querySelector('.fa-chevron-down');
      if (chevron) {
        chevron.style.transform = card.classList.contains('expanded') 
          ? 'rotate(180deg)' 
          : 'rotate(0)';
      }
    });
  });
}

// Progress tracking
function initializeProgressTracking() {
  // Simulate progress for demo
  const progressBars = document.querySelectorAll('.progress-bar');
  
  progressBars.forEach(bar => {
    const progress = bar.dataset.progress || 0;
    setTimeout(() => {
      bar.style.width = `${progress}%`;
    }, 500);
  });
  
  // Mark lessons as complete
  const lessonItems = document.querySelectorAll('.lesson-item');
  
  lessonItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.lesson-checkbox')) {
        item.classList.toggle('completed');
        updateProgress();
      }
    });
  });
}

function updateProgress() {
  // Calculate and update progress
  const totalLessons = document.querySelectorAll('.lesson-item').length;
  const completedLessons = document.querySelectorAll('.lesson-item.completed').length;
  const progress = (completedLessons / totalLessons) * 100;
  
  // Update progress bar
  const progressBar = document.querySelector('.course-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  
  // Update progress text
  const progressText = document.querySelector('.progress-text');
  if (progressText) {
    progressText.textContent = `${Math.round(progress)}% Complete`;
  }
}

// Show notification helper
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
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
    background: type === 'success' ? '#16A34A' : '#2563EB',
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

// Add modal styles
const style = document.createElement('style');
style.textContent = `
  .video-modal,
  .enrollment-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }
  
  .video-modal-content {
    position: relative;
    width: 100%;
    max-width: 900px;
    background: black;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .video-modal-close,
  .modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 10;
  }
  
  .video-modal-close:hover,
  .modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
  
  .modal-content {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header {
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
    position: relative;
  }
  
  .modal-header h2 {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  
  .modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: #f3f4f6;
    color: #6b7280;
  }
  
  .enrollment-form {
    padding: 24px;
  }
  
  .form-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
  }
  
  .form-checkbox input {
    margin-top: 4px;
  }
  
  .form-actions {
    margin-top: 24px;
  }
  
  .form-note {
    text-align: center;
    color: #6b7280;
    font-size: 14px;
    margin-top: 12px;
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