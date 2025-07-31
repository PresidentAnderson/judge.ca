// PVT Hostel Academy - Main JavaScript

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
    
    // Active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function setActiveNav() {
        const scrollY = window.scrollY;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', setActiveNav);
    
    // Course card hover effects
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Initialize enrollment modal functionality
    initializeEnrollmentModal();
    
    // Initialize language selector
    initializeLanguageSelector();
    
    // Initialize course filtering
    initializeCourseFiltering();
});

// Enrollment Modal
function initializeEnrollmentModal() {
    // This will be expanded when we create the enrollment form
    const enrollButtons = document.querySelectorAll('.btn-primary[href="#enroll"]');
    enrollButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // Show enrollment modal (to be implemented)
            console.log('Enrollment modal triggered');
        });
    });
}

// Language Selector
function initializeLanguageSelector() {
    // Placeholder for multilingual support
    const languages = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar'];
    // To be implemented with proper language switching
}

// Course Filtering
function initializeCourseFiltering() {
    // This will be used on the full courses page
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterCourses(category);
        });
    });
}

function filterCourses(category) {
    const courses = document.querySelectorAll('.course-card');
    courses.forEach(course => {
        if (category === 'all' || course.getAttribute('data-category') === category) {
            course.style.display = 'block';
        } else {
            course.style.display = 'none';
        }
    });
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Form Validation Helper
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

// API Integration Placeholder
const API = {
    baseURL: '/api',
    
    async enrollStudent(data) {
        // Placeholder for enrollment API
        return await fetch(`${this.baseURL}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    },
    
    async getCourses() {
        // Placeholder for fetching courses
        return await fetch(`${this.baseURL}/courses`);
    },
    
    async submitAutomationRequest(data) {
        // Placeholder for automation auction
        return await fetch(`${this.baseURL}/automation-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }
};

// Export for use in other modules
window.PVTAcademy = {
    API,
    showNotification,
    validateForm
};