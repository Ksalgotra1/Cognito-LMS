import React from 'react';
import Button from '../../../components/ui/Button'; // Import your reusable button!

const LoginPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">Welcome Back</h1>
        <p className="mb-6 text-gray-600">Please sign in to continue.</p>
        <Button variant="primary" onClick={() => window.location.href='/dashboard'}>
          Login (Mock)
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;