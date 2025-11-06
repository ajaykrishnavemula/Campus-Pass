import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import {
  Home,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  CheckSquare,
  Shield,
  QrCode,
  Activity
} from 'lucide-react';
import Notifications from '../components/Notifications';

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const { initialize } = useNotificationStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 0: // Student
        return [
          { name: 'Dashboard', path: '/student/dashboard', icon: Home },
          { name: 'Create Outpass', path: '/student/create-outpass', icon: FileText },
          { name: 'History', path: '/student/outpass-history', icon: Activity },
          { name: 'Profile', path: '/student/profile', icon: User },
        ];
      case 2: // Warden
        return [
          { name: 'Dashboard', path: '/warden/dashboard', icon: Home },
          { name: 'Pending Requests', path: '/warden/pending-requests', icon: CheckSquare },
          { name: 'All Outpasses', path: '/warden/all-outpasses', icon: FileText },
          { name: 'Profile', path: '/warden/profile', icon: User },
        ];
      case 3: // Security
        return [
          { name: 'Dashboard', path: '/security/dashboard', icon: Home },
          { name: 'QR Scanner', path: '/security/qr-scanner', icon: QrCode },
          { name: 'Active Passes', path: '/security/active-passes', icon: Shield },
          { name: 'Profile', path: '/security/profile', icon: User },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="ml-2 text-2xl font-bold text-primary-600">
                Campus-Pass
              </h1>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications Component */}
              <Notifications />

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 0 ? 'Student' : user?.role === 2 ? 'Warden' : 'Security'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            mt-16 lg:mt-0
          `}
        >
          <nav className="h-full overflow-y-auto py-6 px-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

