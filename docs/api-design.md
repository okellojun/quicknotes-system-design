## API Design

# QuickNotes REST API Specification

This document details the production REST API specification for the QuickNotes backend platform.

## REST Endpoints Summary

| Method | Path | Description | Success Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notes` | List paginated notes for the authenticated user | `200 OK` |
| `POST` | `/api/v1/notes` | Create a new note | `201 Created` |
| `GET` | `/api/v1/notes/{id}` | Retrieve a specific note by ID | `200 OK` |
| `PUT` | `/api/v1/notes/{id}` | Fully update an existing note | `200 OK` |
| `PATCH` | `/api/v1/notes/{id}` | Partially update note attributes or tags | `200 OK` |
| `DELETE` | `/api/v1/notes/{id}` | Soft-delete a note by ID | `200 OK` / `204 No Content` |

---

## Request & Response Examples

### Create a Note (`POST /api/v1/notes`)

#### Request Header
``http
POST /api/v1/notes HTTP/1.1
Host: api.quicknotes.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

## Request Body
  ``  {
    "title": "System Architecture Review",
    "body": "Prepare load estimation figures and database schema for the team sync on Friday.",
    "tag_ids": [1, 4]
    }

### Response (201 Created)
  ``JSON
  {
    "status": "success",
    "data": {
        "id": "e3a890f1-4b10-410a-9d91-325b399120a1",
        "user_id": "usr_99823104",
        "title": "System Architecture Review",
        "body": "Prepare load estimation figures and database schema for the team sync on Friday.",
        "tags": [
        { "id": 1, "name": "Work" },
        { "id": 4, "name": "Architecture" }
        ],
        "created_at": "2026-10-08T10:15:30Z",
        "updated_at": "2026-10-08T10:15:30Z"
    }
}

### List Notes (GET /api/v1/notes)
### Request Header
``http
GET /api/v1/notes?page=1&limit=2&tag=Work HTTP/1.1
Host: api.quicknotes.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Response (200 OK)
``JSON
{
  "status": "success",
  "data": [
    {
      "id": "e3a890f1-4b10-410a-9d91-325b399120a1",
      "user_id": "usr_99823104",
      "title": "System Architecture Review",
      "body": "Prepare load estimation figures and database schema for the team sync on Friday.",
      "tags": [
        { "id": 1, "name": "Work" },
        { "id": 4, "name": "Architecture" }
      ],
      "created_at": "2026-10-08T10:15:30Z",
      "updated_at": "2026-10-08T10:15:30Z"
    },
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "user_id": "usr_99823104",
      "title": "Grocery Shopping List",
      "body": "Oat milk, organic eggs, coffee beans, fresh spinach.",
      "tags": [
        { "id": 1, "name": "Work" }
      ],
      "created_at": "2026-10-07T18:20:00Z",
      "updated_at": "2026-10-07T18:20:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 2,
    "total_records": 15,
    "total_pages": 8
  }
}

### Error Response Specifications
The API returns standardized JSON bodies for all HTTP error status codes.

Handled Error Status Codes
400 Bad Request: Validation failure or malformed JSON syntax.

401 Unauthorized: Missing, expired, or invalid HTTP Authorization header.

403 Forbidden: Authenticated user lacks permission to access or modify the resource.

404 Not Found: The requested note ID or endpoint does not exist.

500 Internal Server Error: Unexpected system or database exception.

### Standardized Error Format (400 Bad Request Example)
``JSON
{
  "status": "error",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request payload contains invalid fields.",
    "details": [
      {
        "field": "title",
        "issue": "Title is required and must not exceed 100 characters."
      }
    ],
    "timestamp": "2026-10-08T10:16:02Z",
    "path": "/api/v1/notes"
  }
}

