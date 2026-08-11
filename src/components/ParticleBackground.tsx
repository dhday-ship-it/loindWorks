"use client";

import { useEffect, useRef } from "react";

interface Orb {
  nx: number;
  ny: number;
  r: number;
  alpha: number;
  speed: number;
  phase: number;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  a: number;
  vx: number;
  vy: number;
}

const ORBS: Orb[] = [
  { nx: 0.18, ny: 0.22, r: 0.42, alpha: 0.12, speed: 0.0004, phase: 0.0 },
  { nx: 0.72, ny: 0.7, r: 0.32, alpha: 0.09, speed: 0.0003, phase: 1.8 },
  { nx: 0.5, ny: 0.48, r: 0.2, alpha: 0.06, speed: 0.0006, phase: 3.5 },
];

export function ParticleBackground({
  rgb = "85,104,155",
  bg = "#0e1116",
}: {
  /** "r,g,b" string used for the glowing orbs */
  rgb?: string;
  bg?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let frame = 0;
    let animationId: number;

    const dots: Dot[] = Array.from({ length: 50 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.18 + 0.08,
      vx: (Math.random() - 0.5) * 0.0001,
      vy: (Math.random() - 0.5) * 0.0001,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      for (const o of ORBS) {
        const t = frame * o.speed;
        const px = (o.nx + Math.sin(t + o.phase) * 0.1) * W;
        const py = (o.ny + Math.cos(t + o.phase * 0.7) * 0.08) * H;
        const r = o.r * Math.min(W, H);
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, r);
        gradient.addColorStop(0, `rgba(${rgb},${o.alpha})`);
        gradient.addColorStop(1, `rgba(${rgb},0)`);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      for (const p of dots) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
      }

      frame++;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [rgb, bg]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
