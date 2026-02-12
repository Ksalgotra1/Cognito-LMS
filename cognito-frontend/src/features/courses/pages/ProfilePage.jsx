import React, { useEffect, useState } from 'react';
import client from '../../../lib/axios';
import { User, Award, BookOpen, Settings, LogOut } from 'lucide-react';
import { ProfileSkeleton } from '../../../components/ui/Skeletons';
import { useDispatch } from 'react-redux';
import { logout } from '../../auth/slices/authSlice';
import SettingsModal from '../components/SettingsModal';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const dispatch = useDispatch();

  const fetchProfile = async () => {
    try {
        const res = await client.get('api/courses/profile/');
        setProfile(res.data);
    } catch (err) {
        console.error("Profile fetch error:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <div className="p-10 text-center">Failed to load profile.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER CARD */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-200">
            {profile.first_name ? profile.first_name[0] : profile.username[0].toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900">
                {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-gray-500 font-medium">@{profile.username}</p>
            <p className="text-sm text-gray-400 mt-1 max-w-md">{profile.bio || "No bio yet. Click settings to add one!"}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={() => setShowSettings(true)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center gap-2 font-semibold transition shadow-sm"
            >
                <Settings size={18} /> Edit Profile
            </button>
            <button 
                onClick={() => dispatch(logout())}
                className="px-5 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl flex items-center gap-2 font-semibold transition"
            >
                <LogOut size={18} /> Logout
            </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            icon={<BookOpen className="text-blue-600" size={24}/>} 
            label="Enrolled Courses" 
            value={profile.stats.courses_enrolled} 
            color="bg-blue-50"
        />
        <StatCard 
            icon={<Award className="text-yellow-600" size={24}/>} 
            label="Certificates" 
            value={profile.stats.certificates_earned} 
            color="bg-yellow-50"
        />
        <StatCard 
            icon={<User className="text-green-600" size={24}/>} 
            label="Lessons Completed" 
            value={profile.stats.total_lessons_completed} 
            color="bg-green-50"
        />
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        currentUser={profile}
        onUpdate={fetchProfile} 
      />
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 transition hover:shadow-md">
        <div className={`p-4 rounded-xl ${color}`}>{icon}</div>
        <div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">{label}</p>
        </div>
    </div>
);

export default ProfilePage;