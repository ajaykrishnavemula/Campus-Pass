# Campus-Pass System Architecture

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Data Flow](#data-flow)
5. [Component Architecture](#component-architecture)
6. [Database Schema](#database-schema)
7. [API Architecture](#api-architecture)
8. [Real-time Communication](#real-time-communication)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)

## 🎯 Overview

Campus-Pass is a comprehensive outpass management system designed for educational institutions. It streamlines the process of requesting, approving, and tracking student outpasses with real-time notifications and QR code-based verification.

### Key Stakeholders
- **Students**: Request and track outpasses
- **Wardens**: Review and approve/reject outpass requests
- **Security Personnel**: Verify and process check-ins/check-outs
- **Administrators**: System configuration and oversight

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Student    │  │   Warden     │  │   Security   │      │
│  │   Portal     │  │   Portal     │  │   Portal     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │   (Fastify)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  REST API      │  │  WebSocket      │  │  Services      │
│  Endpoints     │  │  (Socket.io)    │  │  Layer         │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   MongoDB       │
                    │   Database      │
                    └─────────────────┘
```

### Three-Tier Architecture

1. **Presentation Layer** (Frontend)
   - React-based Single Page Application (SPA)
   - Responsive UI with Tailwind CSS
   - Real-time updates via Socket.io
   - QR code generation and scanning

2. **Application Layer** (Backend)
   - Fastify web framework
   - RESTful API endpoints
   - WebSocket server for real-time features
   - Business logic and validation
   - Authentication and authorization

3. **Data Layer**
   - MongoDB database
   - Document-based storage
   - Indexed queries for performance
   - Data validation and constraints

## 🛠️ Technology Stack

### Frontend Stack
```
React 19.1.1
├── TypeScript 5.9.3          # Type safety
├── Vite 7.1.7                # Build tool
├── Tailwind CSS 4.1.16       # Styling
├── Zustand 5.0.8             # State management
├── React Router 7.9.5        # Routing
├── Axios 1.13.2              # HTTP client
├── Socket.io Client 4.8.1    # Real-time
├── React Hook Form 7.66.0    # Forms
├── Zod 4.1.12                # Validation
└── qrcode.react 4.2.0        # QR codes
```

### Backend Stack
```
Node.js 18+
├── Fastify 4.x               # Web framework
├── TypeScript 5.x            # Type safety
├── MongoDB 6.x               # Database
├── Mongoose 8.x              # ODM
├── Socket.io 4.x             # WebSocket
├── JWT                       # Authentication
├── Bcrypt                    # Password hashing
├── Nodemailer                # Email
├── PDFKit                    # PDF generation
└── QRCode                    # QR generation
```

## 🔄 Data Flow

### Outpass Request Flow

```
┌─────────┐
│ Student │
└────┬────┘
     │ 1. Create Outpass Request
     ▼
┌─────────────────┐
│   Frontend      │
│   Validation    │
└────┬────────────┘
     │ 2. POST /api/student/outpass
     ▼
┌─────────────────┐
│   API Layer     │
│   (Fastify)     │
└────┬────────────┘
     │ 3. Validate & Save
     ▼
┌─────────────────┐
│   MongoDB       │
└────┬────────────┘
     │ 4. Emit Socket Event
     ▼
┌─────────────────┐
│   Socket.io     │
└────┬────────────┘
     │ 5. Notify Warden
     ▼
┌─────────┐
│ Warden  │
└─────────┘
```

### Approval Flow

```
┌─────────┐
│ Warden  │
└────┬────┘
     │ 1. Review Request
     │ 2. Approve/Reject
     ▼
┌─────────────────┐
│   API Layer     │
└────┬────────────┘
     │ 3. Update Status
     │ 4. Generate QR Code (if approved)
     │ 5. Send Email
     ▼
┌─────────────────┐
│   MongoDB       │
└────┬────────────┘
     │ 6. Emit Socket Event
     ▼
┌─────────────────┐
│   Socket.io     │
└────┬────────────┘
     │ 7. Notify Student
     ▼
┌─────────┐
│ Student │
└─────────┘
```

### Check-in/Check-out Flow

```
┌──────────┐
│ Security │
└────┬─────┘
     │ 1. Scan QR Code
     ▼
┌─────────────────┐
│   QR Scanner    │
└────┬────────────┘
     │ 2. POST /api/security/verify
     ▼
┌─────────────────┐
│   API Layer     │
└────┬────────────┘
     │ 3. Verify Outpass
     │ 4. Update Status
     ▼
┌─────────────────┐
│   MongoDB       │
└────┬────────────┘
     │ 5. Emit Socket Event
     ▼
┌─────────────────┐
│   Socket.io     │
└────┬────────────┘
     │ 6. Notify Student & Warden
     ▼
┌─────────┐
│  Users  │
└─────────┘
```

## 🧩 Component Architecture

### Frontend Component Hierarchy

```
App
├── Router
│   ├── AuthLayout
│   │   ├── Login
│   │   └── Register
│   └── MainLayout
│       ├── Header
│       │   ├── Logo
│       │   ├── Notifications
│       │   └── UserMenu
│       ├── Sidebar
│       │   └── Navigation
│       └── Content
│           ├── Student Routes
│           │   ├── Dashboard
│           │   ├── CreateOutpass
│           │   ├── OutpassHistory
│           │   ├── OutpassDetails
│           │   └── Profile
│           ├── Warden Routes
│           │   ├── Dashboard
│           │   ├── PendingRequests
│           │   ├── AllOutpasses
│           │   ├── OutpassDetails
│           │   └── Profile
│           └── Security Routes
│               ├── Dashboard
│               ├── QRScanner
│               ├── ActivePasses
│               ├── History
│               └── Profile
└── Toaster (Global Notifications)
```

### Backend Module Structure

```
Backend
├── src/
│   ├── config/           # Configuration
│   ├── models/           # Database models
│   │   ├── User.ts
│   │   ├── Outpass.ts
│   │   └── Notification.ts
│   ├── routes/           # API routes
│   │   ├── auth.ts
│   │   ├── student.ts
│   │   ├── warden.ts
│   │   └── security.ts
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── outpass.service.ts
│   │   ├── email.service.ts
│   │   ├── pdf.service.ts
│   │   └── qr.service.ts
│   ├── middleware/       # Middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── utils/            # Utilities
│   └── socket/           # Socket.io handlers
└── index.ts              # Entry point
```

## 💾 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: Number, // 0: Student, 1: Admin, 2: Warden, 3: Security
  rollNumber: String (for students),
  department: String,
  hostel: String,
  roomNumber: String,
  phone: String,
  parentPhone: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Outpass Collection
```javascript
{
  _id: ObjectId,
  outpassNumber: String (unique, indexed),
  student: ObjectId (ref: User),
  type: String, // 'local', 'home', 'emergency'
  destination: String,
  fromDate: Date,
  toDate: Date,
  reason: String,
  status: String, // 'pending', 'approved', 'rejected', 'checked_out', 'checked_in', 'overdue', 'cancelled'
  warden: ObjectId (ref: User),
  wardenRemarks: String,
  approvedAt: Date,
  rejectedAt: Date,
  checkOutTime: Date,
  checkInTime: Date,
  qrCode: String,
  isOverdue: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- { student: 1, createdAt: -1 }
- { status: 1, createdAt: -1 }
- { outpassNumber: 1 }
- { qrCode: 1 }
```

### Notification Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  type: String, // 'outpass_approved', 'outpass_rejected', etc.
  title: String,
  message: String,
  read: Boolean,
  relatedOutpass: ObjectId (ref: Outpass),
  createdAt: Date
}

// Indexes
- { user: 1, createdAt: -1 }
- { user: 1, read: 1 }
```

## 🔌 API Architecture

### RESTful API Endpoints

#### Authentication
```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login user
POST   /api/auth/logout        # Logout user
GET    /api/auth/me            # Get current user
PUT    /api/auth/profile       # Update profile
```

#### Student Endpoints
```
POST   /api/student/outpass              # Create outpass
GET    /api/student/outpass              # Get my outpasses
GET    /api/student/outpass/:id          # Get outpass details
PATCH  /api/student/outpass/:id/cancel   # Cancel outpass
GET    /api/student/outpass/:id/pdf      # Download PDF
GET    /api/student/stats                # Get statistics
```

#### Warden Endpoints
```
GET    /api/warden/outpass/pending       # Get pending requests
GET    /api/warden/outpass               # Get all outpasses
GET    /api/warden/outpass/:id           # Get outpass details
PATCH  /api/warden/outpass/:id/approve   # Approve outpass
PATCH  /api/warden/outpass/:id/reject    # Reject outpass
GET    /api/warden/outpass/overdue       # Get overdue outpasses
GET    /api/warden/stats                 # Get statistics
```

#### Security Endpoints
```
POST   /api/security/verify              # Verify QR code
POST   /api/security/checkout/:id        # Check out student
POST   /api/security/checkin/:id         # Check in student
GET    /api/security/active              # Get active outpasses
GET    /api/security/history             # Get check-in/out history
GET    /api/security/stats               # Get statistics
```

#### Notification Endpoints
```
GET    /api/notifications                # Get notifications
GET    /api/notifications/unread         # Get unread count
PATCH  /api/notifications/:id/read       # Mark as read
PATCH  /api/notifications/read-all       # Mark all as read
DELETE /api/notifications/:id            # Delete notification
DELETE /api/notifications                # Delete all
```

### API Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🔄 Real-time Communication

### Socket.io Events

#### Client → Server
```javascript
// Connection
connect({ token })

// Notifications
notification:read({ notificationId })

// Health check
ping()
```

#### Server → Client
```javascript
// Connection events
connected({ userId, role })
disconnect({ reason })

// Notification events
notification:new({ notification })
notification:read({ notificationId })

// Outpass events
outpass:created({ outpass, studentId })
outpass:approved({ outpass, studentId, wardenId })
outpass:rejected({ outpass, studentId, wardenId, reason })
outpass:checked_out({ outpass, studentId, securityId })
outpass:checked_in({ outpass, studentId, securityId, isOverdue })
outpass:overdue({ outpass, studentId, wardenId })

// Dashboard updates
dashboard:update({ userId, stats })
stats:update({ userId, type, stats })

// System events
system:alert({ type, message, severity })
system:maintenance({ enabled, message })

// Health check
pong({ timestamp })
```

### Socket Connection Flow

```
Client                          Server
  │                               │
  │──── connect(token) ──────────▶│
  │                               │
  │◀──── connected(userData) ─────│
  │                               │
  │──── subscribe to events ─────▶│
  │                               │
  │◀──── event notifications ─────│
  │                               │
  │──── ping() ──────────────────▶│
  │                               │
  │◀──── pong(timestamp) ─────────│
  │                               │
```

## 🔒 Security Architecture

### Authentication Flow

```
1. User Login
   ├── Client sends credentials
   ├── Server validates credentials
   ├── Server generates JWT token
   │   ├── Payload: { userId, role, email }
   │   ├── Secret: ENV variable
   │   └── Expiry: 7 days
   └── Client stores token in localStorage

2. Authenticated Requests
   ├── Client includes token in Authorization header
   ├── Server validates token
   ├── Server extracts user info
   └── Server processes request

3. Token Refresh
   ├── Token expires after 7 days
   ├── User must re-login
   └── New token generated
```

### Authorization Levels

```
Role Hierarchy:
├── Student (role: 0)
│   ├── Create outpass
│   ├── View own outpasses
│   └── Cancel pending outpass
├── Warden (role: 2)
│   ├── View all outpasses
│   ├── Approve/reject requests
│   └── View analytics
└── Security (role: 3)
    ├── Verify QR codes
    ├── Check-in/check-out
    └── View active passes
```

### Security Measures

1. **Password Security**
   - Bcrypt hashing (10 rounds)
   - Minimum 8 characters
   - No plain text storage

2. **JWT Security**
   - Signed with secret key
   - Short expiration time
   - Stored in httpOnly cookies (recommended)

3. **API Security**
   - Rate limiting
   - CORS configuration
   - Input validation
   - SQL injection prevention (MongoDB)
   - XSS protection

4. **Data Security**
   - Encrypted sensitive data
   - Secure QR codes
   - HTTPS only in production

## 🚀 Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
│                      (Nginx/AWS)                         │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
    ┌────────▼────────┐          ┌────────▼────────┐
    │   Frontend      │          │   Backend       │
    │   (Vercel/      │          │   (Railway/     │
    │    Netlify)     │          │    Heroku)      │
    └─────────────────┘          └────────┬────────┘
                                          │
                                 ┌────────▼────────┐
                                 │   MongoDB       │
                                 │   (Atlas)       │
                                 └─────────────────┘
```

### Environment Configuration

#### Frontend (.env)
```env
VITE_API_URL=https://api.campuspass.com
VITE_SOCKET_URL=https://api.campuspass.com
```

#### Backend (.env)
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRE=7d
CORS_ORIGIN=https://campuspass.com
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

### Scaling Strategy

1. **Horizontal Scaling**
   - Multiple backend instances
   - Load balancer distribution
   - Session management with Redis

2. **Database Scaling**
   - MongoDB replica sets
   - Read replicas
   - Sharding for large datasets

3. **Caching**
   - Redis for session storage
   - CDN for static assets
   - API response caching

4. **Monitoring**
   - Application logs
   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring

## 📊 Performance Considerations

### Frontend Optimization
- Code splitting by route
- Lazy loading components
- Image optimization
- Bundle size optimization
- Service worker caching

### Backend Optimization
- Database indexing
- Query optimization
- Connection pooling
- Caching strategies
- Async operations

### Network Optimization
- Gzip compression
- HTTP/2
- CDN usage
- Minification
- Tree shaking

## 🔍 Monitoring & Logging

### Application Logs
```javascript
// Log levels
- ERROR: Critical errors
- WARN: Warning messages
- INFO: Informational messages
- DEBUG: Debug information
```

### Metrics to Monitor
- API response times
- Database query performance
- Socket connection count
- Error rates
- User activity
- System resources

## 📝 Conclusion

This architecture provides a scalable, secure, and maintainable foundation for the Campus-Pass system. The modular design allows for easy updates and feature additions while maintaining system stability and performance.