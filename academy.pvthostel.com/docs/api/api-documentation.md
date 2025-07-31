# PVT Ecosystem API Documentation

## API Overview

Base URL: `https://api.pvtecosystem.com/v1`

All API requests must include:
- `Content-Type: application/json`
- `X-API-Key: {your-api-key}` (for public endpoints)
- `Authorization: Bearer {jwt-token}` (for authenticated endpoints)

## Authentication

### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "usr_123456",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["student", "host"]
    }
  }
}
```

### POST /auth/refresh
Refresh expired JWT token.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### POST /auth/register
Register new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "secure_password",
  "name": "Jane Doe",
  "userType": "student",
  "hostelName": "Optional - for hosts only"
}
```

## Academy API Endpoints

### Courses

#### GET /academy/courses
List all available courses with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `category` (optional): Filter by category
- `language` (optional): Filter by language

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "crs_001",
        "title": "Mental Health & Emotional Intelligence",
        "description": "Create inclusive environments for all guests",
        "category": "mental-health",
        "duration": "4 weeks",
        "price": 99.00,
        "currency": "USD",
        "languages": ["en", "es", "fr"],
        "instructor": {
          "id": "ins_001",
          "name": "Dr. Sarah Johnson",
          "avatar": "https://..."
        },
        "rating": 4.8,
        "enrollmentCount": 1250
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### GET /academy/courses/{courseId}
Get detailed course information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "crs_001",
    "title": "Mental Health & Emotional Intelligence",
    "description": "Comprehensive training on creating inclusive environments",
    "syllabus": [
      {
        "week": 1,
        "title": "Understanding Mental Health in Hospitality",
        "lessons": [
          {
            "id": "lsn_001",
            "title": "Introduction to Mental Health Awareness",
            "duration": 45,
            "type": "video"
          }
        ]
      }
    ],
    "requirements": [
      "Basic hospitality experience",
      "Internet connection for live sessions"
    ],
    "outcomes": [
      "Identify signs of psychological crisis",
      "Apply de-escalation techniques"
    ]
  }
}
```

#### POST /academy/courses/{courseId}/enroll
Enroll in a course.

**Request:**
```json
{
  "paymentMethodId": "pm_123456",
  "language": "en"
}
```

### Progress Tracking

#### GET /academy/my-courses
Get user's enrolled courses and progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollments": [
      {
        "courseId": "crs_001",
        "courseTitle": "Mental Health & Emotional Intelligence",
        "enrolledAt": "2024-07-01T10:00:00Z",
        "progress": {
          "percentage": 65,
          "completedLessons": 13,
          "totalLessons": 20,
          "lastAccessedAt": "2024-07-15T14:30:00Z"
        },
        "certificate": {
          "available": false,
          "requiredProgress": 80
        }
      }
    ]
  }
}
```

#### POST /academy/lessons/{lessonId}/complete
Mark lesson as completed.

**Request:**
```json
{
  "timeSpent": 2400,
  "quizScore": 85
}
```

## Automation Auction API

### Projects

#### POST /automation/projects
Submit new automation project.

**Request:**
```json
{
  "title": "WhatsApp Check-in Bot",
  "description": "I need a WhatsApp bot that can guide guests through check-in process",
  "budget": {
    "min": 500,
    "max": 1500,
    "currency": "USD"
  },
  "deadline": "2024-08-15",
  "requirements": [
    "Integration with our PMS",
    "Multi-language support",
    "Photo ID verification"
  ],
  "category": "chatbot"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "prj_789012",
    "status": "pending_review",
    "aiInterpretation": {
      "suggestedScope": "WhatsApp Business API integration with check-in workflow",
      "estimatedComplexity": "medium",
      "suggestedTechnologies": ["Node.js", "WhatsApp Business API", "PostgreSQL"],
      "similarProjects": [
        {
          "id": "prj_456789",
          "title": "Telegram Guest Assistant",
          "finalCost": 850
        }
      ]
    }
  }
}
```

#### GET /automation/projects/{projectId}/bids
Get all bids for a project.

**Response:**
```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "id": "bid_001",
        "developerId": "dev_123",
        "developerProfile": {
          "name": "TechSolutions Inc",
          "rating": 4.7,
          "completedProjects": 45,
          "expertise": ["chatbots", "automation"]
        },
        "amount": 750,
        "currency": "USD",
        "proposedTimeline": "2 weeks",
        "proposal": "We'll build a robust WhatsApp bot using...",
        "milestones": [
          {
            "title": "Bot Setup & Basic Flow",
            "amount": 300,
            "duration": "5 days"
          },
          {
            "title": "PMS Integration",
            "amount": 300,
            "duration": "5 days"
          },
          {
            "title": "Testing & Deployment",
            "amount": 150,
            "duration": "4 days"
          }
        ]
      }
    ]
  }
}
```

#### POST /automation/projects/{projectId}/accept-bid
Accept a bid and initiate project.

