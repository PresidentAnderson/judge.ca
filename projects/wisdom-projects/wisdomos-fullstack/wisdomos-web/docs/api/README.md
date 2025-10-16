# WisdomOS Web API Documentation

[![API Version](https://img.shields.io/badge/API%20Version-v1-blue.svg)](https://github.com/your-org/wisdomos-web)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0.3-green.svg)](https://swagger.io/specification/)

This document provides comprehensive documentation for the WisdomOS Web API. All endpoints are built using Next.js 15 API routes with TypeScript and Zod validation.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Journal](#journal)
  - [Habits](#habits)
  - [Habit Tracking](#habit-tracking)
  - [Life Areas](#life-areas)
  - [Users](#users)
- [Data Models](#data-models)
- [Examples](#examples)

## Authentication

The API uses **Stack Auth** with JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Authentication Flow

1. User authenticates via Stack Auth
2. Frontend receives JWT token
3. Include token in all API requests
4. Server validates token using JWKS endpoint

### JWKS Configuration

- **JWKS URL**: `https://api.stack-auth.com/api/v1/projects/098f28b2-c387-4e71-8dab-bc81b9643abd/.well-known/jwks.json`
- **Project ID**: `098f28b2-c387-4e71-8dab-bc81b9643abd`

## Base URL

```
Production: https://your-domain.netlify.app/api
Development: http://localhost:3000/api
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "data": <response_data>,
  "meta": {
    "timestamp": "2024-10-16T10:00:00.000Z",
    "version": "0.1.0"
  }
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": <validation_errors>, // Optional
  "code": "ERROR_CODE", // Optional
  "timestamp": "2024-10-16T10:00:00.000Z"
}
```

## Error Handling

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Validation error |
| `401` | Unauthorized - Invalid or missing token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |
| `503` | Service Unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTH_ERROR` | Authentication failed |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Rate limit exceeded |
| `SERVER_ERROR` | Internal server error |

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- Headers included in response:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Endpoints

### Health Check

Monitor API health status.

#### `GET /api/health`

**Description**: Check API health status

**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-16T10:00:00.000Z",
  "version": "0.1.0"
}
```

**cURL Example**:
```bash
curl -X GET https://your-domain.netlify.app/api/health
```

---

### Journal

Manage personal journal entries with mood tracking.

#### `GET /api/journal`

**Description**: Retrieve user's journal entries

**Authentication**: Required

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Maximum entries to return |

**Response**:
```json
{
  "data": [
    {
      "id": "entry_123",
      "title": "My Productive Day",
      "content": "Today was very productive...",
      "mood_rating": 8,
      "created_at": "2024-10-16T10:00:00.000Z",
      "updated_at": "2024-10-16T10:00:00.000Z",
      "user_id": "user_456"
    }
  ]
}
```

**cURL Example**:
```bash
curl -X GET \
  -H "Authorization: Bearer <jwt_token>" \
  "https://your-domain.netlify.app/api/journal?limit=10"
```

#### `POST /api/journal`

**Description**: Create a new journal entry

**Authentication**: Required

**Request Body**:
```json
{
  "title": "My Day", // Optional
  "content": "Today I learned...", // Required
  "mood_rating": 7 // Optional, 1-10
}
```

**Response**:
```json
{
  "data": {
    "id": "entry_123",
    "title": "My Day",
    "content": "Today I learned...",
    "mood_rating": 7,
    "created_at": "2024-10-16T10:00:00.000Z",
    "updated_at": "2024-10-16T10:00:00.000Z",
    "user_id": "user_456"
  }
}
```

**cURL Example**:
```bash
curl -X POST \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Day",
    "content": "Today I learned...",
    "mood_rating": 7
  }' \
  https://your-domain.netlify.app/api/journal
```

#### `GET /api/journal/[id]`

**Description**: Get specific journal entry

**Authentication**: Required

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Journal entry ID |

**Response**:
```json
{
  "data": {
    "id": "entry_123",
    "title": "My Productive Day",
    "content": "Today was very productive...",
    "mood_rating": 8,
    "created_at": "2024-10-16T10:00:00.000Z",
    "updated_at": "2024-10-16T10:00:00.000Z",
    "user_id": "user_456"
  }
}
```

#### `PUT /api/journal/[id]`

**Description**: Update journal entry

**Authentication**: Required

**Request Body**: Same as POST (all fields optional)

#### `DELETE /api/journal/[id]`

**Description**: Delete journal entry

**Authentication**: Required

**Response**: `204 No Content`

---

### Habits

Manage user habits and track progress.

#### `GET /api/habits`

**Description**: Get user's habits

**Authentication**: Required

**Response**:
```json
{
  "data": [
    {
      "id": "habit_123",
      "name": "Daily Exercise",
      "description": "30 minutes of physical activity",
      "frequency": "daily",
      "target_value": 30,
      "life_area_id": "area_456",
      "created_at": "2024-10-16T10:00:00.000Z",
      "updated_at": "2024-10-16T10:00:00.000Z",
      "user_id": "user_456"
    }
  ]
}
```

#### `POST /api/habits`

**Description**: Create a new habit

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Daily Reading", // Required
  "description": "Read for 30 minutes daily", // Optional
  "frequency": "daily", // Required: daily, weekly, monthly
  "target_value": 30, // Optional
  "life_area_id": "area_123" // Optional
}
```

**Response**: Returns created habit (status 201)

#### `GET /api/habits/[id]`

**Description**: Get specific habit

#### `PUT /api/habits/[id]`

**Description**: Update habit

#### `DELETE /api/habits/[id]`

**Description**: Delete habit

---

### Habit Tracking

Track habit completion and progress.

#### `POST /api/habits/track`

**Description**: Track habit completion

**Authentication**: Required

**Request Body**:
```json
{
  "habit_id": "habit_123", // Required
  "value": 35, // Optional (minutes, reps, etc.)
  "notes": "Great workout today!" // Optional
}
```

**Response**:
```json
{
  "data": {
    "id": "tracking_789",
    "habit_id": "habit_123",
    "value": 35,
    "notes": "Great workout today!",
    "completed_at": "2024-10-16T10:00:00.000Z",
    "user_id": "user_456"
  }
}
```

#### `GET /api/habits/[id]/tracking`

**Description**: Get habit tracking history

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | string | Start date (ISO 8601) |
| `end_date` | string | End date (ISO 8601) |
| `limit` | integer | Max records to return |

---

### Life Areas

Organize habits by life categories (Health, Career, etc.).

#### `GET /api/life-areas`

**Description**: Get user's life areas

**Authentication**: Required

**Response**:
```json
{
  "data": [
    {
      "id": "area_123",
      "name": "Health & Fitness",
      "description": "Physical and mental wellness",
      "color": "#4CAF50",
      "created_at": "2024-10-16T10:00:00.000Z",
      "user_id": "user_456"
    }
  ]
}
```

#### `POST /api/life-areas`

**Description**: Create life area

**Request Body**:
```json
{
  "name": "Personal Development", // Required
  "description": "Learning and growth", // Optional
  "color": "#2196F3" // Optional, hex color
}
```

---

### Users

User profile and account management.

#### `GET /api/users/profile`

**Description**: Get user profile

**Authentication**: Required

#### `PUT /api/users/profile`

**Description**: Update user profile

#### `DELETE /api/users/account`

**Description**: Delete user account

## Data Models

### Journal Entry

```typescript
interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood_rating?: number; // 1-10
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  user_id: string;
}
```

### Habit

```typescript
interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_value?: number;
  life_area_id?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}
```

### Habit Tracking

```typescript
interface HabitTracking {
  id: string;
  habit_id: string;
  value?: number;
  notes?: string;
  completed_at: string;
  user_id: string;
}
```

### Life Area

```typescript
interface LifeArea {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color code
  created_at: string;
  user_id: string;
}
```

## Examples

### Complete Workflow Example

```javascript
// 1. Create a life area
const lifeAreaResponse = await fetch('/api/life-areas', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Health & Fitness',
    description: 'Physical wellness goals',
    color: '#4CAF50'
  })
});
const lifeArea = await lifeAreaResponse.json();

// 2. Create a habit
const habitResponse = await fetch('/api/habits', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Morning Run',
    description: '30-minute morning run',
    frequency: 'daily',
    target_value: 30,
    life_area_id: lifeArea.data.id
  })
});
const habit = await habitResponse.json();

