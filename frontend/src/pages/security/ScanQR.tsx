import { useState } from 'react';
import { outpassService } from '../../services/outpass.service';
import type { Outpass } from '../../types';
import { OutpassStatus } from '../../types';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
   
  User,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ScanQR = () => {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedOutpass, setVerifiedOutpass] = useState<Outpass | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qrCode.trim()) {
      toast.error('Please enter a QR code');
      return;
    }

    setLoading(true);
    setVerifiedOutpass(null);

    try {
      const response = await outpassService.verifyOutpass(qrCode);
      
      if (response.success && response.data) {
        setVerifiedOutpass(response.data);
        toast.success('Outpass verified successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify outpass');
      setVerifiedOutpass(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!verifiedOutpass) return;

    if (!window.confirm('Confirm check-out for this student?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await outpassService.checkOut(verifiedOutpass._id);
      
      if (response.success && response.data) {
        toast.success('Student checked out successfully!');
        setVerifiedOutpass(response.data);
        setQrCode('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check out student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!verifiedOutpass) return;

    if (!window.confirm('Confirm check-in for this student?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await outpassService.checkIn(verifiedOutpass._id);
      
      if (response.success && response.data) {
        toast.success('Student checked in successfully!');
        setVerifiedOutpass(response.data);
        setQrCode('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check in student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = () => {
    setQrCode('');
    setVerifiedOutpass(null);
  };

  const student = verifiedOutpass && typeof verifiedOutpass.student === 'object' 
    ? verifiedOutpass.student 
    : null;

  const canCheckOut = verifiedOutpass?.status === OutpassStatus.APPROVED && !verifiedOutpass.checkOutTime;
  const canCheckIn = verifiedOutpass?.status === OutpassStatus.CHECKED_OUT && !verifiedOutpass.checkInTime;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <QrCode className="text-primary-600" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Scan QR Code</h1>
        <p className="text-gray-600 mt-2">Verify and process student check-ins and check-outs</p>
      </div>

      {/* QR Code Input */}
      <div className="card">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter QR Code or Outpass Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <QrCode className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                className="input-field pl-10"
                placeholder="Scan or enter QR code..."
                disabled={loading || !!verifiedOutpass}
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !!verifiedOutpass}
              className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={18} />
              {loading ? 'Verifying...' : 'Verify Outpass'}
            </button>
            {verifiedOutpass && (
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Verified Outpass Details */}
      {verifiedOutpass && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`card ${
            verifiedOutpass.isOverdue 
              ? 'bg-red-50 border-red-200' 
              : canCheckOut || canCheckIn
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {verifiedOutpass.isOverdue ? (
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
              ) : (
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  verifiedOutpass.isOverdue ? 'text-red-900' : 'text-green-900'
                }`}>
                  {verifiedOutpass.isOverdue 
                    ? 'Overdue Outpass' 
                    : 'Valid Outpass'}
                </h3>
                <p className={`text-sm ${
                  verifiedOutpass.isOverdue ? 'text-red-700' : 'text-green-700'
                }`}>
                  {verifiedOutpass.isOverdue 
                    ? 'This outpass has exceeded its return time. Please take necessary action.'
                    : 'This outpass is valid and can be processed.'}
                </p>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-primary-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium text-lg">{student?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Roll Number</label>
                <p className="font-medium text-lg">{student?.rollNumber || 'N/A'}</p>
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
                <p className="font-medium text-sm">{student?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Outpass Details */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Outpass Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-sm text-gray-600">Outpass Number</span>
                <span className="font-mono font-medium">{verifiedOutpass.outpassNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-sm text-gray-600">Type</span>
                <span className="badge-info capitalize">{verifiedOutpass.type}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-sm text-gray-600">Status</span>
                <span className="badge-success capitalize">{verifiedOutpass.status.replace('_', ' ')}</span>
              </div>
              <div className="pb-3 border-b">
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <MapPin size={16} />
                  Destination
                </label>
                <p className="font-medium">{verifiedOutpass.destination}</p>
              </div>
              <div className="pb-3 border-b">
                <label className="text-sm text-gray-600 mb-1">Reason</label>
                <p className="font-medium">{verifiedOutpass.reason}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Calendar size={16} />
                    From Date & Time
                  </label>
                  <p className="font-medium">
                    {format(new Date(verifiedOutpass.fromDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(verifiedOutpass.fromDate), 'hh:mm a')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Calendar size={16} />
                    To Date & Time
                  </label>
                  <p className="font-medium">
                    {format(new Date(verifiedOutpass.toDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(verifiedOutpass.toDate), 'hh:mm a')}
                  </p>
                </div>
              </div>
              {verifiedOutpass.checkOutTime && (
                <div>
                  <label className="text-sm text-gray-600 mb-1">Checked Out At</label>
                  <p className="font-medium">
                    {format(new Date(verifiedOutpass.checkOutTime), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              )}
              {verifiedOutpass.checkInTime && (
                <div>
                  <label className="text-sm text-gray-600 mb-1">Checked In At</label>
                  <p className="font-medium">
                    {format(new Date(verifiedOutpass.checkInTime), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {(canCheckOut || canCheckIn) && (
            <div className="card bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Outpass</h3>
              <div className="flex gap-3">
                {canCheckOut && (
                  <button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={20} />
                    {actionLoading ? 'Processing...' : 'Check Out Student'}
                  </button>
                )}
                {canCheckIn && (
                  <button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={20} />
                    {actionLoading ? 'Processing...' : 'Check In Student'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Already Processed */}
          {!canCheckOut && !canCheckIn && verifiedOutpass.checkInTime && (
            <div className="card bg-gray-50 border-gray-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-gray-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">Already Processed</h3>
                  <p className="text-sm text-gray-600">
                    This student has already been checked in.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!verifiedOutpass && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Scan the QR code from the student's outpass or enter the outpass number manually</li>
            <li>Verify the student's identity and outpass details</li>
            <li>Click "Check Out" when the student is leaving campus</li>
            <li>Click "Check In" when the student returns to campus</li>
            <li>Overdue outpasses will be highlighted in red</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScanQR;

