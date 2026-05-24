import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../slices/authSlice';

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
    <div className="min-h-screen bg-[#1e3a5f] flex items-center justify-center font-['Inter'] px-4 py-8 md:p-0">
      <div className="bg-white border border-transparent rounded-2xl max-w-md w-full mx-auto p-6 md:p-10 shadow-[0_30px_60px_-15px_rgba(255,255,255,0.2),0_0_20px_rgba(255,255,255,0.1)]">
        <h2 className="text-2xl font-bold text-[#1e293b] text-center mb-1">Create Account</h2>
        <p className="text-sm text-[#64748b] text-center mb-8">Start learning for free today</p>
        
        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded">Registration failed</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Username</label>
            <input name="username" type="text" onChange={handleChange} required className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" placeholder="e.g. johndoe123" />
            <p className="text-xs text-[#94a3b8] mt-1">This is your public display name</p>
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Email</label>
            <input name="email" type="email" onChange={handleChange} required className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" placeholder="e.g. john@gmail.com" />
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Password</label>
            <input name="password" type="password" onChange={handleChange} required className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" placeholder="Min. 8 characters" />
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">I am a:</label>
            <select name="role" onChange={handleChange} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#1e293b] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all">
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#2563EB] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#1D4ED8] transition-colors mt-2">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="text-center text-xs text-[#64748b] mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2563EB] font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;