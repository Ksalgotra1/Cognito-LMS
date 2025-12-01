import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = () => {
  // 1. Check the "Brain" to see if we have a token
  // We check 'token' specifically because 'isAuthenticated' might be false 
  // for a split second on refresh before Redux rehydrates.
  const { token } = useSelector((state) => state.auth);

  // 2. The Gatekeeper Logic
  if (!token) {
    // If no token, kick them back to login
    // 'replace' prevents them from clicking Back to return here
    return <Navigate to="/login" replace />;
  }

  // 3. If allowed, render the child route (The Dashboard)
  // <Outlet /> is a placeholder for "Whatever child route is active"
  return <Outlet />;
};

export default ProtectedRoute;