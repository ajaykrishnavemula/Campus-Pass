# Campus-Pass Backend

A comprehensive campus outpass management system backend built with Node.js, Fastify, MongoDB, and Socket.io.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Outpass Management**: Complete CRUD operations for outpass requests
- **Real-time Updates**: Socket.io integration for live notifications
- **Email Notifications**: Automated email alerts for outpass events
- **PDF Generation**: Generate printable outpass documents with QR codes
- **QR Code Verification**: Secure QR code generation and validation
- **Role-Based Access**: Student, Warden, Security, and Admin roles
- **Statistics Dashboard**: Comprehensive analytics for all user roles

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Full-Stack/Campus-Pass/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/campuspass

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Campus-Pass <noreply@campuspass.com>
```

4. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your local MongoDB installation
mongod
```

5. **Run the server**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # MongoDB connection
│   │   └── index.ts      # Config exports
│   ├── middleware/       # Express/Fastify middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/           # Mongoose models
│   │   ├── User.ts
│   │   ├── Outpass.ts
│   │   ├── Notification.ts
│   │   └── index.ts
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   ├── outpass.routes.ts
│   │   ├── notification.routes.ts
│   │   └── index.ts
│   ├── services/         # Business logic
│   │   ├── AuthService.ts
│   │   ├── OutpassService.ts
│   │   ├── NotificationService.ts
│   │   ├── EmailService.ts
│   │   ├── PDFService.ts
│   │   ├── QRService.ts
│   │   ├── SocketService.ts
│   │   └── index.ts
│   └── index.ts          # Application entry point
├── .env.example          # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/users` - Get all users (Admin)
- `GET /api/auth/students/:hostel` - Get students by hostel (Warden)

### Outpasses
- `POST /api/outpasses` - Create outpass (Student)
- `GET /api/outpasses` - Get student's outpasses
- `GET /api/outpasses/pending` - Get pending outpasses (Warden)
- `GET /api/outpasses/all` - Get all outpasses (Warden/Security)
- `GET /api/outpasses/active` - Get active outpasses (Security)
- `GET /api/outpasses/stats` - Get student statistics
- `GET /api/outpasses/stats/warden` - Get warden statistics
- `GET /api/outpasses/stats/security` - Get security statistics
- `GET /api/outpasses/:id` - Get outpass by ID
- `POST /api/outpasses/:id/approve` - Approve outpass (Warden)
- `POST /api/outpasses/:id/reject` - Reject outpass (Warden)
- `POST /api/outpasses/:id/cancel` - Cancel outpass (Student)
- `POST /api/outpasses/:id/checkout` - Check out student (Security)
- `POST /api/outpasses/:id/checkin` - Check in student (Security)
- `GET /api/outpasses/:id/pdf` - Download outpass PDF
- `POST /api/outpasses/verify-qr` - Verify QR code (Security)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `GET /api/notifications/:id` - Get notification by ID
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/read` - Delete all read

## 🔐 User Roles

- **Student (0)**: Create and manage own outpasses
- **Admin (1)**: Full system access
- **Warden (2)**: Approve/reject outpasses for their hostel
- **Security (3)**: Check-in/out students, verify QR codes

## 🌐 Socket.io Events

### Client → Server
- `ping` - Health check

### Server → Client
- `pong` - Health check response
- `outpass:created` - New outpass created
- `outpass:approved` - Outpass approved
- `outpass:rejected` - Outpass rejected
- `outpass:checked_out` - Student checked out
- `outpass:checked_in` - Student checked in
- `outpass:overdue` - Outpass overdue
- `notification:new` - New notification
- `notification:unread_count` - Unread count update
- `system:alert` - System-wide alert

## 📧 Email Templates

The system sends automated emails for:
- Welcome (user registration)
- Outpass approved
- Outpass rejected
- Outpass overdue
- Password changed

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚢 Deployment

### Using Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables
4. Deploy

### Using Docker

```bash
# Build image
docker build -t campuspass-backend .

# Run container
docker run -p 3000:3000 --env-file .env campuspass-backend
```

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment | No | `development` |
| `PORT` | Server port | No | `3000` |
| `HOST` | Server host | No | `0.0.0.0` |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT secret key | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | `7d` |
| `SMTP_HOST` | SMTP server host | No | - |
| `SMTP_PORT` | SMTP server port | No | - |
| `SMTP_USER` | SMTP username | No | - |
| `SMTP_PASS` | SMTP password | No | - |
| `SMTP_FROM` | Email sender | No | - |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

- Ajay Krishna Vemula

## 🐛 Known Issues

None at the moment. Please report issues on GitHub.

## 📞 Support

For support, email ajaykrishnatech@gmail.com or open an issue on GitHub.