// 3. Track the habit
const trackResponse = await fetch('/api/habits/track', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    habit_id: habit.data.id,
    value: 35,
    notes: 'Great morning run in the park!'
  })
});

// 4. Create journal entry about it
const journalResponse = await fetch('/api/journal', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Successful Morning Routine',
    content: 'Started my day with a great 35-minute run. Feeling energized and ready for the day!',
    mood_rating: 9
  })
});
```

### Error Handling Example

```javascript
try {
  const response = await fetch('/api/journal', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: '' // Invalid: empty content
    })
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.details) {
      // Handle validation errors
      error.details.forEach(detail => {
        console.error(`${detail.path.join('.')}: ${detail.message}`);
      });
    } else {
      console.error('API Error:', error.error);
    }
    return;
  }

  const data = await response.json();
  console.log('Success:', data);
} catch (error) {
  console.error('Network error:', error);
}
```

## Postman Collection

Import our Postman collection for easy API testing:

```json
{
  "info": {
    "name": "WisdomOS Web API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "authToken",
      "value": "{{jwt_token}}"
    }
  ]
}
```

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
import { WisdomOSClient } from '@wisdomos/sdk';

const client = new WisdomOSClient({
  baseUrl: 'https://your-domain.netlify.app/api',
  token: 'your-jwt-token'
});

// Create journal entry
const entry = await client.journal.create({
  title: 'My Day',
  content: 'Today was productive...',
  mood_rating: 8
});

// Get habits
const habits = await client.habits.list();

// Track habit
await client.habits.track({
  habit_id: 'habit_123',
  value: 30,
  notes: 'Completed successfully!'
});
```

---

**Last Updated**: October 2024  
**API Version**: 0.1.0  
**Documentation Version**: 1.0.0

For questions or issues with the API, please [open an issue](https://github.com/your-org/wisdomos-web/issues/new) or contact our support team.