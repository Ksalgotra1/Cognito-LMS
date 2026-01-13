import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './features/auth/components/LoginPage';
import Dashboard from './features/courses/components/Dashboard';
import ProtectedRoute from './features/auth/components/ProtectedRoute'; 
import SignupPage from './features/auth/components/SignupPage';
import CourseDetail from './features/courses/components/CourseDetail';
import Quiz from './features/courses/components/Quiz';
import SearchBar from './components/ui/SearchBar';
import CertificateVerify from './features/courses/pages/CertificateVerify';

// Define (Navbar + Layout)
// This wrapper ensures the Search Bar appears on every protected page
const MainLayout = () => {
  // 1. Get the 'user' string from storage
  const userString = localStorage.getItem('user'); 
  let username = 'User';

  // 2. Parse it safely (convert string "{"username":...}" back to an Object)
  if (userString) {
    try {
      const userObj = JSON.parse(userString);
      username = userObj.username || 'User';
    } catch (e) {
      console.error("Could not parse user data", e);
    }
  }
  
  // 3. Grab first 2 letters
  const initials = username.substring(0, 2).toUpperCase();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold text-blue-600 tracking-tight cursor-pointer">
            Cognito
          </div>
          
          {/* Search Engine */}
          <div className="flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>

          {/* User Profile Stub */}
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
            {initials}
          </div>
        </div>
      </nav>
      
      {/* The Page Content Renders Here */}
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
        {/* Public Routes (No Search Bar here) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignupPage />} />

        {/* Verification Page (Public) */}
        <Route path="/verify/:id" element={<CertificateVerify />} />
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 🔒 Protected Routes (Must have Token) */}
        <Route element={<ProtectedRoute />}>
           
           {/* Wrap routes in MainLayout to show the Search Bar */}
           <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/courses/lessons/:lessonId/quiz" element={<Quiz />} />
           </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;