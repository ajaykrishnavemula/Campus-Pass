import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import type { Outpass, SecurityStats } from '../../types';
import { 
  QrCode, 
  LogIn, 
  LogOut, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState<SecurityStats>({
    totalCheckOuts: 0,
    totalCheckIns: 0,
    activeOutpasses: 0,
    overdueOutpasses: 0,
    checkOutsToday: 0,
    checkInsToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Outpass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await outpassService.getSecurityStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Fetch recent activity (checked out/in today)
      const activityResponse = await outpassService.getRecentActivity();
      if (activityResponse.success && activityResponse.data) {
        setRecentActivity(activityResponse.data.items.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor and manage student check-ins and check-outs</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today's Check-outs */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Today's Check-outs</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats.checkOutsToday}</p>
              <p className="text-xs text-blue-600 mt-1">Students left campus</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <LogOut className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Today's Check-ins */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Today's Check-ins</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats.checkInsToday}</p>
              <p className="text-xs text-green-600 mt-1">Students returned</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <LogIn className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Active Outpasses */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Active Outpasses</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{stats.activeOutpasses}</p>
              <p className="text-xs text-purple-600 mt-1">Currently outside</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Check-outs */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Check-outs</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalCheckOuts}</p>
            </div>
            <TrendingUp className="text-gray-400" size={24} />
          </div>
        </div>

        {/* Total Check-ins */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Check-ins</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalCheckIns}</p>
            </div>
            <CheckCircle className="text-gray-400" size={24} />
          </div>
        </div>

        {/* Overdue Outpasses */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Overdue Outpasses</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{stats.overdueOutpasses}</p>
              <p className="text-xs text-red-600 mt-1">Require attention</p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/security/scan-qr"
            className="flex items-center gap-4 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
          >
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <QrCode className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Scan QR Code</h3>
              <p className="text-sm text-gray-600">Check-out or check-in students</p>
            </div>
          </Link>

          <Link
            to="/security/active-outpasses"
            className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Active Outpasses</h3>
              <p className="text-sm text-gray-600">View students currently outside</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <Link to="/security/history" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((outpass) => {
              const student = typeof outpass.student === 'object' ? outpass.student : null;
              // const hasCheckedOut = !!outpass.checkOutTime;
              const hasCheckedIn = !!outpass.checkInTime;

              return (
                <div
                  key={outpass._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      hasCheckedIn ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {hasCheckedIn ? (
                        <LogIn className="text-green-600" size={20} />
                      ) : (
                        <LogOut className="text-blue-600" size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">
                        {student?.rollNumber} • {outpass.destination}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {hasCheckedIn ? 'Checked In' : 'Checked Out'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {format(
                        new Date(hasCheckedIn ? outpass.checkInTime! : outpass.checkOutTime!),
                        'hh:mm a'
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overdue Alert */}
      {stats.overdueOutpasses > 0 && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Overdue Outpasses Alert</h3>
              <p className="text-sm text-red-700 mb-3">
                There are {stats.overdueOutpasses} overdue outpass{stats.overdueOutpasses > 1 ? 'es' : ''} that require immediate attention.
              </p>
              <Link
                to="/security/active-outpasses?filter=overdue"
                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                View Overdue Outpasses
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