**Request:**
```json
{
  "bidId": "bid_001",
  "escrowApproved": true
}
```

## Hostels United API

### Properties

#### POST /united/properties
Register property with Hostels United.

**Request:**
```json
{
  "propertyName": "Sunshine Hostel Barcelona",
  "address": {
    "street": "Carrer de Valencia 123",
    "city": "Barcelona",
    "country": "Spain",
    "postalCode": "08015"
  },
  "propertyType": "hostel",
  "roomCount": 25,
  "bedCount": 150,
  "currentOTADependency": 75,
  "motivations": [
    "reduce_commissions",
    "direct_guest_relationships",
    "pricing_control"
  ]
}
```

### Direct Booking Engine

#### GET /united/availability
Check room availability.

**Query Parameters:**
- `propertyId`: Property identifier
- `checkIn`: YYYY-MM-DD
- `checkOut`: YYYY-MM-DD
- `guests`: Number of guests
- `roomType`: (optional) Specific room type

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "rooms": [
      {
        "id": "room_001",
        "type": "8-bed-mixed-dorm",
        "name": "Ocean View Dorm",
        "capacity": 8,
        "availableBeds": 3,
        "price": {
          "amount": 25.00,
          "currency": "EUR",
          "includes": ["breakfast", "wifi", "locker"]
        },
        "images": ["https://..."],
        "amenities": ["ac", "ensuite", "keycard"]
      }
    ],
    "totalPrice": {
      "amount": 75.00,
      "currency": "EUR",
      "breakdown": {
        "accommodation": 75.00,
        "taxes": 0,
        "fees": 0
      }
    }
  }
}
```

#### POST /united/bookings
Create direct booking.

**Request:**
```json
{
  "propertyId": "prop_123",
  "roomId": "room_001",
  "checkIn": "2024-08-01",
  "checkOut": "2024-08-04",
  "guests": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+34600123456",
      "nationality": "US"
    }
  ],
  "specialRequests": "Late check-in around 23:00",
  "paymentMethod": "card",
  "totalAmount": 75.00,
  "currency": "EUR"
}
```

## Webhooks

### Webhook Events

The API sends webhooks for important events:

#### Course Completion
```json
{
  "event": "course.completed",
  "timestamp": "2024-07-15T10:00:00Z",
  "data": {
    "userId": "usr_123",
    "courseId": "crs_001",
    "completionDate": "2024-07-15T10:00:00Z",
    "finalScore": 92,
    "certificateUrl": "https://certificates.pvtacademy.com/..."
  }
}
```

#### Project Milestone Completed
```json
{
  "event": "project.milestone.completed",
  "timestamp": "2024-07-20T15:30:00Z",
  "data": {
    "projectId": "prj_789",
    "milestoneId": "mls_001",
    "developerId": "dev_123",
    "amount": 300,
    "escrowReleased": true
  }
}
```

#### New Direct Booking
```json
{
  "event": "booking.created",
  "timestamp": "2024-07-25T12:00:00Z",
  "data": {
    "bookingId": "bkg_456",
    "propertyId": "prop_123",
    "checkIn": "2024-08-01",
    "checkOut": "2024-08-04",
    "totalAmount": 75.00,
    "guestEmail": "john@example.com",
    "source": "direct"
  }
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| PAYMENT_REQUIRED | 402 | Payment failed or required |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

## Rate Limiting

- **Authenticated requests**: 1000 per hour
- **Unauthenticated requests**: 100 per hour
- **Booking endpoints**: 10 per minute

Headers included in responses:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## SDK Examples

### JavaScript/TypeScript
```typescript
import { PVTEcosystemSDK } from '@pvtecosystem/sdk';

const client = new PVTEcosystemSDK({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Academy example
const courses = await client.academy.listCourses({
  category: 'mental-health',
  language: 'en'
});

// Automation example
const project = await client.automation.createProject({
  title: 'Custom Pricing Engine',
  description: 'Need dynamic pricing based on occupancy',
  budget: { min: 1000, max: 3000, currency: 'USD' }
});

// United example
const availability = await client.united.checkAvailability({
  propertyId: 'prop_123',
  checkIn: '2024-08-01',
  checkOut: '2024-08-04',
  guests: 2
});
```

### Python
```python
from pvt_ecosystem import Client

client = Client(
    api_key='your-api-key',
    environment='production'
)

# Academy example
courses = client.academy.list_courses(
    category='mental-health',
    language='en'
)

# Automation example
project = client.automation.create_project(
    title='Custom Pricing Engine',
    description='Need dynamic pricing based on occupancy',
    budget={'min': 1000, 'max': 3000, 'currency': 'USD'}
)

# United example
availability = client.united.check_availability(
    property_id='prop_123',
    check_in='2024-08-01',
    check_out='2024-08-04',
    guests=2
)
```

---

*Last Updated: July 2024*
*API Version: 1.0.0*