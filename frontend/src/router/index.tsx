import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Student Pages
import StudentDashboard from '../pages/student/Dashboard';
import CreateOutpass from '../pages/student/CreateOutpass';
import OutpassHistory from '../pages/student/OutpassHistory';
import OutpassDetails from '../pages/student/OutpassDetails';
import StudentProfile from '../pages/student/Profile';

// Warden Pages
import WardenDashboard from '../pages/warden/Dashboard';
import PendingRequests from '../pages/warden/PendingRequests';
import AllOutpasses from '../pages/warden/AllOutpasses';
import WardenProfile from '../pages/warden/Profile';

// Security Pages
import SecurityDashboard from '../pages/security/Dashboard';
import QRScanner from '../pages/security/QRScanner';
import ActivePasses from '../pages/security/ActivePasses';
import SecurityProfile from '../pages/security/Profile';

// Common Pages
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: number[] 
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 0: // Student
        return <Navigate to="/student/dashboard" replace />;
      case 2: // Warden
        return <Navigate to="/warden/dashboard" replace />;
      case 3: // Security
        return <Navigate to="/security/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <AuthLayout>
          <Login />
        </AuthLayout>
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <AuthLayout>
          <Register />
        </AuthLayout>
      </PublicRoute>
    ),
  },
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={[0]}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <StudentDashboard />,
      },
      {
        path: 'create-outpass',
        element: <CreateOutpass />,
      },
      {
        path: 'outpass-history',
        element: <OutpassHistory />,
      },
      {
        path: 'outpass/:id',
        element: <OutpassDetails />,
      },
      {
        path: 'profile',
        element: <StudentProfile />,
      },
    ],
  },
  {
    path: '/warden',
    element: (
      <ProtectedRoute allowedRoles={[2]}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <WardenDashboard />,
      },
      {
        path: 'pending-requests',
        element: <PendingRequests />,
      },
      {
        path: 'all-outpasses',
        element: <AllOutpasses />,
      },
      {
        path: 'outpass/:id',
        element: <OutpassDetails />,
      },
      {
        path: 'profile',
        element: <WardenProfile />,
      },
    ],
  },
  {
    path: '/security',
    element: (
      <ProtectedRoute allowedRoles={[3]}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <SecurityDashboard />,
      },
      {
        path: 'qr-scanner',
        element: <QRScanner />,
      },
      {
        path: 'active-passes',
        element: <ActivePasses />,
      },
      {
        path: 'outpass/:id',
        element: <OutpassDetails />,
      },
      {
        path: 'profile',
        element: <SecurityProfile />,
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);


