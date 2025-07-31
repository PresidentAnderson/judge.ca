// PVT Ecosystem Mock API
// This simulates a real backend API for development and demonstration

class MockAPI {
  constructor() {
    this.data = {
      users: [
        {
          id: 1,
          email: 'demo@pvtecosystem.com',
          name: 'Demo User',
          password: 'demo123',
          platforms: ['academy', 'automation', 'united'],
          avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=dc2626&color=fff',
          joinDate: '2024-01-15',
          subscription: 'premium'
        }
      ],
      courses: [
        {
          id: 1,
          title: 'Mental Health First Response',
          category: 'mental-health',
          price: 499,
          duration: '60 hours',
          lessons: 35,
          rating: 4.9,
          students: 487,
          instructor: 'Dr. Sarah Chen',
          progress: 85,
          enrolled: true
        },
        {
          id: 2,
          title: 'Hospitality Foundations',
          category: 'foundations',
          price: 299,
          duration: '40 hours',
          lessons: 25,
          rating: 4.8,
          students: 312,
          instructor: 'President Jonathan Anderson',
          progress: 45,
          enrolled: true
        }
      ],
      projects: [
        {
          id: 1,
          title: 'WhatsApp Booking Bot',
          category: 'chatbot',
          budget: 800,
          status: 'in_progress',
          progress: 90,
          deadline: '2024-08-01',
          developer: 'Alex Chen',
          proposals: 5,
          description: 'Automated WhatsApp bot for handling booking inquiries'
        },
        {
          id: 2,
          title: 'Review Automation System',
          category: 'automation',
          budget: 650,
          status: 'in_progress',
          progress: 60,
          deadline: '2024-08-15',
          developer: 'Maria Santos',
          proposals: 3,
          description: 'Automated system for requesting and managing guest reviews'
        }
      ],
      properties: [
        {
          id: 1,
          name: 'Barcelona Freedom Hostel',
          location: 'Barcelona, Spain',
          type: 'hostel',
          directBookings: 85,
          otaFreedom: 'high',
          monthlySavings: 1200,
          totalSavings: 14400,
          freedomScore: 92
        }
      ],
      analytics: {
        academy: {
          coursesCompleted: 1,
          coursesInProgress: 2,
          totalHours: 156,
          certificates: 1,
          averageScore: 92
        },
        automation: {
          activeProjects: 3,
          completedProjects: 5,
          totalSaved: 2400,
          averageProjectCost: 750,
          averageDeliveryTime: 14
        },
        united: {
          directBookingPercentage: 78,
          monthlySavings: 1200,
          totalSavings: 14400,
          freedomScore: 92,
          otaIndependence: 'high'
        }
      }
    };
    
    this.initRoutes();
  }
  
  initRoutes() {
    // Simulate API endpoints
    window.mockAPI = {
      // Authentication
      login: (email, password) => this.login(email, password),
      register: (userData) => this.register(userData),
      logout: () => this.logout(),
      
      // User data
      getUser: (id) => this.getUser(id),
      updateUser: (id, data) => this.updateUser(id, data),
      
      // Academy
      getCourses: () => this.getCourses(),
      getCourse: (id) => this.getCourse(id),
      enrollCourse: (courseId, userId) => this.enrollCourse(courseId, userId),
      updateProgress: (courseId, userId, progress) => this.updateProgress(courseId, userId, progress),
      
      // Automation
      getProjects: () => this.getProjects(),
      getProject: (id) => this.getProject(id),
      submitProject: (projectData) => this.submitProject(projectData),
      updateProject: (id, data) => this.updateProject(id, data),
      
      // United
      getProperties: () => this.getProperties(),
      getProperty: (id) => this.getProperty(id),
      joinUnited: (propertyData) => this.joinUnited(propertyData),
      updateIndependence: (propertyId, data) => this.updateIndependence(propertyId, data),
      
      // Analytics
      getAnalytics: (platform) => this.getAnalytics(platform),
      getDashboardData: (userId) => this.getDashboardData(userId)
    };
  }
  
