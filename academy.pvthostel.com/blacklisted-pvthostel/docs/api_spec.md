# API Specification

## Base URL
```
https://api.blacklisted-pvthostel.com/v1
```

## Authentication
All API endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Core Endpoints

### Authentication
```
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/profile
```

### Blacklist Management
```
GET    /blacklist                 # List all blacklisted entities
POST   /blacklist                 # Create new blacklist entry
GET    /blacklist/:id             # Get specific entry
PUT    /blacklist/:id             # Update entry
DELETE /blacklist/:id             # Remove entry
```

### Search & Filtering
```
GET /blacklist/search?q={query}&type={type}&status={status}
GET /blacklist/filter?category={category}&severity={severity}
```

### Admin Operations
```
GET    /admin/stats              # System statistics
GET    /admin/audit              # Audit log
POST   /admin/bulk-import        # Bulk import entries
GET    /admin/export             # Export data
```

## Request/Response Examples

### Create Blacklist Entry
```bash
POST /blacklist
Content-Type: application/json

{
  "entity_type": "person",
  "name": "John Doe",
  "identifier": "passport:US123456789",
  "reason": "Fraudulent activity",
  "severity": "high",
  "effective_date": "2024-01-01",
  "expiry_date": "2025-01-01",
  "metadata": {
    "source": "internal_investigation",
    "case_number": "CASE-2024-001"
  }
}
```

### Response
```json
{
  "status": "success",
  "data": {
    "id": "bl_123456789",
    "entity_type": "person",
    "name": "John Doe",
    "identifier": "passport:US123456789",
    "reason": "Fraudulent activity",
    "severity": "high",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "effective_date": "2024-01-01",
    "expiry_date": "2025-01-01"
  }
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting
- 100 requests per minute per API key
- 1000 requests per hour per API key
- Bulk operations have separate limits