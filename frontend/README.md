# Campus-Pass Frontend

A modern, responsive web application for managing student outpass requests in educational institutions. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Student Portal
- **Dashboard**: View outpass statistics and recent activity
- **Create Outpass**: Submit new outpass requests with destination, dates, and reason
- **Outpass History**: Track all outpass requests with status updates
- **QR Code Display**: View and download QR codes for approved outpasses
- **Real-time Notifications**: Receive instant updates on outpass status changes
- **Profile Management**: Update personal information and view account details

### Warden Portal
- **Dashboard**: Overview of pending requests and statistics
- **Pending Requests**: Review and approve/reject student outpass requests
- **All Outpasses**: View complete history of all outpass requests
- **Analytics**: Track outpass trends and patterns
- **Bulk Actions**: Approve or reject multiple requests at once
- **Profile Management**: Manage warden account settings

### Security Portal
- **Dashboard**: View active outpasses and recent check-ins/outs
- **QR Scanner**: Scan student QR codes for check-in/check-out
- **Manual Entry**: Enter outpass numbers manually for verification
- **Active Passes**: Monitor currently active outpasses
- **History**: View check-in/check-out history
- **Profile Management**: Update security personnel information

## 🛠️ Tech Stack

- **Framework**: React 19.1.1
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Styling**: Tailwind CSS 4.1.16
- **State Management**: Zustand 5.0.8
- **Routing**: React Router DOM 7.9.5
- **HTTP Client**: Axios 1.13.2
- **Real-time**: Socket.io Client 4.8.1
- **QR Code**: 
  - qrcode.react 4.2.0 (Display)
  - html5-qrcode 2.3.8 (Scanner)
- **Form Handling**: React Hook Form 7.66.0
- **Validation**: Zod 4.1.12
- **Date Handling**: date-fns 4.1.0
- **Notifications**: React Hot Toast 2.6.0
- **Icons**: Lucide React 0.552.0

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running (see backend README)

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Full-Stack/Campus-Pass/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

### Preview

Preview the production build:
```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── common/      # Common UI components
│   │   └── Notifications.tsx
│   ├── layouts/         # Layout components
│   │   ├── AuthLayout.tsx
│   │   └── MainLayout.tsx
│   ├── pages/           # Page components
│   │   ├── auth/        # Authentication pages
│   │   ├── student/     # Student portal pages
│   │   ├── warden/      # Warden portal pages
│   │   └── security/    # Security portal pages
│   ├── router/          # Routing configuration
│   ├── services/        # API and service layer
│   │   ├── api.ts       # Axios instance
│   │   ├── auth.service.ts
│   │   ├── outpass.service.ts
│   │   ├── notification.service.ts
│   │   └── socket.service.ts
│   ├── store/           # State management (Zustand)
│   │   ├── authStore.ts
│   │   └── notificationStore.ts
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

## 🔐 Authentication

The application uses JWT-based authentication with role-based access control:

- **Student** (role: 0)
- **Admin** (role: 1)
- **Warden** (role: 2)
- **Security** (role: 3)

### Login Flow

1. User enters credentials
2. Backend validates and returns JWT token
3. Token stored in localStorage
4. Socket.io connection established with token
5. User redirected to role-specific dashboard

### Protected Routes

All routes except `/login` and `/register` are protected and require authentication. Role-based guards ensure users can only access routes for their role.

## 🔔 Real-time Features

### Socket.io Events

**Notification Events:**
- `notification:new` - New notification received
- `notification:read` - Notification marked as read

**Outpass Events:**
- `outpass:created` - New outpass created
- `outpass:approved` - Outpass approved by warden
- `outpass:rejected` - Outpass rejected by warden
- `outpass:checked_out` - Student checked out
- `outpass:checked_in` - Student checked in
- `outpass:overdue` - Outpass is overdue

**System Events:**
- `system:alert` - System-wide alerts
- `system:maintenance` - Maintenance notifications

## 📱 QR Code Features

### QR Code Generation
- Automatically generated when outpass is approved
- Contains encrypted outpass information
- Displayed on outpass details page
- Downloadable as PNG image

### QR Code Scanning
- Camera-based scanning using html5-qrcode
- Manual entry fallback option
- Real-time verification with backend
- Instant check-in/check-out processing

## 🎨 UI Components

### Common Components
- **Button**: Customizable button with variants (primary, secondary, danger)
- **Input**: Form input with validation support
- **Card**: Container component for content sections
- **Modal**: Overlay dialog for confirmations and forms
- **Alert**: Notification banners for messages
- **Loading**: Loading spinner and skeleton screens
- **Badge**: Status indicators and labels

### Form Validation
Forms use React Hook Form with Zod schema validation:
```typescript
const schema = z.object({
  destination: z.string().min(3, 'Destination is required'),
  fromDate: z.string(),
  toDate: z.string(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});
```

## 🔄 State Management

### Auth Store (Zustand)
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  // ...
}
```

### Notification Store (Zustand)
```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  // ...
}
```

## 🌐 API Integration

### API Service Layer
All API calls go through a centralized service layer with:
- Automatic token injection
- Request/response interceptors
- Error handling
- Type safety

Example:
```typescript
// Get student outpasses
const response = await outpassService.getMyOutpasses({
  status: 'approved',
  page: 1,
  limit: 10
});
```

## 🎯 Best Practices

1. **Type Safety**: Full TypeScript coverage with strict mode
2. **Component Reusability**: Modular, reusable components
3. **Error Handling**: Comprehensive error handling with user feedback
4. **Loading States**: Loading indicators for async operations
5. **Responsive Design**: Mobile-first responsive design
6. **Accessibility**: ARIA labels and keyboard navigation
7. **Code Organization**: Clear separation of concerns
8. **Performance**: Lazy loading and code splitting

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Netlify
```bash
netlify deploy --prod
```

### Environment Variables
Ensure all environment variables are set in your deployment platform:
- `VITE_API_URL`
- `VITE_SOCKET_URL`

## 📊 Performance Optimization

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Optimized images and icons
- **Bundle Size**: Minimized bundle size with tree shaking
- **Caching**: Service worker for offline support

## 🐛 Troubleshooting

### Common Issues

**Socket connection fails:**
- Check if backend is running
- Verify VITE_SOCKET_URL is correct
- Check browser console for errors

**QR Scanner not working:**
- Ensure HTTPS or localhost
- Grant camera permissions
- Check browser compatibility

**Build fails:**
- Clear node_modules and reinstall
- Check Node.js version (18+)
- Verify all dependencies are installed

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributors

- Development Team

## 📞 Support

For support, email support@campuspass.com or open an issue in the repository.