  // Helper methods
  delay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }
  
  // Authentication
  async login(email, password) {
    await this.delay(1500);
    
    const user = this.data.users.find(u => u.email === email && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword,
        token: 'mock_jwt_token_' + this.generateId()
      };
    }
    
    return {
      success: false,
      error: 'Invalid credentials'
    };
  }
  
  async register(userData) {
    await this.delay(1500);
    
    const existingUser = this.data.users.find(u => u.email === userData.email);
    if (existingUser) {
      return {
        success: false,
        error: 'Email already registered'
      };
    }
    
    const newUser = {
      id: this.generateId(),
      ...userData,
      platforms: userData.platforms || [],
      joinDate: new Date().toISOString(),
      subscription: 'free'
    };
    
    this.data.users.push(newUser);
    
    const { password, ...userWithoutPassword } = newUser;
    return {
      success: true,
      user: userWithoutPassword,
      token: 'mock_jwt_token_' + this.generateId()
    };
  }
  
  async logout() {
    await this.delay(500);
    return { success: true };
  }
  
  // User data
  async getUser(id) {
    await this.delay(800);
    const user = this.data.users.find(u => u.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, error: 'User not found' };
  }
  
  async updateUser(id, data) {
    await this.delay(1000);
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      this.data.users[userIndex] = { ...this.data.users[userIndex], ...data };
      const { password, ...userWithoutPassword } = this.data.users[userIndex];
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, error: 'User not found' };
  }
  
  // Academy
  async getCourses() {
    await this.delay(800);
    return { success: true, courses: this.data.courses };
  }
  
  async getCourse(id) {
    await this.delay(600);
    const course = this.data.courses.find(c => c.id === parseInt(id));
    if (course) {
      return { success: true, course };
    }
    return { success: false, error: 'Course not found' };
  }
  
  async enrollCourse(courseId, userId) {
    await this.delay(1200);
    const course = this.data.courses.find(c => c.id === courseId);
    if (course) {
      course.enrolled = true;
      course.progress = 0;
      return { success: true, message: 'Successfully enrolled' };
    }
    return { success: false, error: 'Course not found' };
  }
  
  async updateProgress(courseId, userId, progress) {
    await this.delay(500);
    const course = this.data.courses.find(c => c.id === courseId);
    if (course) {
      course.progress = progress;
      return { success: true, progress };
    }
    return { success: false, error: 'Course not found' };
  }
  
  // Automation
  async getProjects() {
    await this.delay(900);
    return { success: true, projects: this.data.projects };
  }
  
  async getProject(id) {
    await this.delay(600);
    const project = this.data.projects.find(p => p.id === parseInt(id));
    if (project) {
      return { success: true, project };
    }
    return { success: false, error: 'Project not found' };
  }
  
  async submitProject(projectData) {
    await this.delay(2000);
    const newProject = {
      id: this.generateId(),
      ...projectData,
      status: 'submitted',
      progress: 0,
      proposals: 0,
      submittedDate: new Date().toISOString()
    };
    
    this.data.projects.push(newProject);
    return { success: true, project: newProject };
  }
  
  async updateProject(id, data) {
    await this.delay(800);
    const projectIndex = this.data.projects.findIndex(p => p.id === id);
    if (projectIndex !== -1) {
      this.data.projects[projectIndex] = { ...this.data.projects[projectIndex], ...data };
      return { success: true, project: this.data.projects[projectIndex] };
    }
    return { success: false, error: 'Project not found' };
  }
  
  // United
  async getProperties() {
    await this.delay(700);
    return { success: true, properties: this.data.properties };
  }
  
  async getProperty(id) {
    await this.delay(500);
    const property = this.data.properties.find(p => p.id === parseInt(id));
    if (property) {
      return { success: true, property };
    }
    return { success: false, error: 'Property not found' };
  }
  
  async joinUnited(propertyData) {
    await this.delay(2500);
    const newProperty = {
      id: this.generateId(),
      ...propertyData,
      directBookings: 15,
      otaFreedom: 'low',
      monthlySavings: 0,
      totalSavings: 0,
      freedomScore: 25,
      joinDate: new Date().toISOString()
    };
    
    this.data.properties.push(newProperty);
    return { success: true, property: newProperty };
  }
  
  async updateIndependence(propertyId, data) {
    await this.delay(600);
    const propertyIndex = this.data.properties.findIndex(p => p.id === propertyId);
    if (propertyIndex !== -1) {
      this.data.properties[propertyIndex] = { ...this.data.properties[propertyIndex], ...data };
      return { success: true, property: this.data.properties[propertyIndex] };
    }
    return { success: false, error: 'Property not found' };
  }
  
  // Analytics
  async getAnalytics(platform) {
    await this.delay(600);
    if (this.data.analytics[platform]) {
      return { success: true, analytics: this.data.analytics[platform] };
    }
    return { success: false, error: 'Platform not found' };
  }
  
  async getDashboardData(userId) {
    await this.delay(1000);
    return {
      success: true,
      data: {
        user: this.data.users.find(u => u.id === userId),
        courses: this.data.courses.filter(c => c.enrolled),
        projects: this.data.projects,
        properties: this.data.properties,
        analytics: this.data.analytics
      }
    };
  }
  
  // Booking Engine
  async checkAvailability(propertyId, checkin, checkout, guests) {
    await this.delay(800);
    
    // Simulate availability check
    const available = Math.random() > 0.2; // 80% chance of availability
    const pricePerNight = 39 + Math.floor(Math.random() * 30);
    const nights = Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24));
    const total = pricePerNight * nights * guests.rooms;
    
    return {
      success: true,
      available,
      pricing: {
        pricePerNight,
        nights,
        subtotal: total,
        taxes: Math.round(total * 0.12),
        total: Math.round(total * 1.12),
        savings: Math.round(total * 0.18) // vs OTA commission
      }
    };
  }
  
  async createBooking(bookingData) {
    await this.delay(2000);
    
    const booking = {
      id: this.generateId(),
      ...bookingData,
      status: 'confirmed',
      confirmationNumber: 'PVT' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      bookingDate: new Date().toISOString()
    };
    
    return {
      success: true,
      booking,
      message: 'Booking confirmed! Check your email for details.'
    };
  }
  
  // Real-time updates simulation
  startRealtimeUpdates() {
    setInterval(() => {
      // Simulate project progress updates
      this.data.projects.forEach(project => {
        if (project.status === 'in_progress' && project.progress < 100) {
          project.progress = Math.min(100, project.progress + Math.random() * 2);
        }
      });
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('pvt_realtime_update', {
        detail: { type: 'project_progress', data: this.data.projects }
      }));
    }, 30000); // Update every 30 seconds
  }
}

// Initialize mock API
const mockAPI = new MockAPI();

// Add booking engine to global scope
window.mockAPI.checkAvailability = (propertyId, checkin, checkout, guests) => 
  mockAPI.checkAvailability(propertyId, checkin, checkout, guests);

window.mockAPI.createBooking = (bookingData) => 
  mockAPI.createBooking(bookingData);

// Start real-time updates
mockAPI.startRealtimeUpdates();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MockAPI;
}