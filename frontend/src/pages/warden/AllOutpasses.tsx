import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import type { Outpass, OutpassFilters } from '../../types';
import { OutpassStatus, OutpassType } from '../../types';
import { Search, Filter, Eye, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AllOutpasses = () => {
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
      const response = await outpassService.getAllOutpasses(filters);
      
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
      toast.error('Failed to load outpasses');
    } finally {
      setLoading(false);
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

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const getStatusBadge = (status: OutpassStatus) => {
    const badges: Record<OutpassStatus, string> = {
      [OutpassStatus.PENDING]: 'badge-warning',
      [OutpassStatus.APPROVED]: 'badge-success',
      [OutpassStatus.REJECTED]: 'badge-danger',
      [OutpassStatus.CHECKED_OUT]: 'badge-info',
      [OutpassStatus.CHECKED_IN]: 'badge-secondary',
      [OutpassStatus.OVERDUE]: 'badge-danger',
      [OutpassStatus.CANCELLED]: 'badge-secondary',
    };
    return badges[status] || 'badge-secondary';
  };

  const exportToCSV = () => {
    if (outpasses.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Student Name', 'Roll Number', 'Type', 'Status', 'Destination', 'From Date', 'To Date', 'Created At'];
    const rows = outpasses.map(outpass => {
      const student = typeof outpass.student === 'object' ? outpass.student : null;
      return [
        student?.name || 'N/A',
        student?.rollNumber || 'N/A',
        outpass.type,
        outpass.status,
        outpass.destination,
        format(new Date(outpass.fromDate), 'yyyy-MM-dd HH:mm'),
        format(new Date(outpass.toDate), 'yyyy-MM-dd HH:mm'),
        format(new Date(outpass.createdAt), 'yyyy-MM-dd HH:mm'),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outpasses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported successfully!');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Outpasses</h1>
          <p className="text-gray-600 mt-1">View and manage all outpass records</p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <Download size={16} />
          Export CSV
        </button>
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
                  placeholder="Search by student name or destination..."
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

            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
                className="input-field"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
                className="input-field"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button onClick={clearFilters} className="btn-secondary w-full">
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} outpasses
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm">Show:</label>
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="input-field py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Outpasses Table */}
      {outpasses.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No outpasses found</h3>
          <p className="text-gray-600">
            {filters.search || filters.status || filters.type
              ? 'Try adjusting your filters'
              : 'No outpass records available'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
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
                    Status
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outpasses.map((outpass) => {
                  const student = typeof outpass.student === 'object' ? outpass.student : null;
                  
                  return (
                    <tr key={outpass._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student?.rollNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge-info capitalize">{outpass.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`${getStatusBadge(outpass.status)} capitalize`}>
                          {outpass.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {outpass.destination}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(outpass.fromDate), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(outpass.toDate), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/warden/outpass/${outpass._id}`}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                        >
                          <Eye size={16} />
                          View
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === pagination.totalPages ||
                (page >= pagination.page - 1 && page <= pagination.page + 1)
              ) {
                return (
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
                );
              } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                return <span key={page}>...</span>;
              }
              return null;
            })}
          </div>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AllOutpasses;

