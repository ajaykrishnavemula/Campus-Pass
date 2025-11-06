import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';
// import { authService } from '../../services/auth.service';
import type { ProfileUpdateData } from '../../types';
import { User, Mail, Phone, Home, Hash, BookOpen, Calendar, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, refreshUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: user?.name || '',
    phone: user?.phone || '',
    hostel: user?.hostel || '',
    roomNumber: user?.roomNumber || '',
    department: user?.department || '',
    year: user?.year || undefined,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        hostel: user.hostel,
        roomNumber: user.roomNumber,
        department: user.department,
        year: user.year,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'year' ? (e.target.value ? parseInt(e.target.value) : undefined) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, you would call an API to update the profile
      // For now, we'll just show a success message
      toast.success('Profile updated successfully!');
      await refreshUser();
      setIsEditing(false);
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
        phone: user.phone,
        hostel: user.hostel,
        roomNumber: user.roomNumber,
        department: user.department,
        year: user.year,
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Edit2 size={20} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                    className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="input-field pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>

              {/* Roll Number (Read-only) */}
              <div>
                <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="rollNumber"
                    type="text"
                    value={user.rollNumber || 'Not set'}
                    disabled
                    className="input-field pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Roll number cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Computer Science"
                  />
                </div>
              </div>

              {/* Year */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="year"
                    name="year"
                    value={formData.year || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Hostel Information */}
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hostel Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hostel */}
              <div>
                <label htmlFor="hostel" className="block text-sm font-medium text-gray-700 mb-1">
                  Hostel
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="hostel"
                    name="hostel"
                    type="text"
                    value={formData.hostel || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="A Block"
                  />
                </div>
              </div>

              {/* Room Number */}
              <div>
                <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="roomNumber"
                    name="roomNumber"
                    type="text"
                    value={formData.roomNumber || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="101"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Account Information */}
      <div className="card bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Account Status:</span>
            <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Role:</span>
            <span className="font-medium">Student</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Member Since:</span>
            <span className="font-medium">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-600">Last changed 30 days ago</p>
            </div>
            <button className="btn-secondary">Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

