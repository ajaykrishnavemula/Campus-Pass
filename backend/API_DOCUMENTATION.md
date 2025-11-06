# Campus-Pass API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description",
  "errors": [ ... ] // Optional validation errors
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user (student, warden, or security).

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "Password123",
  "name": "John Doe",
  "role": 0,
  "phone": "+1234567890",
  
  // For Students (role: 0)
  "rollNumber": "CS2021001",
  "department": "Computer Science",
  "year": 3,
  "hostel": "Hostel A",
  "roomNumber": "101",
  "parentPhone": "+1234567891",
  "gender": "male",
  
  // For Wardens (role: 2)
  "employeeId": "W001",
  "department": "Administration",
  "hostelAssigned": "Hostel A",
  
  // For Security (role: 3)
  "employeeId": "S001",
  "gateAssigned": "Main Gate",
  "shiftTiming": "Morning"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "Password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

### Change Password
**POST** `/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Response:** `200 OK`

### Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Response:** `200 OK`

### Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123"
}
```

**Response:** `200 OK`

---

## Student Endpoints

### Create Outpass
**POST** `/student/outpasses`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "purpose": 2,
  "destination": "Home",
  "fromDate": "2025-11-10T10:00:00Z",
  "toDate": "2025-11-12T18:00:00Z",
  "reason": "Family emergency - need to visit home",
  "contactNumber": "+1234567890",
  "emergencyContact": "+1234567891"
}
```

**Purpose Types:**
- 0: Personal
- 1: Medical
- 2: Home
- 3: Shopping
- 4: Emergency
- 5: Other

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Outpass request created successfully",
  "data": {
    "outpass": {
      "outpassNumber": "OP-2025-001",
      "status": "pending",
      ...
    }
  }
}
```

### Get My Outpasses
**GET** `/student/outpasses?page=1&limit=20&status=pending`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "outpasses": [ ... ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

### Get Outpass Details
**GET** `/student/outpasses/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Update Outpass
**PUT** `/student/outpasses/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (Only for pending outpasses)
```json
{
  "destination": "Updated destination",
  "reason": "Updated reason"
}
```

**Response:** `200 OK`

### Cancel Outpass
**DELETE** `/student/outpasses/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Download Outpass PDF
**GET** `/student/outpasses/:id/download`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK` (PDF file)

### Get Profile
**GET** `/student/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "student": {
      ...
      "stats": {
        "totalOutpasses": 10,
        "pendingOutpasses": 2,
        "approvedOutpasses": 7,
        "rejectedOutpasses": 1,
        "approvalRate": "70.00"
      }
    }
  }
}
```

### Update Profile
**PUT** `/student/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "phone": "+1234567890",
  "parentPhone": "+1234567891"
}
```

**Response:** `200 OK`

### Get Statistics
**GET** `/student/stats`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Warden Endpoints

### Get Dashboard
**GET** `/warden/dashboard`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalStudents": 500,
      "totalOutpasses": 1000,
      "pendingOutpasses": 15,
      "approvedToday": 10,
      "rejectedToday": 2,
      "studentsOut": 25,
      "overdueStudents": 3
    },
    "recentOutpasses": [ ... ],
    "alerts": [ ... ]
  }
}
```

### Get Pending Outpasses
**GET** `/warden/outpasses/pending?page=1&limit=20`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Get All Outpasses
**GET** `/warden/outpasses?page=1&limit=20&status=approved`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Get Outpass Details
**GET** `/warden/outpasses/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Approve Outpass
**POST** `/warden/outpasses/:id/approve`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "remarks": "Approved for valid reason"
}
```

**Response:** `200 OK`

### Reject Outpass
**POST** `/warden/outpasses/:id/reject`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Insufficient reason provided"
}
```

**Response:** `200 OK`

### Get Students
**GET** `/warden/students?page=1&limit=20`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Get Student Details
**GET** `/warden/students/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Update Student Status
**PUT** `/warden/students/:id/status`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": false,
  "reason": "Disciplinary action"
}
```

**Response:** `200 OK`

### Get Analytics
**GET** `/warden/analytics?startDate=2025-01-01&endDate=2025-12-31`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOutpasses": 1000,
      "approved": 850,
      "rejected": 100,
      "cancelled": 50,
      "approvalRate": "85.00"
    },
    "topReasons": [ ... ],
    "departmentBreakdown": [ ... ]
  }
}
```

---

## Security Endpoints

### Scan QR Code
**POST** `/security/scan`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "qrData": "encrypted-qr-code-data"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "QR code verified successfully",
  "data": {
    "outpass": { ... }
  }
}
```

### Check Out Student
**POST** `/security/check-out`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "outpassId": "507f1f77bcf86cd799439011",
  "guardName": "John Security",
  "remarks": "Student checked out at main gate"
}
```

**Response:** `200 OK`

### Check In Student
**POST** `/security/check-in`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "outpassId": "507f1f77bcf86cd799439011",
  "guardName": "John Security",
  "remarks": "Student checked in at main gate"
}
```

**Response:** `200 OK`

### Get Active Passes
**GET** `/security/active-passes`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "activePasses": [ ... ],
    "count": 25
  }
}
```

### Get Overdue Passes
**GET** `/security/overdue-passes`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Get Security Logs
**GET** `/security/logs?date=2025-11-05`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Notification Endpoints

### Get Notifications
**GET** `/notifications?page=1&limit=20&unread=true`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Get Unread Count
**GET** `/notifications/unread-count`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### Mark as Read
**PUT** `/notifications/:id/read`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Mark All as Read
**PUT** `/notifications/read-all`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Delete Notification
**DELETE** `/notifications/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Delete All Notifications
**DELETE** `/notifications`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `500 Internal Server Error` - Server error

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

## Pagination

Endpoints that return lists support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 200,
    "itemsPerPage": 20
  }
}
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-05