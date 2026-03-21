import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStore } from '../store/useStore';

export const Toast: React.FC = () => {
  const toast = useStore((s) => s.toast);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast || !ref.current) return;

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 40, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
    );

    const timer = setTimeout(() => {
      if (ref.current) {
        gsap.to(ref.current, { opacity: 0, y: 20, scale: 0.95, duration: 0.3, ease: 'power2.in' });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div ref={ref} className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 ${
      toast.type === 'success'
        ? 'bg-primary text-on-primary'
        : 'bg-error text-on-error'
    }`}>
      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
        {toast.type === 'success' ? 'check_circle' : 'error'}
      </span>
      {toast.message}
    </div>
  );
};
