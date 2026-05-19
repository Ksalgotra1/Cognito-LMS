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
  ArrowRight
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
        <Link to="/" className="landing-logo">
          Cognito
        </Link>
        <div className="landing-nav-links">
          <Link to="/login" className="landing-nav-login">Log in</Link>
          <Link to="/register" className="landing-nav-signup">Sign Up</Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="landing-hero">
        {/* Left Side — Copy */}
        <div className="landing-hero-left">
          <h1 className="landing-headline">
            <span className="landing-headline-accent">Everything</span>
            {' '}you need to master code.
          </h1>
          <p className="landing-subtext">
            One platform. AI tutoring. Live code labs.
            <br />
            Smart scheduling. Zero friction.
          </p>
          <div className="landing-cta-group">
            <Link to="/register" className="landing-cta-primary">
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="landing-cta-secondary">
              Log in
            </Link>
            <button 
              className="landing-cta-demo"
              onClick={() => window.open('#demo', '_self')}
            >
              <Play size={16} fill="currentColor" />
              Demo Video
            </button>
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
        <p>Built with Django · React · Redis · Celery · Ollama · OpenAI</p>
      </footer>
    </div>
  );
};

export default LandingPage;
