import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import type { Outpass } from '../../types';
import { OutpassStatus } from '../../types';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OutpassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOutpassDetails();
    }
  }, [id]);

  const fetchOutpassDetails = async () => {
    try {
      setLoading(true);
      const response = await outpassService.getOutpassById(id!);
      
      if (response.success && response.data) {
        setOutpass(response.data);
      }
    } catch (error) {
      toast.error('Failed to load outpass details');
      navigate('/student/outpass-history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!outpass) return;
    
    try {
      await outpassService.downloadOutpassPDF(outpass._id);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleDownloadQRCode = () => {
    if (!outpass || !outpass.qrCode) return;

    // Create a canvas to draw the QR code
    const canvas = document.createElement('canvas');
    const svg = document.querySelector('.qr-code-svg') as SVGElement;
    
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Download the canvas as PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `outpass-qr-${outpass.outpassNumber}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('QR code downloaded successfully');
          }
        });
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleCancelOutpass = async () => {
    if (!outpass || !window.confirm('Are you sure you want to cancel this outpass?')) {
      return;
    }

    try {
      await outpassService.cancelOutpass(outpass._id);
      toast.success('Outpass cancelled successfully');
      fetchOutpassDetails();
    } catch (error) {
      toast.error('Failed to cancel outpass');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      approved: 'text-green-600 bg-green-50 border-green-200',
      rejected: 'text-red-600 bg-red-50 border-red-200',
      checked_out: 'text-blue-600 bg-blue-50 border-blue-200',
      checked_in: 'text-green-600 bg-green-50 border-green-200',
      overdue: 'text-red-600 bg-red-50 border-red-200',
      cancelled: 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case OutpassStatus.APPROVED:
        return <CheckCircle className="text-green-600" size={24} />;
      case OutpassStatus.REJECTED:
        return <XCircle className="text-red-600" size={24} />;
      case OutpassStatus.PENDING:
        return <Clock className="text-yellow-600" size={24} />;
      case OutpassStatus.OVERDUE:
        return <AlertCircle className="text-red-600" size={24} />;
      default:
        return <FileText className="text-gray-600" size={24} />;
    }
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
        <p className="text-gray-600">Outpass not found</p>
        <Link to="/student/outpass-history" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          Back to History
        </Link>
      </div>
    );
  }

  // const student = typeof outpass.student === 'object' ? outpass.student : null;
  const warden = typeof outpass.warden === 'object' ? outpass.warden : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/student/outpass-history')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to History
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Outpass Details</h1>
            <p className="text-gray-600 mt-1">{outpass.outpassNumber}</p>
          </div>
          {outpass.status === OutpassStatus.APPROVED && (
            <button
              onClick={handleDownloadPDF}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Download size={20} />
              Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className={`card border-2 ${getStatusColor(outpass.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon(outpass.status)}
            <div>
              <h2 className="text-xl font-semibold capitalize">
                {outpass.status.replace('_', ' ')}
              </h2>
              <p className="text-sm opacity-75">
                {outpass.status === OutpassStatus.PENDING && 'Waiting for warden approval'}
                {outpass.status === OutpassStatus.APPROVED && 'Approved by warden'}
                {outpass.status === OutpassStatus.REJECTED && 'Rejected by warden'}
                {outpass.status === OutpassStatus.CHECKED_OUT && 'Currently outside campus'}
                {outpass.status === OutpassStatus.CHECKED_IN && 'Returned to campus'}
                {outpass.status === OutpassStatus.OVERDUE && 'Return time exceeded'}
                {outpass.status === OutpassStatus.CANCELLED && 'Cancelled by student'}
              </p>
            </div>
          </div>
          {outpass.isOverdue && (
            <span className="badge-danger">Overdue</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">{outpass.type}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-medium">{outpass.destination}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">From Date</p>
                  <p className="font-medium">
                    {format(new Date(outpass.fromDate), 'MMMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">To Date</p>
                  <p className="font-medium">
                    {format(new Date(outpass.toDate), 'MMMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="text-gray-400 mt-1" size={20} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="font-medium">{outpass.reason}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Details */}
          {(outpass.status === OutpassStatus.APPROVED || outpass.status === OutpassStatus.REJECTED) && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {outpass.status === OutpassStatus.APPROVED ? 'Approval' : 'Rejection'} Details
              </h3>
              <div className="space-y-4">
                {warden && (
                  <div className="flex items-start gap-3">
                    <User className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">
                        {outpass.status === OutpassStatus.APPROVED ? 'Approved By' : 'Rejected By'}
                      </p>
                      <p className="font-medium">{warden.name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">
                      {outpass.status === OutpassStatus.APPROVED ? 'Approved At' : 'Rejected At'}
                    </p>
                    <p className="font-medium">
                      {format(
                        new Date(outpass.approvedAt || outpass.rejectedAt!),
                        'MMMM dd, yyyy HH:mm'
                      )}
                    </p>
                  </div>
                </div>

                {outpass.wardenRemarks && (
                  <div className="flex items-start gap-3">
                    <FileText className="text-gray-400 mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Remarks</p>
                      <p className="font-medium">{outpass.wardenRemarks}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check-in/Check-out Details */}
          {(outpass.checkOutTime || outpass.checkInTime) && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Check-in/Check-out Details</h3>
              <div className="space-y-4">
                {outpass.checkOutTime && (
                  <div className="flex items-start gap-3">
                    <Clock className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Checked Out At</p>
                      <p className="font-medium">
                        {format(new Date(outpass.checkOutTime), 'MMMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {outpass.checkInTime && (
                  <div className="flex items-start gap-3">
                    <Clock className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Checked In At</p>
                      <p className="font-medium">
                        {format(new Date(outpass.checkInTime), 'MMMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          {outpass.status === OutpassStatus.APPROVED && outpass.qrCode && (
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCodeSVG
                  value={outpass.qrCode}
                  size={200}
                  className="qr-code-svg"
                />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Show this QR code to security when leaving/entering campus
              </p>
              <button
                onClick={handleDownloadQRCode}
                className="w-full btn-secondary mt-4 inline-flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download QR Code
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              {outpass.status === OutpassStatus.PENDING && (
                <button
                  onClick={handleCancelOutpass}
                  className="w-full btn-danger"
                >
                  Cancel Outpass
                </button>
              )}
              {outpass.status === OutpassStatus.APPROVED && (
                <button
                  onClick={handleDownloadPDF}
                  className="w-full btn-primary inline-flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download PDF
                </button>
              )}
              <Link
                to="/student/outpass-history"
                className="w-full btn-secondary block text-center"
              >
                Back to History
              </Link>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-gray-600">
                    {format(new Date(outpass.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {outpass.approvedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Approved</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(outpass.approvedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}

              {outpass.rejectedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Rejected</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(outpass.rejectedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}

              {outpass.checkOutTime && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Checked Out</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(outpass.checkOutTime), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}

              {outpass.checkInTime && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Checked In</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(outpass.checkInTime), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutpassDetails;
