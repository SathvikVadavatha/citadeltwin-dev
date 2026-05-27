import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, ArrowRight } from 'lucide-react';

export function HomeHeroSection() {
  const navigate = useNavigate();

  return (
    <section
      className="hp-blueprint-grid relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-32"
      style={{
        background: 'hsl(var(--background))',
        minHeight: '88vh',
      }}
    >
      {/* Radial glow behind content */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, hsl(21 90% 48% / 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">

        {/* Badge */}
        <div className="hp-badge hp-hero-badge">
          <span className="hp-pulse-dot" />
          AI-Powered Digital Twin Platform
        </div>

        {/* H1 */}
        <h1
          className="hp-hero-h1 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Transform Blueprints Into{' '}
          <span className="hp-accent-text">Intelligent Digital Twins</span>
        </h1>

        {/* Subtitle */}
        <p
          className="hp-hero-sub text-base md:text-lg max-w-xl leading-relaxed"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          From 2D blueprints to 3D models, compliance checks, and real-time GIS
          risk analysis — powered by FEMA, USGS, and federal data sources.
        </p>

        {/* CTAs */}
        <div className="hp-hero-ctas flex flex-wrap gap-3 justify-center">
          <button
            className="hp-glow-btn"
            onClick={() => navigate('/blueprints/upload')}
          >
            Get Started <ArrowRight size={16} />
          </button>
          <button
            className="hp-outline-btn"
            onClick={() =>
              document
                .getElementById('how-it-works')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            How It Works
          </button>
        </div>

        {/* Trust row */}
        <div
          className="hp-hero-trust flex flex-wrap gap-4 justify-center text-sm"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {['Real federal data', '5 jurisdictions covered', 'Free to get started'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <Check size={13} style={{ color: 'hsl(21 90% 44%)' }} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="hp-scroll-bounce absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <ChevronDown size={22} />
      </div>
    </section>
  );
}
