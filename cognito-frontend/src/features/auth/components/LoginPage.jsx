import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, BadgeCheck, CalendarCheck } from 'lucide-react';
import { login } from '../slices/authSlice';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ username, password }));
    
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 font-['Inter'] bg-[#1e3a5f] md:bg-white px-4 py-8 md:p-0">
        
        {/* LOGIN COLUMN (LEFT) */}
        <div className="bg-white border border-transparent md:border-none p-8 md:p-12 flex flex-col justify-center order-first md:order-none relative z-10 shadow-[0_30px_60px_-15px_rgba(255,255,255,0.2),0_0_20px_rgba(255,255,255,0.1)] md:shadow-[20px_0_40px_rgba(0,0,0,0.1)] rounded-2xl md:rounded-none w-full max-w-md mx-auto md:max-w-none self-center md:self-stretch">
          <div className="w-full max-w-md mx-auto">
            <h3 className="text-3xl md:text-5xl font-bold text-[#1e293b] mb-2 md:mb-4 text-center md:text-left">Welcome back</h3>
            <p className="text-sm md:text-base text-[#64748b] mb-8 text-center md:text-left">Sign in to continue learning</p>

            {error && (
              <div className="p-4 mb-6 text-sm text-red-600 bg-red-100 rounded">
                {typeof error === 'string' ? error : 'Login failed'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-[#64748b] mb-2 block">Username</label>
                <input 
                  type="text" 
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-base text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
                  placeholder="e.g. johndoe123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-[#64748b] mb-2 block">Password</label>
                <input 
                  type="password" 
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-base text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="mt-8 w-full bg-[#2563EB] text-white rounded-xl py-3 text-base font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
            
            <p className="text-center text-sm text-[#64748b] mt-8">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#2563EB] font-medium hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* HERO COLUMN (RIGHT) */}
        <div className="bg-[#1e3a5f] p-8 md:p-12 hidden md:flex flex-col justify-center relative z-0">
          <div className="w-full max-w-md mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
              Learn to code.<br />Land the job.
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-12">
              Join 12,000+ learners building real skills with AI tutoring and live code labs.
            </p>
            
            <div className="flex items-center gap-4 bg-white/10 border border-white/10 rounded-xl px-5 py-4 mb-4 backdrop-blur-sm hover:bg-white/20 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default group">
              <Brain size={20} className="text-blue-300 group-hover:text-white transition-colors duration-300" /> 
              <span className="text-base text-white/80 font-medium group-hover:text-white transition-colors duration-300">AI tutor available 24/7</span>
            </div>
            <div className="flex items-center gap-4 bg-white/10 border border-white/10 rounded-xl px-5 py-4 mb-4 backdrop-blur-sm hover:bg-white/20 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default group">
              <BadgeCheck size={20} className="text-blue-300 group-hover:text-white transition-colors duration-300" /> 
              <span className="text-base text-white/80 font-medium group-hover:text-white transition-colors duration-300">Verifiable certificates</span>
            </div>
            <div className="flex items-center gap-4 bg-white/10 border border-white/10 rounded-xl px-5 py-4 mb-4 backdrop-blur-sm hover:bg-white/20 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default group">
              <CalendarCheck size={20} className="text-blue-300 group-hover:text-white transition-colors duration-300" /> 
              <span className="text-base text-white/80 font-medium group-hover:text-white transition-colors duration-300">Smart study scheduling</span>
            </div>
          </div>
        </div>
    </div>
  );
};

export default LoginPage;