import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Cpu, Download } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

/* ── Step data ── */
const STEPS = [
  {
    num: '01',
    icon: Upload,
    title: 'Upload',
    description:
      'Drag and drop your 2D blueprint PDF or image. Supported formats: PDF, PNG, JPG. Our system handles everything from scanned paper drawings to digital CAD exports.',
  },
  {
    num: '02',
    icon: Cpu,
    title: 'Analyze',
    description:
      'Our 6-stage AI pipeline runs wall detection, OCR text extraction, room assignment, topology validation, 3D model generation, and GIS risk analysis — all automatically.',
  },
  {
    num: '03',
    icon: Download,
    title: 'Export',
    description:
      'Download your 3D GLB model, generate compliance reports for 5 jurisdictions, export a full GIS risk analysis PDF, and share results via the Client Portal.',
  },
] as const;

const INTERVAL_MS = 3200;

/* ── Helpers ── */
/**
 * Given the active index (0,1,2) and a card index,
 * return its positional state: 'front' | 'left' | 'right'
 */
function getPos(activeIdx: number, cardIdx: number): 'front' | 'left' | 'right' {
  if (cardIdx === activeIdx) return 'front';
  // Which card is visually to the left vs right depends on rotation direction
  const total = STEPS.length;
  const diff = (cardIdx - activeIdx + total) % total;
  return diff === 1 ? 'right' : 'left';
}

/* ── Component ── */
export function HomeHowItWorks() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headerRef = useScrollReveal();

  /* Advance to next card */
  const advance = useCallback(() => {
    // Fade out text briefly for a smooth cross-fade
    setTextVisible(false);
    setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % STEPS.length);
      setTextVisible(true);
    }, 220);
  }, []);

  /* Auto-rotate */
  useEffect(() => {
    if (isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(advance, INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, advance]);

  /* Jump to a specific card (dot click) */
  const jumpTo = (idx: number) => {
    setTextVisible(false);
    setTimeout(() => {
      setActiveIdx(idx);
      setTextVisible(true);
    }, 220);
  };

  const active = STEPS[activeIdx];

  return (
    <section
      id="how-it-works"
      className="py-20 px-6"
      style={{
        background: 'hsl(var(--secondary, 40 15% 91%))',
        borderTop: '1px solid hsl(var(--border))',
        borderBottom: '1px solid hsl(var(--border))',
        overflow: 'hidden',
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* ── Section header ── */}
        <div
          ref={headerRef as React.RefObject<HTMLDivElement>}
          className="text-center mb-12"
        >
          <div className="hp-reveal">
            <p className="hp-eyebrow mb-3">The Process</p>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              From blueprint to insight in three steps
            </h2>
          </div>
        </div>

        {/* ── 3D Carousel ── */}
        <div
          className="hp-carousel-scene"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="hp-carousel-stage">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const pos = getPos(activeIdx, i);
              return (
                <div
                  key={step.num}
                  className="hp-carousel-card"
                  data-pos={pos}
                  onClick={() => jumpTo(i)}
                  style={{ cursor: pos !== 'front' ? 'pointer' : 'default' }}
                  aria-label={pos !== 'front' ? `Go to step ${step.num}` : undefined}
                >
                  {/* Ghost number */}
                  <span className="hp-carousel-num">{step.num}</span>

                  {/* Icon */}
                  <div className="hp-carousel-icon">
                    <Icon size={22} style={{ color: 'hsl(21 90% 44%)' }} />
                  </div>

                  {/* Title always visible on card */}
                  <h3
                    className="text-base font-semibold"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {step.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Progress dots ── */}
        <div className="hp-carousel-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`hp-carousel-dot${i === activeIdx ? ' active' : ''}`}
              onClick={() => jumpTo(i)}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* ── Active step description panel ── */}
        <div
          className="hp-carousel-text mx-auto mt-8 max-w-lg"
          style={{ opacity: textVisible ? 1 : 0 }}
        >
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {active.title}
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {active.description}
          </p>
        </div>

        {/* Hover hint */}
        <p
          className="text-center text-xs mt-5"
          style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.6 }}
        >
          Hover to pause · Click a card to jump
        </p>

      </div>
    </section>
  );
}
