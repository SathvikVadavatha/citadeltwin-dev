import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, Mail } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function HomeCTASection() {
  const navigate = useNavigate();
  const ref = useScrollReveal();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 px-6"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, hsl(21 90% 48% / 0.10) 0%, transparent 60%),
          hsl(var(--background))
        `,
        borderTop: '1px solid hsl(var(--border))',
      }}
    >
      <div className="max-w-2xl mx-auto text-center hp-reveal">

        <p className="hp-eyebrow mb-4">Get Started</p>

        <h2
          className="text-3xl md:text-4xl font-bold mb-5"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Ready to build your first digital twin?
        </h2>

        <p
          className="text-base leading-relaxed mb-8"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Built for construction teams and real estate developers. Reduce compliance
          risk and accelerate project delivery with AI-powered digital twins.
        </p>

        <button
          className="hp-glow-btn text-base"
          style={{ padding: '14px 40px' }}
          onClick={() => navigate('/blueprints/upload')}
        >
          Upload Your Blueprint <ArrowRight size={17} />
        </button>

        <div className="mt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'hsl(21 90% 44%)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Or go to your Dashboard →
          </button>
        </div>

        <p className="mt-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Free to get started · Backed by Community Dreams Foundation
        </p>

        {/* Contact strip */}
        <div
          className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8"
          style={{ borderTop: '1px solid hsl(var(--border))' }}
        >
          <a href="tel:+14072594242" className="hp-contact-link">
            <Phone size={15} style={{ color: 'hsl(21 90% 44%)' }} />
            +1 (407) 259-4242
          </a>
          <a href="mailto:info@cdreams.org" className="hp-contact-link">
            <Mail size={15} style={{ color: 'hsl(21 90% 44%)' }} />
            info@cdreams.org
          </a>
        </div>
      </div>
    </section>
  );
}
