'use client';

import { useEffect, useRef } from 'react';

export function DevGridBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number | null = null;
    let ultimoX = 0;
    let ultimoY = 0;

    function aplicar() {
      frame = null;
      spotlightRef.current?.style.setProperty('--mouse-x', `${ultimoX}px`);
      spotlightRef.current?.style.setProperty('--mouse-y', `${ultimoY}px`);
    }

    function handleMouseMove(e: MouseEvent) {
      ultimoX = e.clientX;
      ultimoY = e.clientY;
      if (frame === null) frame = requestAnimationFrame(aplicar);
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-950">
      <div
        ref={spotlightRef}
        style={{ '--mouse-x': '-1000px', '--mouse-y': '-1000px' } as React.CSSProperties}
        className="absolute inset-0 bg-[linear-gradient(to_right,#52525b_1px,transparent_1px),linear-gradient(to_bottom,#52525b_1px,transparent_1px)] bg-[size:48px_48px] opacity-60 transition-[mask-position] [mask-image:radial-gradient(220px_circle_at_var(--mouse-x)_var(--mouse-y),black,transparent)]"
      />
      <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
    </div>
  );
}
