import { useEffect, useRef } from 'react';

/**
 * useScrollReveal
 * Observes child elements with class hp-reveal, hp-reveal-left, hp-reveal-right.
 * Adds is-visible when they enter the viewport. Fires once per element.
 */
export function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    const targets = container.querySelectorAll(
      '.hp-reveal, .hp-reveal-left, .hp-reveal-right'
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [threshold]);

  return ref as React.RefObject<HTMLElement>;
}
