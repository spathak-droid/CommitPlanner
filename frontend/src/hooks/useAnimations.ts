import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

// Stagger children into view
export function useStaggerReveal(deps: unknown[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const children = el.children;
    if (children.length === 0) return;

    gsap.fromTo(
      children,
      { opacity: 0, y: 30, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'all',
      }
    );
  }, deps);

  return containerRef;
}

// Fade + slide in a single element
export function useFadeIn(direction: 'up' | 'down' | 'left' | 'right' = 'up', deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from: gsap.TweenVars = { opacity: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' };
    if (direction === 'up') from.y = 40;
    if (direction === 'down') from.y = -40;
    if (direction === 'left') from.x = 40;
    if (direction === 'right') from.x = -40;

    gsap.from(el, from);
  }, deps);

  return ref;
}

// Animate a number counting up
export function useCountUp(target: number, duration = 1.2, deps: unknown[] = []) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toString();
      },
    });
  }, [target, ...deps]);

  return ref;
}

// Animate SVG circle stroke (for the alignment ring)
export function useCircleReveal(percentage: number, deps: unknown[] = []) {
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const circumference = 552.92;
    const targetOffset = circumference - (circumference * percentage / 100);

    gsap.fromTo(
      el,
      { strokeDashoffset: circumference },
      {
        strokeDashoffset: targetOffset,
        duration: 1.5,
        ease: 'power3.out',
        delay: 0.3,
      }
    );
  }, [percentage, ...deps]);

  return ref;
}

// Progress bar fill animation
export function useBarFill(percentage: number, delay = 0, deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { width: '0%' },
      {
        width: `${percentage}%`,
        duration: 1,
        delay: 0.3 + delay,
        ease: 'power3.out',
      }
    );
  }, [percentage, ...deps]);

  return ref;
}

// Page transition wrapper
export function usePageTransition(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  }, deps);

  return ref;
}

// Hover scale effect
export function useHoverPop() {
  const onEnter = useCallback((e: React.MouseEvent) => {
    gsap.to(e.currentTarget, { scale: 1.02, duration: 0.2, ease: 'power2.out' });
  }, []);

  const onLeave = useCallback((e: React.MouseEvent) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });
  }, []);

  return { onMouseEnter: onEnter, onMouseLeave: onLeave };
}

// Magnetic button effect
export function useMagneticButton() {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * 0.15, y: y * 0.15, duration: 0.3, ease: 'power2.out' });
    };

    const handleLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);

    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return ref;
}
