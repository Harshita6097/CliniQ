import { Link } from 'react-router-dom';

const handleAnchor = (e, href) => {
  e.preventDefault();
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
};

export default function LandingFooter() {
  return (
    <footer id="contact" className="bg-ink text-[#cfc6d1]">
      {/* Gradient strip */}
      <div className="h-[3px] bg-gradient-to-r from-patient via-doctor to-admin" />

      <div className="max-w-6xl mx-auto px-5 py-10">
        {/* Main row */}
        <div className="flex flex-wrap justify-between items-center gap-5">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-patient flex items-center justify-center shadow-soft">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h4l2-7 4 14 3-9 2 2h5" />
              </svg>
            </div>
            <span className="font-display font-semibold text-base text-white">CliniQ</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <a
              href="#how-it-works"
              onClick={e => handleAnchor(e, '#how-it-works')}
              className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient rounded-sm"
            >
              How it works
            </a>
            <Link to="/login" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient rounded-sm">
              Log in
            </Link>
            <Link to="/register" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient rounded-sm">
              Create account
            </Link>
            <a
              href="https://github.com/Harshita6097/CliniQ"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient rounded-sm"
            >
              GitHub
            </a>
            <a
              href="#contact"
              onClick={e => handleAnchor(e, '#contact')}
              className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient rounded-sm"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Bottom line */}
        <div className="border-t border-white/10 mt-6 pt-5">
          <p className="text-xs text-[#8a8092]">
            © 2026 CliniQ. Built as a full-stack healthcare platform demo.
          </p>
        </div>
      </div>
    </footer>
  );
}
