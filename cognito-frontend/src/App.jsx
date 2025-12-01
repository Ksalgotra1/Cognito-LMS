import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/components/LoginPage';
import Dashboard from './features/courses/components/Dashboard';
import ProtectedRoute from './features/auth/components/ProtectedRoute'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes (Anyone can see) */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Redirect root to dashboard (The Gatekeeper will handle the rest) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 🔒 Protected Routes (Must have Token) */}
        <Route element={<ProtectedRoute />}>
           {/* All routes inside here require login */}
           <Route path="/dashboard" element={<Dashboard />} />
           {/* Future: <Route path="/courses" ... /> */}
           {/* Future: <Route path="/profile" ... /> */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;