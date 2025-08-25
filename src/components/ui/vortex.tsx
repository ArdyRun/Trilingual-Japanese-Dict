import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useCallback } from "react";
import { createNoise3D } from "simplex-noise";
import { motion } from "motion/react";

import { ReactNode } from "react";

interface VortexProps {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  rangeHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
  backgroundColor?: string;
}

export const Vortex = (props: VortexProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const tickRef = useRef(0);
  const particlePropsRef = useRef<Float32Array>(new Float32Array(0));
  const particleCount = props.particleCount || 700;
  const particlePropCount = 9;
  const particlePropsLength = particleCount * particlePropCount;
  const rangeY = props.rangeY || 100;
  const baseTTL = 50;
  const rangeTTL = 150;
  const baseSpeed = props.baseSpeed || 0.0;
  const rangeSpeed = props.rangeSpeed || 1.5;
  const baseRadius = props.baseRadius || 1;
  const rangeRadius = props.rangeRadius || 2;
  const baseHue = props.baseHue || 0;
  const rangeHue = props.rangeHue || 20;
  const noiseSteps = 3;
  const xOff = 0.00125;
  const yOff = 0.00125;
  const zOff = 0.0005;
  const backgroundColor = props.backgroundColor || "#000000";
  const noise3D = createNoise3D();

  const TAU: number = 2 * Math.PI;
  const rand = useCallback((n: number): number => n * Math.random(), []);
  const randRange = useCallback((n: number): number => n - rand(2 * n), [rand]);
  const fadeInOut = useCallback((t: number, m: number): number => {
    const hm = 0.5 * m;
    return Math.abs(((t + hm) % m) - hm) / hm;
  }, []);
  const lerp = useCallback((n1: number, n2: number, speed: number): number =>
    (1 - speed) * n1 + speed * n2, []);

  // Define all functions in the correct order to avoid circular dependencies
  const initParticle = useCallback((i: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = rand(canvas.width);
    // Calculate center directly instead of using ref
    const centerY = canvas.height / 2;
    const y = centerY + randRange(rangeY);
    const vx = 0;
    const vy = 0;
    const life = 0;
    const ttl = baseTTL + rand(rangeTTL);
    const speed = baseSpeed + rand(rangeSpeed);
    const radius = baseRadius + rand(rangeRadius);
    const hue = baseHue + rand(rangeHue);

    particlePropsRef.current.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
  }, [rand, randRange, baseTTL, rangeTTL, baseSpeed, rangeSpeed, baseRadius, rangeRadius, baseHue, rangeHue, rangeY]);

  const initParticles = useCallback(() => {
    tickRef.current = 0;
    particlePropsRef.current = new Float32Array(particlePropsLength);

    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      initParticle(i);
    }
  }, [particlePropsLength, particlePropCount, initParticle]);

  const drawParticle = useCallback((
    x: number,
    y: number,
    x2: number,
    y2: number,
    life: number,
    ttl: number,
    radius: number,
    hue: number,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = radius;
    
    // Create red family colors (red, pink, white)
    let color;
    if (hue < 5) {
      // White particles
      color = `hsla(0, 0%, 100%, ${fadeInOut(life, ttl)})`;
    } else if (hue < 15) {
      // Pink particles
      color = `hsla(350, 100%, 70%, ${fadeInOut(life, ttl)})`;
    } else {
      // Red particles
      color = `hsla(0, 100%, 60%, ${fadeInOut(life, ttl)})`;
    }
    
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }, [fadeInOut]);

  const checkBounds = useCallback((x: number, y: number, canvas: HTMLCanvasElement) => {
    return x > canvas.width || x < 0 || y > canvas.height || y < 0;
  }, []);

  const updateParticle = useCallback((i: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const i2 = 1 + i,
      i3 = 2 + i,
      i4 = 3 + i,
      i5 = 4 + i,
      i6 = 5 + i,
      i7 = 6 + i,
      i8 = 7 + i,
      i9 = 8 + i;
    const x = particlePropsRef.current[i];
    const y = particlePropsRef.current[i2];
    const n = noise3D(x * xOff, y * yOff, tickRef.current * zOff) * noiseSteps * TAU;
    const vx = lerp(particlePropsRef.current[i3], Math.cos(n), 0.5);
    const vy = lerp(particlePropsRef.current[i4], Math.sin(n), 0.5);
    let life = particlePropsRef.current[i5];
    const ttl = particlePropsRef.current[i6];
    const speed = particlePropsRef.current[i7];
    const x2 = x + vx * speed;
    const y2 = y + vy * speed;
    const radius = particlePropsRef.current[i8];
    const hue = particlePropsRef.current[i9];

    drawParticle(x, y, x2, y2, life, ttl, radius, hue);

    life++;

    particlePropsRef.current[i] = x2;
    particlePropsRef.current[i2] = y2;
    particlePropsRef.current[i3] = vx;
    particlePropsRef.current[i4] = vy;
    particlePropsRef.current[i5] = life;

    if (checkBounds(x, y, canvas) || life > ttl) {
      initParticle(i);
    }
  }, [initParticle, drawParticle, checkBounds, noise3D, xOff, yOff, zOff, noiseSteps, TAU, lerp]);

  const drawParticles = useCallback(() => {
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      updateParticle(i);
    }
  }, [particlePropsLength, particlePropCount, updateParticle]);

  const renderGlow = useCallback((
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) => {
    ctx.save();
    ctx.filter = "blur(8px) brightness(200%)";
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.filter = "blur(4px) brightness(200%)";
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  }, []);

  const renderToScreen = useCallback((
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  }, []);

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    tickRef.current++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawParticles();
    renderGlow(canvas, ctx);
    renderToScreen(canvas, ctx);

    animationFrameId.current = window.requestAnimationFrame(() =>
      draw(canvas, ctx),
    );
  }, [backgroundColor, drawParticles, renderGlow, renderToScreen]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      const containerRect = container.getBoundingClientRect();
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
    }
  }, []);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      // Use container dimensions instead of window dimensions
      const containerRect = container.getBoundingClientRect();
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      
      initParticles();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        draw(canvas, ctx);
      }
    }
  }, [draw, initParticles]);

  useEffect(() => {
    setup();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [handleResize, setup]);

  return (
    <div className={cn("relative h-full w-full", props.containerClassName)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        ref={containerRef}
        className="absolute inset-0 z-0 flex h-full w-full items-center justify-center bg-transparent"
      >
        <canvas ref={canvasRef}></canvas>
      </motion.div>

      <div className={cn("relative z-10", props.className)}>
        {props.children}
      </div>
    </div>
  );
};