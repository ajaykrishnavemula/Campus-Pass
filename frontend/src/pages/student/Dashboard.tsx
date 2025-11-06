import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import type { StudentStats, Outpass } from '../../types';
import { FileText, CheckCircle, XCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recentOutpasses, setRecentOutpasses] = useState<Outpass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, outpassesResponse] = await Promise.all([
        outpassService.getStudentStats(),
        outpassService.getMyOutpasses({ limit: 5 }),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (outpassesResponse.success && outpassesResponse.data) {
        setRecentOutpasses(outpassesResponse.data.items);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      checked_out: 'badge-info',
      checked_in: 'badge-success',
      overdue: 'badge-danger',
    };
    return badges[status] || 'badge';
  };

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/student/create-outpass" className="btn-primary inline-flex items-center gap-2">
          <Plus size={20} />
          Create Outpass
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Outpasses</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalOutpasses || 0}</p>
            </div>
            <FileText className="text-primary-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.pendingOutpasses || 0}</p>
            </div>
            <Clock className="text-yellow-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats?.approvedOutpasses || 0}</p>
            </div>
            <CheckCircle className="text-green-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats?.rejectedOutpasses || 0}</p>
            </div>
            <XCircle className="text-red-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.activeOutpasses || 0}</p>
            </div>
            <FileText className="text-blue-600" size={40} />
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

      {/* Recent Outpasses */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Outpasses</h2>
          <Link to="/student/outpass-history" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>

        {recentOutpasses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto mb-2" size={48} />
            <p>No outpasses yet</p>
            <Link to="/student/create-outpass" className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block">
              Create your first outpass
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outpass Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOutpasses.map((outpass) => (
                  <tr key={outpass._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {outpass.outpassNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {outpass.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {outpass.destination}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`${getStatusBadge(outpass.status)} capitalize`}>
                        {outpass.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(outpass.fromDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/student/outpass/${outpass._id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

