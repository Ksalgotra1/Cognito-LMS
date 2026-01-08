import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/components/LoginPage';
import Dashboard from './features/courses/components/Dashboard';
import ProtectedRoute from './features/auth/components/ProtectedRoute'; 
import SignupPage from './features/auth/components/SignupPage';
import CourseDetail from './features/courses/components/CourseDetail';
import Quiz from './features/courses/components/Quiz';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes (Anyone can see) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignupPage />} />
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 🔒 Protected Routes (Must have Token) */}
        <Route element={<ProtectedRoute />}>
           <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/courses/:id" element={<CourseDetail />} />
           
           {/* QUIZ ROUTE HERE */}
           <Route path="/courses/lessons/:lessonId/quiz" element={<Quiz />} />
           
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;