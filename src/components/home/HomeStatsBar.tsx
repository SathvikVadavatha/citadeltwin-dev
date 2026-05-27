import React from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const STATS = [
  { value: '10+',  label: 'Active Projects' },
  { value: '5',    label: 'Jurisdictions Covered' },
  { value: '6',    label: 'Federal Data Sources' },
  { value: '89%',  label: 'AI Detection Accuracy' },
];

export function HomeStatsBar() {
  const ref = useScrollReveal();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        background: 'hsl(var(--card))',
        borderTop: '1px solid hsl(var(--border))',
        borderBottom: '1px solid hsl(var(--border))',
        padding: '40px 24px',
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-0 md:divide-x md:divide-border">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`hp-reveal hp-stagger-${i + 1} flex flex-col items-center text-center px-8`}
          >
            <span
              className="hp-accent-text text-4xl font-bold"
            >
              {stat.value}
            </span>
            <span
              className="text-sm mt-1"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
