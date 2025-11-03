# CampusPass - Complete API Reference

> **Comprehensive API documentation for the Campus Outpass Management System**

**Base URL**: `http://localhost:3000/api`  
**Version**: 1.0.0  
**Framework**: Fastify + TypeScript  
**Authentication**: JWT Bearer Token

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Students](#students)
- [Wardens](#wardens)
- [Outpasses](#outpasses)
- [Hostels](#hostels)
- [Notifications](#notifications)
- [Analytics](#analytics)
- [Error Responses](#error-responses)

---

## 🔐 Authentication

All protected endpoints require JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Structure
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "student|warden|admin",
  "hostelId": "507f1f77bcf86cd799439012"
}
```

---

## 👨‍🎓 Students

### 1. Student Registration

Register a new student account.

**Endpoint**: `POST /auth/register/student`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@university.edu",
  "password": "SecurePass123!",
  "rollNumber": "CS2021001",
  "department": "Computer Science",
  "year": 3,
  "hostelId": "507f1f77bcf86cd799439012",
  "roomNumber": "A-301",
  "phone": "+919876543210",
  "parentPhone": "+919876543211",
  "bloodGroup": "O+",
  "emergencyContact": {
    "name": "Jane Doe",
    "relation": "Mother",
    "phone": "+919876543211"
  }
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Student registered successfully",
  "data": {
    "student": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "rollNumber": "CS2021001",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email or roll number already exists

---

### 2. Student Login

Authenticate student and get JWT token.

**Endpoint**: `POST /auth/login/student`

**Request Body**:
```json
{
  "email": "john.doe@university.edu",
  "password": "SecurePass123!"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "student": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "rollNumber": "CS2021001",
      "hostelId": "507f1f77bcf86cd799439012",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `404 Not Found`: Student not found

---

### 3. Get Student Profile

Get authenticated student's profile.

**Endpoint**: `GET /students/me`

**Headers**:
```http
Authorization: Bearer <student-token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "rollNumber": "CS2021001",
      "department": "Computer Science",
      "year": 3,
      "hostel": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Hostel A",
        "warden": "Dr. Smith"
      },
      "roomNumber": "A-301",
      "phone": "+919876543210",
      "parentPhone": "+919876543211",
      "bloodGroup": "O+",
      "emergencyContact": {
        "name": "Jane Doe",
        "relation": "Mother",
        "phone": "+919876543211"
      },
      "stats": {
        "totalOutpasses": 15,
        "pendingOutpasses": 2,
        "approvedOutpasses": 10,
        "rejectedOutpasses": 3
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 4. Update Student Profile

Update student profile information.

**Endpoint**: `PATCH /students/me`

**Headers**:
```http
Authorization: Bearer <student-token>
```

**Request Body**:
```json
{
  "phone": "+919876543210",
  "parentPhone": "+919876543211",
  "emergencyContact": {
    "name": "Jane Doe",
    "relation": "Mother",
    "phone": "+919876543211"
  }
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

## 👨‍💼 Wardens

### 1. Warden Registration

Register a new warden account.

**Endpoint**: `POST /auth/register/warden`

**Request Body**:
```json
{
  "name": "Dr. Smith",
  "email": "smith@university.edu",
  "password": "SecurePass123!",
  "employeeId": "EMP2021001",
  "department": "Administration",
  "hostelId": "507f1f77bcf86cd799439012",
  "phone": "+919876543210"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Warden registered successfully",
  "data": {
    "warden": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Dr. Smith",
      "email": "smith@university.edu",
      "employeeId": "EMP2021001",
      "role": "warden"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Warden Login

Authenticate warden and get JWT token.

**Endpoint**: `POST /auth/login/warden`

**Request Body**:
```json
{
  "email": "smith@university.edu",
  "password": "SecurePass123!"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "warden": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Dr. Smith",
      "email": "smith@university.edu",
      "employeeId": "EMP2021001",
      "hostelId": "507f1f77bcf86cd799439012",
      "role": "warden"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Warden Dashboard

Get warden dashboard with statistics.

**Endpoint**: `GET /wardens/dashboard`

**Headers**:
```http
Authorization: Bearer <warden-token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalStudents": 250,
      "totalOutpasses": 450,
      "pendingOutpasses": 15,
      "approvedToday": 8,
      "rejectedToday": 2,
      "studentsOut": 12
    },
    "recentOutpasses": [
      {
        "id": "507f1f77bcf86cd799439014",
        "student": {
          "name": "John Doe",
          "rollNumber": "CS2021001"
        },
        "reason": "Medical Emergency",
        "status": "pending",
        "requestedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "alerts": [
      {
        "type": "overdue",
        "message": "5 students have not returned on time",
        "count": 5
      }
    ]
  }
}
```

---

## 📝 Outpasses

### 1. Create Outpass Request

Student creates a new outpass request.

**Endpoint**: `POST /outpasses`

**Headers**:
```http
Authorization: Bearer <student-token>
```

**Request Body**:
```json
{
  "reason": "Medical Emergency",
  "destination": "City Hospital",
  "fromDate": "2024-01-15T14:00:00.000Z",
  "toDate": "2024-01-15T18:00:00.000Z",
  "contactNumber": "+919876543210",
  "emergencyContact": "+919876543211",
  "remarks": "Doctor appointment scheduled"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Outpass request created successfully",
  "data": {
    "outpass": {
      "id": "507f1f77bcf86cd799439014",
      "outpassNumber": "OP2024011501",
      "status": "pending",
      "reason": "Medical Emergency",
      "fromDate": "2024-01-15T14:00:00.000Z",
      "toDate": "2024-01-15T18:00:00.000Z",
      "requestedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid date range or missing required fields
- `409 Conflict`: Overlapping outpass exists

---

### 2. Get Student Outpasses

Get all outpasses for authenticated student.

**Endpoint**: `GET /outpasses/my`

**Headers**:
```http
Authorization: Bearer <student-token>
```

**Query Parameters**:
- `status` (optional): Filter by status (pending, approved, rejected, cancelled)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "outpasses": [
      {
        "id": "507f1f77bcf86cd799439014",
        "outpassNumber": "OP2024011501",
        "reason": "Medical Emergency",
        "destination": "City Hospital",
        "fromDate": "2024-01-15T14:00:00.000Z",
        "toDate": "2024-01-15T18:00:00.000Z",
        "status": "approved",
        "approvedBy": {
          "name": "Dr. Smith",
          "employeeId": "EMP2021001"
        },
        "approvedAt": "2024-01-15T11:00:00.000Z",
        "remarks": "Doctor appointment scheduled",
        "requestedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 15,
      "itemsPerPage": 20
    }
  }
}
```

---

### 3. Get Outpass Details

Get detailed information about a specific outpass.

**Endpoint**: `GET /outpasses/:id`

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "outpass": {
      "id": "507f1f77bcf86cd799439014",
      "outpassNumber": "OP2024011501",
      "student": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "rollNumber": "CS2021001",
        "department": "Computer Science",
        "year": 3,
        "roomNumber": "A-301",
        "phone": "+919876543210"
      },
      "reason": "Medical Emergency",
      "destination": "City Hospital",
      "fromDate": "2024-01-15T14:00:00.000Z",
      "toDate": "2024-01-15T18:00:00.000Z",
      "contactNumber": "+919876543210",
      "emergencyContact": "+919876543211",
      "status": "approved",
      "approvedBy": {
        "id": "507f1f77bcf86cd799439013",
        "name": "Dr. Smith",
        "employeeId": "EMP2021001"
      },
      "approvedAt": "2024-01-15T11:00:00.000Z",
      "remarks": "Doctor appointment scheduled",
      "wardenRemarks": "Approved for medical reasons",
      "checkOut": {
        "time": "2024-01-15T14:05:00.000Z",
        "guardName": "Security Guard 1"
      },
      "checkIn": {
        "time": "2024-01-15T17:55:00.000Z",
        "guardName": "Security Guard 2"
      },
      "requestedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 4. Get Pending Outpasses (Warden)

Get all pending outpass requests for warden's hostel.

**Endpoint**: `GET /outpasses/pending`

**Headers**:
```http
Authorization: Bearer <warden-token>
```

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "outpasses": [
      {
        "id": "507f1f77bcf86cd799439014",
        "outpassNumber": "OP2024011501",
        "student": {
          "name": "John Doe",
          "rollNumber": "CS2021001",
          "roomNumber": "A-301",
          "phone": "+919876543210"
        },
        "reason": "Medical Emergency",
        "destination": "City Hospital",
        "fromDate": "2024-01-15T14:00:00.000Z",
        "toDate": "2024-01-15T18:00:00.000Z",
        "requestedAt": "2024-01-15T10:30:00.000Z",
        "urgency": "high"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15
    }
  }
}
```

---

### 5. Approve Outpass (Warden)

Approve a pending outpass request.

**Endpoint**: `PATCH /outpasses/:id/approve`

**Headers**:
```http
Authorization: Bearer <warden-token>
```

**Request Body**:
```json
{
  "remarks": "Approved for medical reasons"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Outpass approved successfully",
  "data": {
    "outpass": {
      "id": "507f1f77bcf86cd799439014",
      "status": "approved",
      "approvedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

---

### 6. Reject Outpass (Warden)

Reject a pending outpass request.

**Endpoint**: `PATCH /outpasses/:id/reject`

**Headers**:
```http
Authorization: Bearer <warden-token>
```

**Request Body**:
```json
{
  "reason": "Insufficient information provided"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Outpass rejected successfully",
  "data": {
    "outpass": {
      "id": "507f1f77bcf86cd799439014",
      "status": "rejected",
      "rejectedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

---

### 7. Cancel Outpass (Student)

Cancel an approved outpass before checkout.

**Endpoint**: `PATCH /outpasses/:id/cancel`

**Headers**:
```http
Authorization: Bearer <student-token>
```

**Request Body**:
```json
{
  "reason": "Plans changed"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Outpass cancelled successfully"
}
```

---

### 8. Check Out (Security)

Mark student as checked out.

**Endpoint**: `POST /outpasses/:id/checkout`

**Headers**:
```http
Authorization: Bearer <security-token>
```

**Request Body**:
```json
{
  "guardName": "Security Guard 1",
  "remarks": "Student checked out at gate"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Student checked out successfully",
  "data": {
    "checkOut": {
      "time": "2024-01-15T14:05:00.000Z",
      "guardName": "Security Guard 1"
    }
  }
}
```

---

### 9. Check In (Security)

Mark student as checked in.

**Endpoint**: `POST /outpasses/:id/checkin`

**Headers**:
```http
Authorization: Bearer <security-token>
```

**Request Body**:
```json
{
  "guardName": "Security Guard 2",
  "remarks": "Student returned on time"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Student checked in successfully",
  "data": {
    "checkIn": {
      "time": "2024-01-15T17:55:00.000Z",
      "guardName": "Security Guard 2"
    }
  }
}
```

---

## 🏠 Hostels

### 1. Get All Hostels

Get list of all hostels.

**Endpoint**: `GET /hostels`

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "hostels": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Hostel A",
        "type": "boys",
        "capacity": 300,
        "occupied": 250,
        "warden": {
          "name": "Dr. Smith",
          "phone": "+919876543210"
        },
        "address": "University Campus, Block A"
      }
    ]
  }
}
```

---

### 2. Get Hostel Details

Get detailed information about a hostel.

**Endpoint**: `GET /hostels/:id`

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "hostel": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Hostel A",
      "type": "boys",
      "capacity": 300,
      "occupied": 250,
      "available": 50,
      "warden": {
        "id": "507f1f77bcf86cd799439013",
        "name": "Dr. Smith",
        "email": "smith@university.edu",
        "phone": "+919876543210"
      },
      "address": "University Campus, Block A",
      "facilities": [
        "WiFi",
        "Gym",
        "Library",
        "Mess"
      ],
      "stats": {
        "totalStudents": 250,
        "studentsOut": 12,
        "pendingOutpasses": 5
      }
    }
  }
}
```

---

## 🔔 Notifications

### 1. Get User Notifications

Get all notifications for authenticated user.

**Endpoint**: `GET /notifications`

**Headers**:
```http
Authorization: Bearer <token>
```

**Query Parameters**:
- `unread` (optional): Filter unread notifications (true/false)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "507f1f77bcf86cd799439015",
        "type": "outpass_approved",
        "title": "Outpass Approved",
        "message": "Your outpass request OP2024011501 has been approved",
        "data": {
          "outpassId": "507f1f77bcf86cd799439014",
          "outpassNumber": "OP2024011501"
        },
        "read": false,
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 25
    }
  }
}
```

---

### 2. Mark Notification as Read

Mark a notification as read.

**Endpoint**: `PATCH /notifications/:id/read`

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 3. Mark All as Read

Mark all notifications as read.

**Endpoint**: `PATCH /notifications/read-all`

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 📊 Analytics

### 1. Get Student Analytics

Get analytics for student's outpass history.

**Endpoint**: `GET /analytics/student`

**Headers**:
```http
Authorization: Bearer <student-token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOutpasses": 15,
      "approved": 10,
      "rejected": 3,
      "cancelled": 2,
      "approvalRate": 66.67
    },
    "monthlyTrend": [
      {
        "month": "2024-01",
        "total": 5,
        "approved": 4,
        "rejected": 1
      }
    ],
    "reasonBreakdown": [
      {
        "reason": "Medical Emergency",
        "count": 5
      },
      {
        "reason": "Family Function",
        "count": 3
      }
    ]
  }
}
```

---

### 2. Get Hostel Analytics (Warden)

Get analytics for hostel outpasses.

**Endpoint**: `GET /analytics/hostel`

**Headers**:
```http
Authorization: Bearer <warden-token>
```

**Query Parameters**:
- `startDate` (optional): Start date for analytics
- `endDate` (optional): End date for analytics

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOutpasses": 450,
      "approved": 380,
      "rejected": 50,
      "cancelled": 20,
      "approvalRate": 84.44,
      "averageProcessingTime": "2.5 hours"
    },
    "dailyTrend": [
      {
        "date": "2024-01-15",
        "total": 15,
        "approved": 12,
        "rejected": 3
      }
    ],
    "topReasons": [
      {
        "reason": "Medical Emergency",
        "count": 120
      },
      {
        "reason": "Family Function",
        "count": 80
      }
    ],
    "departmentBreakdown": [
      {
        "department": "Computer Science",
        "count": 150
      }
    ]
  }
}
```

---

## ❌ Error Responses

### Standard Error Format

All errors follow this structure:

```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": {
    "field": "Specific error details"
  }
}
```

### Common Error Types

#### 400 Bad Request
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid input data",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "UnauthorizedError",
  "message": "Invalid or expired token"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "ForbiddenError",
  "message": "You don't have permission to access this resource"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "Resource not found"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "error": "ConflictError",
  "message": "Email already exists"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

---

## 📊 HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 🔒 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes
- **General endpoints**: 100 requests per 15 minutes
- **Warden endpoints**: 200 requests per 15 minutes

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

---

## 📝 Request/Response Examples

### Example: Complete Outpass Flow

#### 1. Student creates outpass
```bash
curl -X POST http://localhost:3000/api/outpasses \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Medical Emergency",
    "destination": "City Hospital",
    "fromDate": "2024-01-15T14:00:00.000Z",
    "toDate": "2024-01-15T18:00:00.000Z",
    "contactNumber": "+919876543210"
  }'
```

#### 2. Warden approves outpass
```bash
curl -X PATCH http://localhost:3000/api/outpasses/507f1f77bcf86cd799439014/approve \
  -H "Authorization: Bearer <warden-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Approved for medical reasons"
  }'
```

#### 3. Security checks out student
```bash
curl -X POST http://localhost:3000/api/outpasses/507f1f77bcf86cd799439014/checkout \
  -H "Authorization: Bearer <security-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "guardName": "Security Guard 1"
  }'
```

#### 4. Security checks in student
```bash
curl -X POST http://localhost:3000/api/outpasses/507f1f77bcf86cd799439014/checkin \
  -H "Authorization: Bearer <security-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "guardName": "Security Guard 2"
  }'
```

---

## 🔧 Development Notes

### Environment Variables Required
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/campuspass
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Testing Endpoints
Use tools like Postman, Insomnia, or curl to test endpoints.

### WebSocket Support (Future)
Real-time notifications will be available via WebSocket at:
```
ws://localhost:3000/ws
```

---

**Last Updated**: January 2