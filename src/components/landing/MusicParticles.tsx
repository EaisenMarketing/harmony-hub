import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  symbol: string;
  rotation: number;
  rotationSpeed: number;
  hue: number;
}

const MUSIC_SYMBOLS = ['♪', '♫', '♬', '♩', '𝄞', '𝄢'];

export function MusicParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const createParticle = useCallback((width: number, height: number): Particle => ({
    x: Math.random() * width,
    y: height + 20,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -(0.3 + Math.random() * 0.8),
    size: 12 + Math.random() * 20,
    opacity: 0.1 + Math.random() * 0.4,
    symbol: MUSIC_SYMBOLS[Math.floor(Math.random() * MUSIC_SYMBOLS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    hue: Math.random() > 0.5 ? 239 : 160,
  }), []);

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Initialize particles
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const p = createParticle(window.innerWidth, window.innerHeight);
      p.y = Math.random() * window.innerHeight;
      particlesRef.current.push(p);
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY + window.scrollY };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let lastFrame = 0;

    const animate = (time = 0) => {
      if (time - lastFrame < 50) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrame = time;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Mouse influence
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          p.vx -= dx * 0.0003;
          p.vy -= dy * 0.0003;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.999;

        // Remove out of bounds
        if (p.y < -50 || p.x < -50 || p.x > canvas.width + 50) {
          particles.splice(i, 1);
          particles.push(createParticle(window.innerWidth, window.innerHeight));
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = `hsla(${p.hue}, 84%, 67%, ${p.opacity})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] hidden md:block"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
