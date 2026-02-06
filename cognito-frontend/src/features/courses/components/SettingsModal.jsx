import React, { useState } from 'react';
import { X, Save, AlertTriangle, Bell, Lock, CheckCircle } from 'lucide-react';
import { useDispatch } from 'react-redux'; // <--- 1. Import Hook
import { updateUser } from '../../../features/auth/slices/authSlice'; // <--- 2. Import Action
import client from '../../../lib/axios';

const SettingsModal = ({ isOpen, onClose, currentUser, onUpdate }) => {
  const [firstName, setFirstName] = useState(currentUser?.first_name || "");
  const [lastName, setLastName] = useState(currentUser?.last_name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const dispatch = useDispatch(); // <--- 3. Initialize Dispatch

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update Backend
      await client.patch('api/courses/profile/', {
        first_name: firstName,
        last_name: lastName,
        bio: bio
      });

      // 2. FIX: Update Redux State Instantly (No Reload needed)
      dispatch(updateUser({ 
        first_name: firstName, 
        last_name: lastName 
      }));

      setSuccess("Profile updated successfully!");
      if (onUpdate) onUpdate(); // Refresh parent profile page data
      
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-800">Profile Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                <AlertTriangle size={16} className="mr-2"/> {error}
            </div>
        )}
        {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center">
                <CheckCircle size={16} className="mr-2"/> {success}
            </div>
        )}

        <div className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                    <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                    <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-0 flex items-center gap-1">
                <Lock size={10} /> Limited to 2 name changes per year.
            </p>

            {/* Bio */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio / Headline</label>
                <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
            </div>

            {/* Mock Settings (Visual Only) */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Preferences</h3>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2"><Bell size={16}/> Email Notifications</span>
                    <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center font-semibold shadow-lg shadow-blue-200 disabled:opacity-50"
            >
                {loading ? "Saving..." : <><Save size={18} className="mr-2"/> Save Changes</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;