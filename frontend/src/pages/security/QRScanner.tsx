import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { outpassService } from '../../services/outpass.service';
import type { Outpass } from '../../types';
import { Camera, CheckCircle, XCircle, AlertCircle, User, MapPin, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [outpassNumber, setOutpassNumber] = useState('');
  const [verifiedOutpass, setVerifiedOutpass] = useState<Outpass | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanning = () => {
    if (!scannerDivRef.current) return;

    setScanning(true);
    setVerifiedOutpass(null);

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        // QR code successfully scanned
        console.log('QR Code scanned:', decodedText);
        
        // Stop scanning
        scanner.clear().catch(console.error);
        setScanning(false);

        // Verify the outpass
        await verifyOutpass(decodedText);
      },
      (error) => {
        // Handle scan error (can be ignored for continuous scanning)
        console.debug('QR scan error:', error);
      }
    );

    scannerRef.current = scanner;
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const verifyOutpass = async (qrData: string) => {
    setLoading(true);
    try {
      // Parse QR code data (assuming it contains outpass ID or number)
      let outpassId = qrData;
      
      // If QR data is JSON, parse it
      try {
        const parsed = JSON.parse(qrData);
        outpassId = parsed.outpassId || parsed.id || qrData;
      } catch {
        // Not JSON, use as is
      }

      // Verify with backend
      const response = await outpassService.verifyQRCode(outpassId);
      
      if (response.success && response.data) {
        setVerifiedOutpass(response.data);
        toast.success('Outpass verified successfully!');
      } else {
        toast.error('Invalid or expired outpass');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify outpass');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!outpassNumber.trim()) {
      toast.error('Please enter an outpass number');
      return;
    }

    await verifyOutpass(outpassNumber);
  };

  const handleCheckOut = async () => {
    if (!verifiedOutpass) return;

    if (!window.confirm('Confirm check-out for this student?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await outpassService.checkOut(verifiedOutpass._id);
      
      if (response.success) {
        toast.success('Student checked out successfully!');
        setVerifiedOutpass(null);
        setOutpassNumber('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check out');
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
      
      if (response.success) {
        toast.success('Student checked in successfully!');
        setVerifiedOutpass(null);
        setOutpassNumber('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; icon: any }> = {
      approved: { class: 'badge-success', icon: CheckCircle },
      checked_out: { class: 'badge-info', icon: Clock },
      overdue: { class: 'badge-danger', icon: AlertCircle },
    };
    return badges[status] || { class: 'badge', icon: CheckCircle };
  };

  const student = verifiedOutpass && typeof verifiedOutpass.student === 'object' 
    ? verifiedOutpass.student 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-gray-600 mt-1">Scan student outpass QR codes for check-in/out</p>
      </div>

      {/* Scanner Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {!scanning && !verifiedOutpass && (
            <>
              <button
                onClick={startScanning}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                Start QR Scanner
              </button>
              <button
                onClick={() => setManualEntry(!manualEntry)}
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
              >
                {manualEntry ? 'Hide' : 'Show'} Manual Entry
              </button>
            </>
          )}
          
          {scanning && (
            <button
              onClick={stopScanning}
              className="btn-danger flex-1 inline-flex items-center justify-center gap-2"
            >
              <XCircle size={20} />
              Stop Scanning
            </button>
          )}
        </div>

        {/* Manual Entry Form */}
        {manualEntry && !scanning && !verifiedOutpass && (
          <form onSubmit={handleManualVerify} className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Outpass Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={outpassNumber}
                onChange={(e) => setOutpassNumber(e.target.value)}
                placeholder="e.g., OP-20240115-0001"
                className="input-field flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* QR Scanner */}
      {scanning && (
        <div className="card">
          <div id="qr-reader" ref={scannerDivRef} className="w-full"></div>
          <p className="text-sm text-gray-600 text-center mt-4">
            Position the QR code within the frame to scan
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying outpass...</p>
        </div>
      )}

      {/* Verified Outpass Details */}
      {verifiedOutpass && !loading && (
        <div className="card">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Outpass Verified</h2>
              <p className="text-sm text-gray-600 mt-1">
                Outpass Number: {verifiedOutpass.outpassNumber}
              </p>
            </div>
            <span className={`${getStatusBadge(verifiedOutpass.status).class} capitalize inline-flex items-center gap-1`}>
              {(() => {
                const StatusIcon = getStatusBadge(verifiedOutpass.status).icon;
                return <StatusIcon size={16} />;
              })()}
              {verifiedOutpass.status.replace('_', ' ')}
            </span>
          </div>

          {/* Student Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{student?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Roll Number</p>
                <p className="font-medium">{student?.rollNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium">{student?.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hostel</p>
                <p className="font-medium">{student?.hostel || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room Number</p>
                <p className="font-medium">{student?.roomNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{student?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Outpass Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Destination</p>
                <p className="font-medium">{verifiedOutpass.destination}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium">
                  {format(new Date(verifiedOutpass.fromDate), 'MMM dd, yyyy HH:mm')} 
                  {' → '}
                  {format(new Date(verifiedOutpass.toDate), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertCircle className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium">{verifiedOutpass.reason}</p>
              </div>
            </div>

            {verifiedOutpass.checkOutTime && (
              <div className="flex items-start gap-3">
                <Clock className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Checked Out At</p>
                  <p className="font-medium">
                    {format(new Date(verifiedOutpass.checkOutTime), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}

            {verifiedOutpass.checkInTime && (
              <div className="flex items-start gap-3">
                <Clock className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Checked In At</p>
                  <p className="font-medium">
                    {format(new Date(verifiedOutpass.checkInTime), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            {verifiedOutpass.status === 'approved' && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={20} />
                {actionLoading ? 'Processing...' : 'Check Out'}
              </button>
            )}

            {verifiedOutpass.status === 'checked_out' && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={20} />
                {actionLoading ? 'Processing...' : 'Check In'}
              </button>
            )}

            <button
              onClick={() => {
                setVerifiedOutpass(null);
                setOutpassNumber('');
              }}
              disabled={actionLoading}
              className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!scanning && !verifiedOutpass && !loading && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Click "Start QR Scanner" to activate the camera</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Position the student's QR code within the scanning frame</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>The system will automatically verify the outpass</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Click "Check Out" or "Check In" to complete the process</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">5.</span>
              <span>Alternatively, use "Manual Entry" to enter the outpass number directly</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default QRScanner;

