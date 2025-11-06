<div align="center">

# 🎓 CampusPass

### 🏫 Digital Outpass Management System for Educational Institutions

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)](https://socket.io/)

🏫 **Digital outpass management** • 📱 **Real-time notifications** • 🔐 **QR code verification** • 📊 **Analytics dashboard**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Documentation](#-documentation) • [Tech Stack](#-tech-stack)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 👨‍🎓 Student Portal
- 📝 Create outpass requests
- 📜 View outpass history
- 🔔 Real-time notifications
- 📱 Download QR codes
- 📄 Generate PDF passes
- 📊 Track request status

</td>
<td width="50%">

### 👨‍🏫 Warden Portal
- ✅ Approve/reject requests
- 📋 View all outpasses
- ⏰ Monitor overdue returns
- 📊 Analytics dashboard
- 👥 Student management
- 📧 Email notifications

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Security Portal
- 📷 Scan QR codes
- ✔️ Verify outpasses
- 🚪 Check-in/check-out
- 📱 Active outpass list
- ⚡ Real-time updates
- 📊 Activity monitoring

</td>
<td width="50%">

### 🎯 Admin Features
- 👥 User management
- 🏢 Hostel configuration
- 📊 System analytics
- 🔧 Settings control
- 📈 Reports generation
- 🔒 Security settings

</td>
</tr>
</table>

---

## 🎬 Demo

<div align="center">

### 🖥️ Screenshots

| Student Dashboard | Warden Approval | Security Scanner |
|:-----------------:|:---------------:|:----------------:|
| ![Student](https://via.placeholder.com/250x150/4CAF50/FFFFFF?text=Student+Portal) | ![Warden](https://via.placeholder.com/250x150/2196F3/FFFFFF?text=Warden+Portal) | ![Security](https://via.placeholder.com/250x150/FF9800/FFFFFF?text=Security+Portal) |

</div>

---

## 🚀 Quick Start

### 📋 Prerequisites

```bash
Node.js 18+  ✅
MongoDB 6+   ✅
npm/yarn     ✅
```

### ⚡ Installation

```bash
# 1️⃣ Clone the repository
git clone https://github.com/yourusername/campus-pass.git
cd campus-pass

# 2️⃣ Setup Backend
cd backend
npm install
cp .env.example .env
npm run dev

# 3️⃣ Setup Frontend
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

### 🌐 Access Application

- 🎨 **Frontend**: http://localhost:5174
- ⚙️ **Backend API**: http://localhost:3000
- 📚 **API Docs**: http://localhost:3000/docs

---

## 💻 Tech Stack

<div align="center">

### Backend 🔧

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)

### Frontend 🎨

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-000000?style=for-the-badge&logo=react&logoColor=white)

</div>

---

## 📁 Project Structure

```
🎓 CampusPass/
├── 📂 backend/                 # Backend API
│   ├── 📂 src/
│   │   ├── ⚙️ config/         # Configuration
│   │   ├── 🗄️ models/         # Database models
│   │   ├── 🛣️ routes/         # API routes
│   │   ├── 🎮 controllers/    # Controllers
│   │   ├── 💼 services/       # Business logic
│   │   ├── 🔒 middleware/     # Middleware
│   │   ├── 🔌 socket/         # Socket.io
│   │   └── 🛠️ utils/          # Utilities
│   └── 📦 package.json
│
├── 📂 frontend/               # React Frontend
│   ├── 📂 src/
│   │   ├── 🧩 components/    # Components
│   │   ├── 📄 pages/         # Pages
│   │   ├── 🛣️ router/        # Routing
│   │   ├── 🌐 services/      # API services
│   │   ├── 💾 store/         # State management
│   │   └── 📝 types/         # TypeScript types
│   └── 📦 package.json
│
├── 📚 ARCHITECTURE.md         # Architecture docs
├── 📖 API_REFERENCE.md        # API documentation
├── 🚀 DEPLOYMENT_GUIDE.md     # Deployment guide
├── 🧪 TESTING_GUIDE.md        # Testing guide
└── 📄 README.md               # This file
```

---

## 🎯 Key Features in Detail

### 🔐 Authentication & Security
- 🔑 JWT-based authentication
- 🛡️ Role-based access control (RBAC)
- 🔒 Bcrypt password hashing
- 🚫 Rate limiting & CORS
- ✅ Input validation & sanitization

### 📱 Real-time Communication
- ⚡ Socket.io integration
- 🔔 Instant notifications
- 📊 Live dashboard updates
- 🔄 Auto-refresh data
- 💬 Real-time status changes

### 📷 QR Code System
- 🎯 Auto QR generation
- 📸 Camera scanning
- ⌨️ Manual entry fallback
- ✅ Secure verification
- 📱 Mobile-friendly

### 📊 Analytics & Reports
- 📈 Statistical dashboards
- 📉 Trend analysis
- 📅 Date range filters
- 📥 Export capabilities
- 📊 Visual charts

---

## 🧪 Testing

```bash
# 🔬 Run backend tests
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# 🎨 Run frontend tests
cd frontend
npm test                    # Run all tests
npm run test:ui            # UI mode
npm run test:e2e           # E2E tests
```

### 📊 Test Coverage

- ✅ **Backend**: 80%+ coverage
- ✅ **Frontend**: 70%+ coverage
- ✅ **E2E Tests**: Critical flows
- ✅ **200+ Test Cases**

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| 📐 [Architecture](./ARCHITECTURE.md) | System design & architecture |
| 🔌 [API Reference](./API_REFERENCE.md) | Complete API documentation |
| 🚀 [Deployment](./DEPLOYMENT_GUIDE.md) | Production deployment guide |
| 🧪 [Testing](./TESTING_GUIDE.md) | Testing guide & best practices |

---

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation (Zod)
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Secure headers

---

## 🚀 Deployment

### 🌐 Deployment Options

- ☁️ **Backend**: Railway, Heroku, AWS
- 🎨 **Frontend**: Vercel, Netlify, AWS S3
- 🗄️ **Database**: MongoDB Atlas, AWS DocumentDB

### 📦 Build for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

---

## 🤝 Contributing

We welcome contributions! 🎉

1. 🍴 Fork the repository
2. 🌿 Create feature branch (`git checkout -b feature/amazing`)
3. 💾 Commit changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to branch (`git push origin feature/amazing`)
5. 🔀 Open Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- 🌐 Website: [yourwebsite.com](https://yourwebsite.com)
- 💼 LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- 🐙 GitHub: [@yourusername](https://github.com/yourusername)
- 📧 Email: your.email@example.com

---

## 🙏 Acknowledgments

- 💙 React Team for the amazing framework
- ⚡ Fastify Team for the fast web framework
- 🍃 MongoDB Team for the database
- 🔌 Socket.io Team for real-time magic
- 🎨 Tailwind CSS for beautiful styling

---

## 📈 Project Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/campus-pass?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/campus-pass?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/campus-pass)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/campus-pass)

---

<div align="center">

### 🌟 Star this repo if you find it helpful!

**Made with ❤️ and ☕**

**Version**: 1.0.0 | **Status**: ✅ Production Ready

[⬆ Back to Top](#-campuspass)

</div>