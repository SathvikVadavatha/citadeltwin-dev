
import React, { useState, useRef, useEffect } from 'react';
import { useViewport } from '@/hooks/useViewport';

interface SwipeableViewsProps {
  children: React.ReactNode[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
}

export const SwipeableViews: React.FC<SwipeableViewsProps> = ({
  children,
  activeIndex,
  onIndexChange,
  className = ''
}) => {
  const { isMobile, isTouch } = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  useEffect(() => {
    setTranslateX(-activeIndex * 100);
  }, [activeIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTouch) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isTouch) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    const newTranslateX = -activeIndex * 100 + (diff / window.innerWidth) * 100;
    
    setTranslateX(newTranslateX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !isTouch) return;
    
    setIsDragging(false);
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    const threshold = window.innerWidth * 0.3; // 30% of screen width
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && activeIndex > 0) {
        onIndexChange(activeIndex - 1);
      } else if (diff < 0 && activeIndex < children.length - 1) {
        onIndexChange(activeIndex + 1);
      }
    }
    
    setTranslateX(-activeIndex * 100);
  };

  if (!isMobile) {
    // For non-mobile, just show the active view
    return (
      <div className={className}>
        {children[activeIndex]}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateX(${translateX}%)`,
          width: `${children.length * 100}%`
        }}
      >
        {children.map((child, index) => (
          <div 
            key={index}
            className="w-full flex-shrink-0"
            style={{ width: `${100 / children.length}%` }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};
