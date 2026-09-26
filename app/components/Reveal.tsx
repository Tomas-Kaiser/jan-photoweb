"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in ms. */
  delay?: number;
  className?: string;
};

/**
 * Fades and slides content in once as it scrolls into view.
 * Content is visible on the server render and for reduced-motion users;
 * only elements that start below the fold are hidden after hydration.
 */
export default function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already on screen at load: leave it alone so nothing flashes.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    el.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out motion-safe:data-[reveal=hidden]:translate-y-6 motion-safe:data-[reveal=hidden]:opacity-0 ${className}`}
    >
      {children}
    </div>
  );
}
