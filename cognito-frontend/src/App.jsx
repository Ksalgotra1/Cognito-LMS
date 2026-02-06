import React, { useEffect } from 'react'; 
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import LoginPage from './features/auth/components/LoginPage';
import Dashboard from './features/courses/components/Dashboard';
import ProtectedRoute from './features/auth/components/ProtectedRoute'; 
import SignupPage from './features/auth/components/SignupPage';
import CourseDetail from './features/courses/components/CourseDetail';
import Quiz from './features/courses/components/Quiz';
import SearchBar from './components/ui/SearchBar';
import CertificateVerify from './features/courses/pages/CertificateVerify';
import ProfilePage from './features/courses/pages/ProfilePage';
import { useSelector, useDispatch } from 'react-redux'; 
import { updateUser } from './features/auth/slices/authSlice'; 
import client from './lib/axios'; 

// Define (Navbar + Layout)
const MainLayout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth); 
  
  // FAST SYNC: Only fetch if we are MISSING data
  useEffect(() => {
    // PERFORMANCE GUARD: 
    // If we already have a First Name, assume data is fresh.
    // This prevents the "Slow" fetch on every single reload.
    if (user?.first_name || user?.last_name) return; 

    const syncUserProfile = async () => {
      try {
        console.log("⚡️ Fetching missing profile data...");
        const response = await client.get('/api/courses/profile/');
        
        dispatch(updateUser({
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            bio: response.data.bio
        }));
      } catch (error) {
        console.error("Background Sync Failed:", error);
      }
    };

    if (user) {
        syncUserProfile();
    }
  // We rely on 'user' to trigger this initially, but the 'if' guard stops loops.
  }, [dispatch, user]); 

  // --- Initials Logic ---
  let initials = 'U';
  if (user) {
    if (user.first_name && user.last_name) {
        initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    } else if (user.username) {
        initials = user.username.substring(0, 2).toUpperCase();
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="text-2xl font-bold text-blue-600 tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
            Cognito
          </Link>
          
          <div className="flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>

          <Link to="/profile" className="cursor-pointer hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200 shadow-sm">
                {initials}
            </div>
          </Link>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignupPage />} />
        <Route path="/verify/:id" element={<CertificateVerify />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<ProtectedRoute />}>
           <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/courses/lessons/:lessonId/quiz" element={<Quiz />} />
              <Route path="/profile" element={<ProfilePage />} />
           </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;