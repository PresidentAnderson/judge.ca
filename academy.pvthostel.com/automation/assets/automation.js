// PVT Automation Portal JavaScript

document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize particle animation
  initParticles();
  
  // Initialize multi-step form
  initProjectForm();
  
  // Initialize budget slider
  initBudgetSlider();
  
  // Initialize project filters
  initProjectFilters();
  
  // Initialize smooth scrolling
  initSmoothScroll();
  
});

// Particle Animation
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  
  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Particle class
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 2 - 1;
      this.speedY = Math.random() * 2 - 1;
      this.opacity = Math.random() * 0.5 + 0.2;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }
    
    draw() {
      ctx.fillStyle = `rgba(139, 92, 246, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Create particles
  for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
  }
  
  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    // Draw connections
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const distance = Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        
        if (distance < 100) {
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 * (1 - distance / 100)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// Multi-step Form
function initProjectForm() {
  const form = document.getElementById('projectSubmissionForm');
  if (!form) return;
  
  const steps = form.querySelectorAll('.form-step');
  const progressFill = form.querySelector('.progress-fill');
  const progressSteps = form.querySelectorAll('.progress-step');
  let currentStep = 1;
  
  // Next button handlers
  form.querySelectorAll('.btn-next').forEach(button => {
    button.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        goToStep(currentStep + 1);
      }
    });
  });
  
  // Previous button handlers
  form.querySelectorAll('.btn-prev').forEach(button => {
    button.addEventListener('click', () => {
      goToStep(currentStep - 1);
    });
  });
  
  // Go to specific step
  function goToStep(step) {
    if (step < 1 || step > steps.length) return;
    
    // Update form steps
    steps.forEach((s, index) => {
      s.classList.toggle('active', index === step - 1);
    });
    
    // Update progress
    currentStep = step;
    const progressPercent = (step / steps.length) * 100;
    progressFill.style.width = `${progressPercent}%`;
    
    // Update progress steps
    progressSteps.forEach((s, index) => {
      s.classList.toggle('active', index < step);
    });
    
    // Update summary if on last step
    if (step === 4) {
      updateProjectSummary();
    }
    
    // Scroll to top of form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // Validate current step
  function validateStep(step) {
    const currentStepElement = steps[step - 1];
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('input-error');
        isValid = false;
      } else {
        field.classList.remove('input-error');
      }
    });
    
    if (!isValid) {
      showNotification('Please fill in all required fields', 'error');
    }
    
    return isValid;
  }
  
  // Update project summary
  function updateProjectSummary() {
    const formData = new FormData(form);
    
    document.getElementById('summaryTitle').textContent = 
      formData.get('projectTitle') || 'Not provided';
    
    document.getElementById('summaryCategory').textContent = 
      formData.get('category') || 'Not selected';
    
    document.getElementById('summaryBudget').textContent = 
      `$${formData.get('budget')}`;
    
    document.getElementById('summaryTimeline').textContent = 
      formData.get('timeline') || 'Not specified';
    
    // Simulate AI brief generation
    generateAIBrief(formData);
  }
  
  // Generate AI brief
  function generateAIBrief(formData) {
    const aiBriefElement = document.getElementById('aiBrief');
    
    // Show loading
    aiBriefElement.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner animate-spin"></i>
        <span>Generating project brief...</span>
      </div>
    `;
    
    // Simulate AI processing
    setTimeout(() => {
      const problem = formData.get('problemDescription');
      const solution = formData.get('solutionDescription');
      const category = formData.get('category');
      
      aiBriefElement.innerHTML = `
        <div class="ai-generated-brief">
          <h5>AI-Enhanced Project Brief</h5>
          <p><strong>Technical Requirements:</strong></p>
          <ul>
            <li>${getCategoryRequirements(category)}</li>
            <li>Budget-conscious implementation within $${formData.get('budget')}</li>
            <li>Delivery timeline: ${formData.get('timeline')}</li>
          </ul>
          <p><strong>Success Criteria:</strong></p>
          <ul>
            <li>Solves: "${problem}"</li>
            <li>Delivers: "${solution}"</li>
          </ul>
        </div>
      `;
    }, 2000);
  }
  
  // Get category requirements
  function getCategoryRequirements(category) {
    const requirements = {
      'booking-system': 'Direct booking engine with payment processing and calendar integration',
      'chatbot': 'Automated chat system with natural language processing and multi-platform support',
      'website': 'Responsive website with modern design and SEO optimization',
      'mobile-app': 'Native or hybrid mobile application for iOS and Android',
      'automation': 'Custom automation workflow with API integrations',
      'other': 'Custom solution based on specific requirements'
    };
    
    return requirements[category] || requirements['other'];
  }
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Show loading
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Submitting...';
    
    // Simulate submission
    setTimeout(() => {
      showNotification('Project submitted successfully! Developers will start bidding soon.', 'success');
      
      // Reset form or redirect
      setTimeout(() => {
        // window.location.href = '/dashboard';
        console.log('Redirect to dashboard');
      }, 2000);
      
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }, 2000);
  });
}

// Budget Slider
function initBudgetSlider() {
  const slider = document.querySelector('.slider');
  const budgetAmount = document.querySelector('.budget-amount');
  const budgetPresets = document.querySelectorAll('.budget-preset');
  
  if (!slider) return;
  
  // Update display on slider change
  slider.addEventListener('input', (e) => {
    const value = e.target.value;
    budgetAmount.textContent = `$${parseInt(value).toLocaleString()}`;
    
    // Update preset buttons
    budgetPresets.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.amount === value);
    });
  });
  
  // Preset button clicks
  budgetPresets.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const amount = button.dataset.amount;
      slider.value = amount;
      slider.dispatchEvent(new Event('input'));
    });
  });
}

// Project Filters
function initProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Filter projects
      projectCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'block';
          card.classList.add('animate-fade-in');
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Smooth Scrolling
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Show notification
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

// Add form styles
const style = document.createElement('style');
style.textContent = `
  .input-error {
    border-color: #DC2626 !important;
  }
  
  .ai-generated-brief {
    text-align: left;
  }
  
  .ai-generated-brief h5 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 12px;
  }
  
  .ai-generated-brief p {
    font-weight: 500;
    color: #475569;
    margin: 12px 0 8px;
  }
  
  .ai-generated-brief ul {
    list-style: none;
    padding: 0;
  }
  
  .ai-generated-brief li {
    padding: 8px 0;
    padding-left: 24px;
    position: relative;
    color: #64748b;
  }
  
  .ai-generated-brief li::before {
    content: "•";
    position: absolute;
    left: 8px;
    color: #7c3aed;
    font-weight: bold;
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