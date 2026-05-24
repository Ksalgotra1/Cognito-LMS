import React, { useEffect } from 'react'; 
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; 

// --- Component Imports ---
import LoginPage from './features/auth/components/LoginPage';
import Dashboard from './features/courses/components/Dashboard';
import ProtectedRoute from './features/auth/components/ProtectedRoute'; 
import SignupPage from './features/auth/components/SignupPage';
import CourseDetail from './features/courses/components/CourseDetail';
import Quiz from './features/courses/components/Quiz';
import SearchBar from './components/ui/SearchBar';
import CertificateVerify from './features/courses/pages/CertificateVerify';
import ProfilePage from './features/courses/pages/ProfilePage';
import CourseMarketplace from './features/courses/pages/CourseMarketplace';
import LandingPage from './pages/LandingPage';

// --- State & API Imports ---
import { updateUser } from './features/auth/slices/authSlice'; 
import client from './lib/axios'; 

// --- Layout Component (Navbar + Sync Logic) ---
const MainLayout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth); 
  
  // PROFILE SYNC LOGIC (Infinite Loop Fix Applied)
  useEffect(() => {
    // 1. Security Check: If no user is logged in, do nothing.
    if (!user) return;

    // 2. Performance Guard: 
    // If we already have a name (even an empty string), we assume data is loaded.
    // We check against 'undefined' to prevent loops on empty profiles.
    if (user.first_name !== undefined && user.last_name !== undefined) return; 

    const syncUserProfile = async () => {
      try {
        console.log("⚡️ Fetching missing profile data... (ONCE)");
        const response = await client.get('/api/courses/profile/');
        
        // This updates Redux, but because we only depend on 'user.id',
        // it WON'T trigger this effect again.
        dispatch(updateUser({
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            bio: response.data.bio
        }));
      } catch (error) {
        console.error("Background Sync Failed:", error);
      }
    };

    syncUserProfile();

  // CRITICAL DEPENDENCY FIX:
  // We only re-run this if the User ID changes (Login/Logout).
  }, [dispatch, user?.id]); 

  // --- Initials Logic ---
  let initials = 'U';
  if (user) {
    if (user.first_name || user.last_name) {
        const f = user.first_name ? user.first_name[0] : '';
        const l = user.last_name ? user.last_name[0] : '';
        initials = `${f}${l}`.toUpperCase();
        if (!initials) initials = user.username.substring(0, 2).toUpperCase();
    } else if (user.username) {
        initials = user.username.substring(0, 2).toUpperCase();
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Left Side: Logo + Navigation Links */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-2xl font-bold text-blue-600 tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
                Cognito
            </Link>
            
            {/* Marketplace Link */}
            <Link to="/browse" className="text-gray-600 hover:text-blue-600 font-medium transition-colors hidden sm:block">
                Browse Courses
            </Link>
          </div>
          
          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <SearchBar />
          </div>

          {/* Right: Profile Icon */}
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

// --- Landing Route (public / redirect if logged in) ---
const LandingRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignupPage />} />
        <Route path="/verify/:id" element={<CertificateVerify />} />
        
        {/* Landing Page (public) — redirects to dashboard if logged in */}
        <Route path="/" element={<LandingRoute />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
           <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Course Marketplace */}
              <Route path="/browse" element={<CourseMarketplace />} />
              
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