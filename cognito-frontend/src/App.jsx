import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/components/LoginPage';
import Dashboard from './features/courses/components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root "/" to "/login" automatically */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Define the pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;