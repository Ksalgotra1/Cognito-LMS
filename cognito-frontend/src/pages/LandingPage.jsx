import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, 
  TerminalSquare, 
  GitFork, 
  CalendarClock, 
  Award, 
  Search,
  Play,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI Tutor',
    desc: 'Context-aware tutoring powered by RAG and your course history.',
  },
  {
    icon: TerminalSquare,
    title: 'Code Labs',
    desc: 'VS Code-like editor with live sandboxed execution.',
  },
  {
    icon: GitFork,
    title: 'DAG Prerequisites',
    desc: 'Visual prerequisite graphs with automatic cycle detection.',
  },
  {
    icon: CalendarClock,
    title: 'Smart Scheduler',
    desc: 'Algorithmic study plans tailored to your availability.',
  },
  {
    icon: Award,
    title: 'Certificates',
    desc: 'Verifiable PDFs with QR codes and unique UUIDs.',
  },
  {
    icon: Search,
    title: 'Hybrid Search',
    desc: 'In-memory Trie with AI semantic fallback in sub-ms.',
  },
];

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="landing-feature-card">
    <div className="landing-feature-icon">
      <Icon size={28} strokeWidth={1.8} />
    </div>
    <h3 className="landing-feature-title">{title}</h3>
    <p className="landing-feature-desc">{desc}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="landing-root">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <Link to="/" className="font-bold text-xl text-[#2563EB] font-['Inter']">
          Cognito
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="border border-[#e2e8f0] rounded-lg px-4 py-2 text-sm font-medium text-[#1e293b] hover:bg-[#f8fafc] transition-colors">Log in</Link>
          <Link to="/register" className="bg-[#2563EB] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1D4ED8] transition-colors">Sign Up</Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="landing-hero">
        {/* Left Side — Copy */}
        <div className="landing-hero-left font-['Inter'] flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-[#2563EB]" />
            <span className="text-sm font-medium text-[#2563EB]">AI-powered learning</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-[#2563EB]">Everything</span>
            <span className="text-[#1e293b]"> you need to master code.</span>
          </h1>
          
          <p className="text-base text-[#64748b] leading-relaxed mb-8">
            One platform. AI tutoring. Live code labs.<br />
            Smart scheduling. Zero friction.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-10 w-full sm:w-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-[#2563EB] text-white rounded-lg px-6 py-3 text-sm font-semibold hover:bg-[#1D4ED8] transition-colors text-center"
            >
              Get Started →
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto border border-[#e2e8f0] rounded-lg px-6 py-3 text-sm font-medium text-[#1e293b] hover:bg-[#f8fafc] transition-colors text-center"
            >
              Log in
            </Link>
            <button className="mt-2 sm:mt-0 text-[#2563EB] text-sm font-medium flex items-center justify-center gap-1.5 hover:underline w-full sm:w-auto">
              ▶ Demo Video
            </button>
          </div>

          <div className="flex items-center gap-6 sm:gap-8">
            {[
              { num: '12k+', label: 'Learners' },
              { num: '200+', label: 'Courses' },
              { num: '98%',  label: 'Satisfaction' },
            ].map(s => (
              <div key={s.label} className="flex flex-col">
                <span className="text-2xl font-bold text-[#1e293b]">{s.num}</span>
                <span className="text-xs text-[#94a3b8] mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side — Camera Roll */}
        <div className="landing-hero-right">
          <div className="landing-roll-mask">
            <div className="landing-roll-track">
              {/* Duplicate cards for seamless infinite scroll */}
              {[...FEATURES, ...FEATURES].map((feat, i) => (
                <FeatureCard key={i} {...feat} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p className="text-xs text-textMuted">Built with Django · React · Redis · Celery · Ollama · OpenAI</p>
      </footer>
    </div>
  );
};

export default LandingPage;
