import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import type { Outpass } from '../../types';
import { Users, AlertTriangle, Eye, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, differenceInHours } from 'date-fns';

const ActiveOutpasses = () => {
  const [searchParams] = useSearchParams();
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [filteredOutpasses, setFilteredOutpasses] = useState<Outpass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'overdue'>('all');

  useEffect(() => {
    // Check if there's a filter parameter in URL
    const filter = searchParams.get('filter');
    if (filter === 'overdue') {
      setFilterType('overdue');
    }
    fetchActiveOutpasses();
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [outpasses, searchQuery, filterType]);

  const fetchActiveOutpasses = async () => {
    try {
      setLoading(true);
      const response = await outpassService.getActiveOutpasses();
      
      if (response.success && response.data) {
        setOutpasses(response.data);
      }
    } catch (error) {
      toast.error('Failed to load active outpasses');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...outpasses];

    // Apply overdue filter
    if (filterType === 'overdue') {
      filtered = filtered.filter(outpass => outpass.isOverdue);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(outpass => {
        const student = typeof outpass.student === 'object' ? outpass.student : null;
        return (
          student?.name.toLowerCase().includes(query) ||
          student?.rollNumber?.toLowerCase().includes(query) ||
          outpass.destination.toLowerCase().includes(query) ||
          outpass.outpassNumber.toLowerCase().includes(query)
        );
      });
    }

    setFilteredOutpasses(filtered);
  };

  const getTimeRemaining = (toDate: string) => {
    const now = new Date();
    const end = new Date(toDate);
    const hours = differenceInHours(end, now);

    if (hours < 0) {
      return { text: `${Math.abs(hours)}h overdue`, color: 'text-red-600' };
    } else if (hours < 6) {
      return { text: `${hours}h remaining`, color: 'text-yellow-600' };
    } else {
      return { text: `${hours}h remaining`, color: 'text-green-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const overdueCount = outpasses.filter(o => o.isOverdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Active Outpasses</h1>
        <p className="text-gray-600 mt-1">Students currently outside campus</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Active</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{outpasses.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">On Time</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{outpasses.length - overdueCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <Clock className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Overdue</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{overdueCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
                placeholder="Search by name, roll number, or destination..."
              />
            </div>
          </div>

          {/* Filter Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'overdue')}
              className="input-field"
            >
              <option value="all">All Active Outpasses</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredOutpasses.length} of {outpasses.length} active outpasses
      </div>

      {/* Outpasses List */}
      {filteredOutpasses.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || filterType === 'overdue' 
              ? 'No outpasses found' 
              : 'No active outpasses'}
          </h3>
          <p className="text-gray-600">
            {searchQuery || filterType === 'overdue'
              ? 'Try adjusting your filters'
              : 'All students are currently on campus'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOutpasses.map((outpass) => {
            const student = typeof outpass.student === 'object' ? outpass.student : null;
            const timeRemaining = getTimeRemaining(outpass.toDate);

            return (
              <div
                key={outpass._id}
                className={`card hover:shadow-lg transition-shadow ${
                  outpass.isOverdue ? 'border-red-300 bg-red-50' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          {student?.name || 'Unknown Student'}
                          {outpass.isOverdue && (
                            <span className="badge-danger text-xs">Overdue</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {student?.rollNumber} • {student?.department}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Destination:</span>
                        <span className="ml-2 font-medium">{outpass.destination}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 capitalize">{outpass.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Checked Out:</span>
                        <span className="ml-2 font-medium">
                          {outpass.checkOutTime 
                            ? format(new Date(outpass.checkOutTime), 'MMM dd, HH:mm')
                            : 'Not yet'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Expected Return:</span>
                        <span className={`ml-2 font-medium ${timeRemaining.color}`}>
                          {format(new Date(outpass.toDate), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Time Status:</span>
                        <span className={`ml-2 font-medium ${timeRemaining.color}`}>
                          {timeRemaining.text}
                        </span>
                      </div>
                    </div>

                    {outpass.isOverdue && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle size={16} />
                        <span className="font-medium">
                          This student has not returned within the expected time
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 md:min-w-[120px]">
                    <Link
                      to={`/security/scan-qr?code=${outpass.qrCode}`}
                      className="flex-1 md:flex-none btn-primary inline-flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Overdue Warning */}
      {overdueCount > 0 && filterType === 'all' && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Overdue Alert</h3>
              <p className="text-sm text-red-700 mb-3">
                {overdueCount} student{overdueCount > 1 ? 's have' : ' has'} not returned within the expected time.
              </p>
              <button
                onClick={() => setFilterType('overdue')}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                View Overdue Outpasses →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveOutpasses;

