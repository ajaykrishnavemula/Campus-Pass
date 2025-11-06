import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import type { Outpass, OutpassFilters } from '../../types';
import { OutpassStatus, OutpassType } from '../../types';
import { Search, Filter, ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OutpassHistory = () => {
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchOutpasses();
  }, [filters]);

  const fetchOutpasses = async () => {
    try {
      setLoading(true);
      const response = await outpassService.getMyOutpasses(filters);
      
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
      toast.error('Failed to load outpass history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof OutpassFilters, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({
      ...filters,
      page: newPage,
    });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      checked_out: 'badge-info',
      checked_in: 'badge-success',
      overdue: 'badge-danger',
      cancelled: 'badge',
    };
    return badges[status] || 'badge';
  };

  const handleDownloadPDF = async (outpassId: string) => {
    try {
      await outpassService.downloadOutpassPDF(outpassId);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outpass History</h1>
          <p className="text-gray-600 mt-1">View and manage your outpass requests</p>
        </div>
        <Link to="/student/create-outpass" className="btn-primary">
          Create New Outpass
        </Link>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
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
                  placeholder="Search by destination..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value={OutpassStatus.PENDING}>Pending</option>
                <option value={OutpassStatus.APPROVED}>Approved</option>
                <option value={OutpassStatus.REJECTED}>Rejected</option>
                <option value={OutpassStatus.CHECKED_OUT}>Checked Out</option>
                <option value={OutpassStatus.CHECKED_IN}>Checked In</option>
                <option value={OutpassStatus.OVERDUE}>Overdue</option>
                <option value={OutpassStatus.CANCELLED}>Cancelled</option>
              </select>
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
            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing {outpasses.length} of {pagination.total} outpasses
        </p>
        <p>
          Page {pagination.page} of {pagination.totalPages}
        </p>
      </div>

      {/* Outpass List */}
      {outpasses.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No outpasses found</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.status || filters.type
              ? 'Try adjusting your filters'
              : "You haven't created any outpass requests yet"}
          </p>
          <Link to="/student/create-outpass" className="btn-primary inline-block">
            Create Your First Outpass
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
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
                    From Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outpasses.map((outpass) => (
                  <tr key={outpass._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {outpass.outpassNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {outpass.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {outpass.destination}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(outpass.fromDate), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(outpass.toDate), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`${getStatusBadge(outpass.status)} capitalize`}>
                        {outpass.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link
                        to={`/student/outpass/${outpass._id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View
                      </Link>
                      {outpass.status === OutpassStatus.APPROVED && (
                        <button
                          onClick={() => handleDownloadPDF(outpass._id)}
                          className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1"
                        >
                          <Download size={14} />
                          PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${
                  page === pagination.page
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default OutpassHistory;

