import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            Campus-Pass
          </h1>
          <p className="text-gray-600">
            Campus Outpass Management System
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>&copy; 2025 Campus-Pass. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

