import React from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const SOURCES = [
  { short: 'FEMA NFHL',   full: 'National Flood Hazard Layer',          desc: 'Real flood zone boundaries for every US address.' },
  { short: 'USGS PAD-US', full: 'Protected Areas Database',             desc: 'National parks, refuges, and conservation lands.' },
  { short: 'USFWS NWI',   full: 'National Wetlands Inventory',          desc: 'Wetland type, status, and boundary data.' },
  { short: 'USDA SSURGO', full: 'Soil Survey Geographic Database',      desc: 'Soil composition and load capacity data.' },
  { short: 'OpenFEMA',    full: 'Open FEMA Dataset API',                desc: 'Federal disaster declarations and historical timeline.' },
  { short: 'eCFR',        full: 'Electronic Code of Federal Regulations', desc: 'Live federal building code search and lookup.' },
];

export function HomeDataSources() {
  const ref = useScrollReveal();

  return (
    <section
      id="data-sources"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-20 px-6"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14 hp-reveal">
          <p className="hp-eyebrow mb-3">Powered By Real Data</p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            Built on trusted federal data sources
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Not synthetic, not estimated. CitadelTwin pulls live data from the same federal
            databases used by engineers, planners, and compliance officers.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SOURCES.map((s, i) => {
            const stagger = `hp-stagger-${(i % 3) + 1}`;
            return (
              <div key={s.short} className={`hp-source-card hp-reveal ${stagger}`}>
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-lg font-bold"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {s.short}
                  </span>
                  <span className="hp-live-badge ml-2 mt-0.5 shrink-0">Live</span>
                </div>
                <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {s.full}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
