import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ShieldCheck, Map, Activity, FileText, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const FEATURES = [
  {
    icon: Layers,
    title: '2D → 3D Conversion',
    description:
      'Upload any 2D blueprint. Our 6-stage AI pipeline — YOLO wall detection, OCR text extraction, and trimesh GLB export — generates accurate 3D models in minutes.',
    accent: 'hsl(215 20% 33%)',
    accentDim: 'hsl(215 20% 33% / 0.10)',
    route: '/blueprints/upload',
    comingSoon: false,
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Analysis',
    description:
      'Instantly check building codes across Ohio, Florida, NYC, California, and Texas plus live federal eCFR regulations. Always up to date.',
    accent: 'hsl(142 60% 35%)',
    accentDim: 'hsl(142 60% 35% / 0.10)',
    route: '/compliance',
    comingSoon: false,
  },
  {
    icon: Map,
    title: 'GIS & Risk Analysis',
    description:
      'Real flood zone data from FEMA, protected areas from USGS, wetlands from USFWS, soil data from USDA, and disaster history from OpenFEMA — for any US address.',
    accent: 'hsl(21 90% 44%)',
    accentDim: 'hsl(21 90% 44% / 0.10)',
    route: '/gis',
    comingSoon: false,
  },
  {
    icon: Activity,
    title: 'FEA Structural Analysis',
    description:
      'Finite Element Analysis for structural integrity simulation. Identify load-bearing risks before construction begins.',
    accent: 'hsl(38 90% 44%)',
    accentDim: 'hsl(38 90% 44% / 0.10)',
    route: '/dashboard',
    comingSoon: true,
  },
  {
    icon: FileText,
    title: 'Document Management',
    description:
      'Generate permit packages, compliance reports, and GIS analysis PDFs. Centralize all project documentation in one place.',
    accent: 'hsl(270 60% 50%)',
    accentDim: 'hsl(270 60% 50% / 0.10)',
    route: '/documents',
    comingSoon: false,
  },
];

export function HomeFeaturesSection() {
  const navigate = useNavigate();
  const ref = useScrollReveal();

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLElement>}
      className="hp-blueprint-grid py-20 px-6"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14 hp-reveal">
          <p className="hp-eyebrow mb-3">Platform Capabilities</p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            Everything you need to build smarter
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Five integrated tools covering the full lifecycle of a construction project.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const stagger = i < 5 ? `hp-stagger-${i + 1}` : '';
            const isLast = i === FEATURES.length - 1;
            return (
              <div
                key={f.title}
                className={`hp-feature-card hp-reveal ${stagger} flex flex-col gap-4 ${
                  isLast ? 'sm:col-start-1 lg:col-start-2' : ''
                }`}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 48,
                    height: 48,
                    background: f.accentDim,
                    border: `1px solid ${f.accent}33`,
                  }}
                >
                  <Icon size={22} style={{ color: f.accent }} />
                </div>

                {/* Title + coming soon */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    {f.title}
                  </h3>
                  {f.comingSoon && <span className="hp-coming-soon">Coming Soon</span>}
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {f.description}
                </p>

                {/* Explore link */}
                {!f.comingSoon && (
                  <button
                    onClick={() => navigate(f.route)}
                    className="flex items-center gap-1 text-sm font-medium mt-auto self-start transition-opacity hover:opacity-70"
                    style={{ color: f.accent }}
                  >
                    Explore <ArrowRight size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
