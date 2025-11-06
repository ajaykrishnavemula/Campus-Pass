# Campus-Pass Backend - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB 6+ installed and running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
cd Full-Stack/Campus-Pass/backend
npm install
```

This will install all 765 required packages including:
- Fastify and plugins
- MongoDB and Mongoose
- TypeScript
- Validation libraries
- Email and PDF generation tools
- And more...

### 2. Environment Setup

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/campuspass

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Campus-Pass <noreply@campuspass.com>

# QR Code Secret (CHANGE THIS!)
QR_CODE_SECRET=your-qr-code-secret-key

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# macOS (if installed via Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Build TypeScript

```bash
npm run build
```

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## Verify Installation

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Campus-Pass API is running",
  "timestamp": "2025-11-05T18:00:00.000Z"
}
```

### Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "Password123",
    "name": "John Doe",
    "role": 0,
    "phone": "+1234567890",
    "rollNumber": "CS2021001",
    "department": "Computer Science",
    "year": 3,
    "hostel": "Hostel A",
    "roomNumber": "101",
    "parentPhone": "+1234567891",
    "gender": "male"
  }'
```

## Available Scripts

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "lint": "eslint src --ext .ts",
  "format": "prettier --write \"src/**/*.ts\""
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - Logout

### Student
- `POST /api/student/outpasses` - Create outpass
- `GET /api/student/outpasses` - Get my outpasses
- `GET /api/student/outpasses/:id` - Get outpass details
- `PUT /api/student/outpasses/:id` - Update outpass
- `DELETE /api/student/outpasses/:id` - Cancel outpass
- `GET /api/student/outpasses/:id/download` - Download PDF
- `GET /api/student/profile` - Get profile
- `PUT /api/student/profile` - Update profile
- `GET /api/student/stats` - Get statistics

### Warden
- `GET /api/warden/dashboard` - Dashboard stats
- `GET /api/warden/outpasses/pending` - Pending requests
- `GET /api/warden/outpasses` - All outpasses
- `GET /api/warden/outpasses/:id` - Outpass details
- `POST /api/warden/outpasses/:id/approve` - Approve outpass
- `POST /api/warden/outpasses/:id/reject` - Reject outpass
- `GET /api/warden/students` - Get students
- `GET /api/warden/students/:id` - Student details
- `PUT /api/warden/students/:id/status` - Update student status
- `GET /api/warden/analytics` - Analytics
- `GET /api/warden/profile` - Get profile
- `PUT /api/warden/profile` - Update profile

### Security
- `POST /api/security/scan` - Scan QR code
- `POST /api/security/check-out` - Check out student
- `POST /api/security/check-in` - Check in student
- `GET /api/security/active-passes` - Active passes
- `GET /api/security/overdue-passes` - Overdue passes
- `GET /api/security/logs` - Security logs
- `GET /api/security/profile` - Get profile
- `PUT /api/security/profile` - Update profile

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications` - Delete all

## User Roles

- **0** - Student
- **1** - Admin
- **2** - Warden
- **3** - Security

## Troubleshooting

### MongoDB Connection Error
```
Error: Failed to connect to MongoDB
```
**Solution**: Ensure MongoDB is running and the connection string in `.env` is correct.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Change the PORT in `.env` or kill the process using port 3000.

### JWT Secret Error
```
Error: JWT secret is required
```
**Solution**: Set JWT_SECRET in `.env` file.

### Email Sending Fails
```
Error: Invalid login credentials
```
**Solution**: 
- For Gmail, enable "Less secure app access" or use App Password
- Verify EMAIL_USER and EMAIL_PASSWORD in `.env`

## Development Tips

### Watch Mode
The `npm run dev` command uses `tsx watch` which automatically restarts the server when you make changes.

### Logging
Logs are written to:
- Console (colored output)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

### Database Inspection
Use MongoDB Compass or mongosh to inspect the database:
```bash
mongosh mongodb://localhost:27017/campuspass
```

### API Testing
Use tools like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)
- curl

## Next Steps

1. ✅ Backend is running
2. ⏳ Implement Socket.io for real-time features
3. ⏳ Set up frontend React application
4. ⏳ Connect frontend to backend
5. ⏳ Test complete workflow
6. ⏳ Deploy to production

## Support

For issues or questions:
- Check the logs in `logs/` directory
- Review the API documentation
- Check MongoDB connection
- Verify environment variables

---

**Status**: Backend Core Complete ✅
**Version**: 1.0.0
**Last Updated**: 2025-11-05