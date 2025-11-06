import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { outpassService } from '../../services/outpass.service';
import { OutpassType } from '../../types';
import { Calendar, MapPin, FileText, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateOutpass = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: OutpassType.LOCAL,
    reason: '',
    destination: '',
    fromDate: '',
    toDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateDates = (): boolean => {
    const from = new Date(formData.fromDate);
    const to = new Date(formData.toDate);
    const now = new Date();

    if (from < now) {
      toast.error('From date cannot be in the past');
      return false;
    }

    if (to < from) {
      toast.error('To date must be after from date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateDates()) {
      return;
    }

    setLoading(true);
    try {
      const response = await outpassService.createOutpass(formData);
      
      if (response.success) {
        toast.success('Outpass request created successfully!');
        navigate('/student/outpass-history');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create outpass');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/student/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Outpass Request</h1>
        <p className="text-gray-600 mt-2">Fill in the details to request an outpass</p>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Outpass Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Outpass Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value={OutpassType.LOCAL}>Local</option>
              <option value={OutpassType.HOME}>Home</option>
              <option value={OutpassType.EMERGENCY}>Emergency</option>
              <option value={OutpassType.MEDICAL}>Medical</option>
              <option value={OutpassType.OTHER}>Other</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the type of outpass you need
            </p>
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              Destination *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="destination"
                name="destination"
                type="text"
                value={formData.destination}
                onChange={handleChange}
                required
                className="input-field pl-10"
                placeholder="Enter your destination"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Specify where you will be going
            </p>
          </div>

          {/* From Date */}
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
              From Date & Time *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="fromDate"
                name="fromDate"
                type="datetime-local"
                value={formData.fromDate}
                onChange={handleChange}
                required
                className="input-field pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              When do you plan to leave?
            </p>
          </div>

          {/* To Date */}
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
              To Date & Time *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="toDate"
                name="toDate"
                type="datetime-local"
                value={formData.toDate}
                onChange={handleChange}
                required
                className="input-field pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              When do you plan to return?
            </p>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows={4}
                className="input-field pl-10 resize-none"
                placeholder="Provide a detailed reason for your outpass request"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Explain why you need this outpass (minimum 10 characters)
            </p>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Ensure all information is accurate and complete</li>
              <li>Your request will be reviewed by the warden</li>
              <li>You will receive a notification once approved/rejected</li>
              <li>Approved outpasses must be shown to security when leaving</li>
              <li>Return before the specified time to avoid penalties</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-6 card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Local Outpass:</strong> For visits within the city (same day return)
          </p>
          <p>
            <strong>Home Outpass:</strong> For going home (weekend or vacation)
          </p>
          <p>
            <strong>Emergency Outpass:</strong> For urgent situations requiring immediate approval
          </p>
          <p>
            <strong>Medical Outpass:</strong> For medical appointments or emergencies
          </p>
          <p>
            <strong>Other:</strong> For any other valid reason not covered above
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateOutpass;

