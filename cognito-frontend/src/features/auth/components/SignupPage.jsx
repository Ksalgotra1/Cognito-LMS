import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register } from '../slices/authSlice';
import Button from '../../../components/ui/Button';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'STUDENT'
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(register(formData));
    
    if (register.fulfilled.match(result)) {
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Create Account</h1>
        
        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded">Registration failed</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input name="username" type="text" onChange={handleChange} required className="w-full p-2 mt-1 border rounded" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" onChange={handleChange} required className="w-full p-2 mt-1 border rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input name="password" type="password" onChange={handleChange} required className="w-full p-2 mt-1 border rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">I am a:</label>
            <select name="role" onChange={handleChange} className="w-full p-2 mt-1 border rounded">
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
          </div>

          <Button variant="primary" className="w-full" disabled={loading} type="submit">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
            Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;