import { useState } from 'react';
import { Link } from 'react-router-dom';

const PulseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h4l2-7 4 14 3-9 2 2h5" />
  </svg>
);

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For you',      href: '#for-you' },
  { label: 'Contact',      href: '#contact' },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);

  const handleAnchor = (e, href) => {
    e.preventDefault();
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-stone">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-6">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient rounded-md">
          <div className="w-[34px] h-[34px] rounded-xl bg-patient flex items-center justify-center shadow-soft">
            <PulseIcon />
          </div>
          <span className="font-display font-semibold text-lg text-ink">CliniQ</span>
        </Link>

        {/* Center links — desktop */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={e => handleAnchor(e, l.href)}
              className="text-sm font-medium text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient rounded-sm"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right CTAs — desktop */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            to="/login"
            className="text-sm font-semibold text-ink-soft hover:text-ink px-4 py-2 rounded-xl border border-stone hover:border-stone-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-bold text-white px-4 py-2 rounded-xl bg-gradient-to-r from-patient to-doctor hover:opacity-90 transition-opacity shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient"
          >
            Get started →
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
          className="md:hidden p-2 rounded-md text-ink-soft hover:text-ink hover:bg-paper-dim transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient"
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Mobile slide-down */}
      {open && (
        <div className="md:hidden border-t border-stone bg-paper px-5 py-4 space-y-3 animate-fadeIn">
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={e => handleAnchor(e, l.href)}
              className="block text-sm font-medium text-ink-soft hover:text-ink py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient rounded-sm"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2 border-t border-stone">
            <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-semibold text-center text-ink border border-stone rounded-xl py-2.5 hover:bg-paper-dim transition-colors">
              Log in
            </Link>
            <Link to="/register" onClick={() => setOpen(false)} className="text-sm font-bold text-center text-white rounded-xl py-2.5 bg-gradient-to-r from-patient to-doctor hover:opacity-90 transition-opacity">
              Get started →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
