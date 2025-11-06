import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import type { ProfileUpdateData } from '../../types';
import { User, Mail, Phone, Save, X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.updateProfile(formData);
      
      if (response.success && response.data) {
        setUser(response.data);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your security account information</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Placeholder */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="text-blue-600" size={48} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600 capitalize flex items-center gap-2">
                <Shield size={16} />
                Security Personnel
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Member since {format(new Date(user.createdAt), 'MMM yyyy')}
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <User size={18} className="text-gray-400" />
                    <span>{user.name}</span>
                  </div>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail size={18} className="text-gray-400" />
                  <span>{user.email}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Phone size={18} className="text-gray-400" />
                    <span>{user.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Role (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="text-gray-900 capitalize">
                  <span className="badge-info flex items-center gap-2 inline-flex">
                    <Shield size={14} />
                    Security
                  </span>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Status
                </label>
                <div className="text-gray-900">
                  <span className={user.isActive ? 'badge-success' : 'badge-danger'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Last Updated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Updated
                </label>
                <div className="text-gray-900">
                  {format(new Date(user.updatedAt), 'MMM dd, yyyy hh:mm a')}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Account Information */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">User ID</span>
            <span className="font-mono text-gray-900">{user._id}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Account Created</span>
            <span className="text-gray-900">
              {format(new Date(user.createdAt), 'MMM dd, yyyy hh:mm a')}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Last Modified</span>
            <span className="text-gray-900">
              {format(new Date(user.updatedAt), 'MMM dd, yyyy hh:mm a')}
            </span>
          </div>
        </div>
      </div>

      {/* Security Role Info */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Shield className="text-blue-600" size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Security Personnel</h3>
            <p className="text-sm text-blue-700">
              As a security personnel, you have access to verify outpasses, manage check-ins and check-outs,
              and monitor active outpasses. Your role is crucial in maintaining campus security.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card bg-gray-50 border-gray-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Mail className="text-gray-600" size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Security Notice</h3>
            <p className="text-sm text-gray-700">
              For security reasons, email addresses cannot be changed. If you need to update your email,
              please contact the system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

