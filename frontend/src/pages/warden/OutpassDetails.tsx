import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import type { Outpass } from '../../types';
import { OutpassStatus } from '../../types';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

const OutpassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveRemarks, setApproveRemarks] = useState('');

  useEffect(() => {
    if (id) {
      fetchOutpassDetails();
    }
  }, [id]);

  const fetchOutpassDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await outpassService.getOutpassById(id);
      
      if (response.success && response.data) {
        setOutpass(response.data);
      }
    } catch (error) {
      toast.error('Failed to load outpass details');
      navigate('/warden/pending-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;

    if (!window.confirm('Are you sure you want to approve this outpass?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await outpassService.approveOutpass(id, approveRemarks || undefined);
      
      if (response.success) {
        toast.success('Outpass approved successfully!');
        fetchOutpassDetails();
        setApproveRemarks('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve outpass');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!id) return;

    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await outpassService.rejectOutpass(id, rejectReason);
      
      if (response.success) {
        toast.success('Outpass rejected');
        setShowRejectModal(false);
        setRejectReason('');
        fetchOutpassDetails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject outpass');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!outpass?.qrCode) return;

    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `outpass-${outpass.outpassNumber}.png`;
    a.click();
    toast.success('QR Code downloaded!');
  };

  const getStatusColor = (status: OutpassStatus) => {
    const colors = {
      [OutpassStatus.PENDING]: 'text-yellow-600 bg-yellow-50',
      [OutpassStatus.APPROVED]: 'text-green-600 bg-green-50',
      [OutpassStatus.REJECTED]: 'text-red-600 bg-red-50',
      [OutpassStatus.CHECKED_OUT]: 'text-blue-600 bg-blue-50',
      [OutpassStatus.CHECKED_IN]: 'text-gray-600 bg-gray-50',
      [OutpassStatus.OVERDUE]: 'text-red-600 bg-red-50',
      [OutpassStatus.CANCELLED]: 'text-gray-600 bg-gray-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!outpass) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Outpass not found</h3>
        <Link to="/warden/pending-requests" className="text-primary-600 hover:text-primary-700">
          Go back to pending requests
        </Link>
      </div>
    );
  }

  const student = typeof outpass.student === 'object' ? outpass.student : null;
  const isPending = outpass.status === OutpassStatus.PENDING;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Outpass Details</h1>
            <p className="text-gray-600 mt-1">#{outpass.outpassNumber}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full font-medium capitalize ${getStatusColor(outpass.status)}`}>
          {outpass.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-primary-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium">{student?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Roll Number</label>
                <p className="font-medium">{student?.rollNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Department</label>
                <p className="font-medium">{student?.department || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Year</label>
                <p className="font-medium">{student?.year ? `Year ${student.year}` : 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Hostel</label>
                <p className="font-medium">{student?.hostel || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Room Number</label>
                <p className="font-medium">{student?.roomNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium">{student?.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium">{student?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Outpass Details */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-primary-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Outpass Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <p className="font-medium capitalize">{outpass.type}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin size={16} />
                  Destination
                </label>
                <p className="font-medium">{outpass.destination}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Reason</label>
                <p className="font-medium">{outpass.reason}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar size={16} />
                    From Date & Time
                  </label>
                  <p className="font-medium">
                    {format(new Date(outpass.fromDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(outpass.fromDate), 'hh:mm a')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar size={16} />
                    To Date & Time
                  </label>
                  <p className="font-medium">
                    {format(new Date(outpass.toDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(outpass.toDate), 'hh:mm a')}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock size={16} />
                  Requested On
                </label>
                <p className="font-medium">
                  {format(new Date(outpass.createdAt), 'MMM dd, yyyy hh:mm a')}
                </p>
              </div>
            </div>
          </div>

          {/* Approval/Rejection Details */}
          {(outpass.status === OutpassStatus.APPROVED || outpass.status === OutpassStatus.REJECTED) && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {outpass.status === OutpassStatus.APPROVED ? 'Approval' : 'Rejection'} Details
              </h2>
              <div className="space-y-3">
                {outpass.warden && (
                  <div>
                    <label className="text-sm text-gray-600">
                      {outpass.status === OutpassStatus.APPROVED ? 'Approved' : 'Rejected'} By
                    </label>
                    <p className="font-medium">
                      {typeof outpass.warden === 'object' ? outpass.warden.name : 'N/A'}
                    </p>
                  </div>
                )}
                {outpass.approvedAt && (
                  <div>
                    <label className="text-sm text-gray-600">Approved At</label>
                    <p className="font-medium">
                      {format(new Date(outpass.approvedAt), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                )}
                {outpass.rejectedAt && (
                  <div>
                    <label className="text-sm text-gray-600">Rejected At</label>
                    <p className="font-medium">
                      {format(new Date(outpass.rejectedAt), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                )}
                {outpass.wardenRemarks && (
                  <div>
                    <label className="text-sm text-gray-600">Remarks</label>
                    <p className="font-medium">{outpass.wardenRemarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check-in/Check-out Details */}
          {(outpass.checkOutTime || outpass.checkInTime) && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Check-in/Check-out Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outpass.checkOutTime && (
                  <div>
                    <label className="text-sm text-gray-600">Checked Out At</label>
                    <p className="font-medium">
                      {format(new Date(outpass.checkOutTime), 'MMM dd, yyyy hh:mm a')}
                    </p>
                    {outpass.checkOutBy && (
                      <p className="text-sm text-gray-600">
                        By: {typeof outpass.checkOutBy === 'object' ? outpass.checkOutBy.name : 'N/A'}
                      </p>
                    )}
                  </div>
                )}
                {outpass.checkInTime && (
                  <div>
                    <label className="text-sm text-gray-600">Checked In At</label>
                    <p className="font-medium">
                      {format(new Date(outpass.checkInTime), 'MMM dd, yyyy hh:mm a')}
                    </p>
                    {outpass.checkInBy && (
                      <p className="text-sm text-gray-600">
                        By: {typeof outpass.checkInBy === 'object' ? outpass.checkInBy.name : 'N/A'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          {outpass.qrCode && outpass.status === OutpassStatus.APPROVED && (
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <QRCodeSVG
                    id="qr-code-canvas"
                    value={outpass.qrCode}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
              </div>
              <button
                onClick={downloadQRCode}
                className="btn-secondary w-full inline-flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download QR Code
              </button>
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div className="card space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Remarks (Optional)
                </label>
                <textarea
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Add any remarks for approval..."
                />
              </div>

              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={20} />
                {actionLoading ? 'Processing...' : 'Approve Outpass'}
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="w-full btn-danger py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle size={20} />
                Reject Outpass
              </button>
            </div>
          )}

          {/* Overdue Warning */}
          {outpass.isOverdue && (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Overdue Outpass</h3>
                  <p className="text-sm text-red-700">
                    This outpass has exceeded its return time. Please take necessary action.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                disabled={actionLoading}
                className="flex-1 btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={actionLoading}
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

export default OutpassDetails;

