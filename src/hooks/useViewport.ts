
import { useState, useEffect } from 'react';

interface ViewportSize {
  width: number;
  height: number;
}

interface ViewportInfo extends ViewportSize {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
}

export const useViewport = (): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile = viewport.width < 768;
  const isTablet = viewport.width >= 768 && viewport.width < 1024;
  const isDesktop = viewport.width >= 1024;
  const orientation = viewport.width > viewport.height ? 'landscape' : 'portrait';
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return {
    ...viewport,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    isTouch,
  };
};
