import { Link } from 'react-router-dom';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <ShieldAlert className="text-red-600" size={100} />
        </div>
        <h1 className="text-6xl font-bold text-red-600">403</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">Access Denied</h2>
        <p className="text-gray-600 mt-2 mb-8 max-w-md mx-auto">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Home size={20} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

