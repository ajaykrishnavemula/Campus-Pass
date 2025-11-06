import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import type { WardenStats, Outpass } from '../../types';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const WardenDashboard = () => {
  const [stats, setStats] = useState<WardenStats | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Outpass[]>([]);
  const [overdueOutpasses, setOverdueOutpasses] = useState<Outpass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, pendingResponse, overdueResponse] = await Promise.all([
        outpassService.getWardenStats(),
        outpassService.getPendingRequests({ limit: 5 }),
        outpassService.getOverdueOutpasses(),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (pendingResponse.success && pendingResponse.data) {
        setPendingRequests(pendingResponse.data.items);
      }

      if (overdueResponse.success && overdueResponse.data) {
        setOverdueOutpasses(overdueResponse.data.slice(0, 5));
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Unused function - kept for future use
  // const getStatusBadge = (status: string) => {
  //   const badges: Record<string, string> = {
  //     pending: 'badge-warning',
  //     approved: 'badge-success',
  //     rejected: 'badge-danger',
  //     checked_out: 'badge-info',
  //     checked_in: 'badge-success',
  //     overdue: 'badge-danger',
  //   };
  //   return badges[status] || 'badge';
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Warden Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage and monitor outpass requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalRequests || 0}</p>
            </div>
            <FileText className="text-primary-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.pendingRequests || 0}</p>
            </div>
            <Clock className="text-yellow-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved Today</p>
              <p className="text-3xl font-bold text-green-600">{stats?.approvedToday || 0}</p>
            </div>
            <CheckCircle className="text-green-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected Today</p>
              <p className="text-3xl font-bold text-red-600">{stats?.rejectedToday || 0}</p>
            </div>
            <XCircle className="text-red-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Outpasses</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.activeOutpasses || 0}</p>
            </div>
            <Users className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-3xl font-bold text-red-600">{stats?.overdueOutpasses || 0}</p>
            </div>
            <AlertCircle className="text-red-600" size={40} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/warden/pending-requests"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.pendingRequests || 0} requests waiting for approval
              </p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </Link>

        <Link
          to="/warden/all-outpasses"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">All Outpasses</h3>
              <p className="text-sm text-gray-600 mt-1">
                View and manage all outpass requests
              </p>
            </div>
            <FileText className="text-primary-600" size={32} />
          </div>
        </Link>
      </div>

      {/* Pending Requests */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Pending Requests</h2>
          <Link 
            to="/warden/pending-requests" 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto mb-2" size={48} />
            <p>No pending requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((outpass) => {
                  const student = typeof outpass.student === 'object' ? outpass.student : null;
                  return (
                    <tr key={outpass._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {outpass.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {outpass.destination}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(outpass.fromDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/warden/outpass/${outpass._id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overdue Outpasses */}
      {overdueOutpasses.length > 0 && (
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-600" size={24} />
            <h2 className="text-xl font-semibold text-red-900">Overdue Outpasses</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-red-200">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                    Expected Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-red-200">
                {overdueOutpasses.map((outpass) => {
                  const student = typeof outpass.student === 'object' ? outpass.student : null;
                  return (
                    <tr key={outpass._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {outpass.destination}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(outpass.toDate), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge-danger">Overdue</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/warden/outpass/${outpass._id}`}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardenDashboard;

