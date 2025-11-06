import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import type { Outpass, OutpassFilters } from '../../types';
import { OutpassType } from '../../types';
import { Search, Filter, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PendingRequests = () => {
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<OutpassFilters>({
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOutpass, setSelectedOutpass] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingRequests();
  }, [filters]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await outpassService.getPendingRequests(filters);
      
      if (response.success && response.data) {
        setOutpasses(response.data.items);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages,
        });
      }
    } catch (error) {
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (outpassId: string, remarks?: string) => {
    if (!window.confirm('Are you sure you want to approve this outpass?')) {
      return;
    }

    setActionLoading(outpassId);
    try {
      const response = await outpassService.approveOutpass(outpassId, remarks);
      
      if (response.success) {
        toast.success('Outpass approved successfully!');
        fetchPendingRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve outpass');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (outpassId: string) => {
    setSelectedOutpass(outpassId);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedOutpass) return;

    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(selectedOutpass);
    try {
      const response = await outpassService.rejectOutpass(selectedOutpass, rejectReason);
      
      if (response.success) {
        toast.success('Outpass rejected');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedOutpass(null);
        fetchPendingRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject outpass');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (key: keyof OutpassFilters, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
      page: 1,
    });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
    });
  };

  if (loading && outpasses.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-900">Pending Requests</h1>
        <p className="text-gray-600 mt-1">Review and approve outpass requests</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Filter size={16} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search by student name or destination..."
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value={OutpassType.LOCAL}>Local</option>
                <option value={OutpassType.HOME}>Home</option>
                <option value={OutpassType.EMERGENCY}>Emergency</option>
                <option value={OutpassType.MEDICAL}>Medical</option>
                <option value={OutpassType.OTHER}>Other</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="md:col-span-2 flex justify-end">
              <button onClick={clearFilters} className="btn-secondary">
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing {outpasses.length} of {pagination.total} pending requests
        </p>
      </div>

      {/* Requests List */}
      {outpasses.length === 0 ? (
        <div className="card text-center py-12">
          <Clock className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-600">
            {filters.search || filters.type
              ? 'Try adjusting your filters'
              : 'All requests have been processed'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {outpasses.map((outpass) => {
            const student = typeof outpass.student === 'object' ? outpass.student : null;
            const isProcessing = actionLoading === outpass._id;

            return (
              <div key={outpass._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Outpass Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {student?.name || 'Unknown Student'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {student?.rollNumber} • {student?.department} • {student?.hostel}
                        </p>
                      </div>
                      <span className="badge-warning capitalize">{outpass.type}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Destination:</span>
                        <span className="ml-2 font-medium">{outpass.destination}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">From:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(outpass.fromDate), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">To:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(outpass.toDate), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Requested:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(outpass.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-sm text-gray-600">Reason:</span>
                      <p className="text-sm mt-1">{outpass.reason}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 md:min-w-[140px]">
                    <Link
                      to={`/warden/outpass/${outpass._id}`}
                      className="btn-secondary flex-1 md:flex-none inline-flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                    <button
                      onClick={() => handleApprove(outpass._id)}
                      disabled={isProcessing}
                      className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={16} />
                      {isProcessing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectClick(outpass._id)}
                      disabled={isProcessing}
                      className="flex-1 md:flex-none btn-danger inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reject Outpass</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this outpass request:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="input-field resize-none"
              placeholder="Enter rejection reason..."
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRejectSubmit}
                disabled={!!actionLoading}
                className="flex-1 btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedOutpass(null);
                }}
                disabled={!!actionLoading}
                className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequests;

