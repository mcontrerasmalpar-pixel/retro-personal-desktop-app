import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LANGUAGE_OPTIONS, resolveLanguage } from "./quotes";

const RANSOM_FONTS = [
  "'Alfa Slab One', serif",
  "'Abril Fatface', cursive",
  "'Pacifico', cursive",
  "'Lobster', cursive",
  "'Comic Neue', cursive",
  "'Courier Prime', monospace",
  "'VT323', monospace",
];

const RANSOM_COLORS = [
  "#000000", "#CC0000", "#000080", "#1a6b2a",
  "#FF6B9D", "#4D9DE0", "#E15FED", "#8B4513",
];

interface Particle {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  font: string;
  size: number;
  color: string;
  rotation: number;
  rotVel: number;
  landed: boolean;
  startTime: number;
  isSpace: boolean;
  target?: { x: number; y: number };
}

function initParticles(quote: string): Particle[] {
  const t0 = performance.now();
  return quote.split("").map((char, i) => ({
    char,
    x: 60 + Math.random() * (window.innerWidth - 120),
    y: -60 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 2,
    vy: 0.5 + Math.random() * 1.5,
    font: RANSOM_FONTS[Math.floor(Math.random() * RANSOM_FONTS.length)],
    size: 24 + Math.floor(Math.random() * 20),
    color: char.trim() === "" ? "transparent" : RANSOM_COLORS[Math.floor(Math.random() * RANSOM_COLORS.length)],
    rotation: (Math.random() - 0.5) * 25,
    rotVel: (Math.random() - 0.5) * 2,
    landed: false,
    startTime: t0 + i * 180,
    isSpace: char.trim() === "",
  }));
}

interface FallingLettersProps {
  quote: string;
  language: string;
  onComplete: (quote: string) => void;
  onClose: () => void;
}

export function FallingLetters({ quote, language, onComplete, onClose }: FallingLettersProps) {
  const particlesRef = useRef<Particle[] | null>(null);
  if (particlesRef.current === null) {
    particlesRef.current = initParticles(quote);
  }
  const particles = particlesRef.current;

  const letterEls = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement>(null);
  const fingerCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef(0);
  const cameraReadyRef = useRef(false);
  const fingerPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggedParticleRef = useRef<number | null>(null);
  const quoteSortedRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [quoteSorted, setQuoteSorted] = useState(false);
  const [fingerCursor, setFingerCursor] = useState<{ x: number; y: number } | null>(null);

  const triggerSort = useCallback(() => {
    const words = quote.split(" ").filter(w => w.length > 0);
    const AVG_CHAR_W = 18;
    const WORD_GAP = 24;
    const totalWidth = words.reduce((acc, w) => acc + w.length * AVG_CHAR_W, 0)
      + (words.length - 1) * WORD_GAP;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.45;
    let cursorX = centerX - totalWidth / 2;

    const allChars = quote.split("");
    const targets: { x: number; y: number }[] = [];

    for (let i = 0; i < allChars.length; i++) {
      if (allChars[i] === " ") {
        targets.push({ x: cursorX, y: centerY });
        cursorX += WORD_GAP;
      } else {
        targets.push({ x: cursorX, y: centerY });
        cursorX += AVG_CHAR_W;
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const tgt = targets[i];
      if (!tgt) continue;
      const dx = tgt.x - particles[i].x;
      const dy = tgt.y - particles[i].y;
      particles[i].vx = dx * 0.12;
      particles[i].vy = dy * 0.12;
      particles[i].landed = false;
      particles[i].target = tgt;
    }

    setTimeout(() => {
      for (let i = 0; i < particles.length; i++) {
        const tgt = targets[i];
        if (!tgt) continue;
        particles[i].x = tgt.x;
        particles[i].y = tgt.y;
        particles[i].vx = 0;
        particles[i].vy = 0;
        particles[i].rotation = (Math.random() - 0.5) * 8;
        particles[i].landed = true;
        particles[i].target = undefined;
      }
      quoteSortedRef.current = true;
      setQuoteSorted(true);
    }, 1800);
  }, [quote, particles]);

  // Auto-start camera on mount
  useEffect(() => {
    let mounted = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(true);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { width: 160, height: 120, facingMode: "user" } })
      .then(stream => {
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            cameraReadyRef.current = true;
            setCameraActive(true);
          });
        }
      })
      .catch(() => {
        if (mounted) setCameraError(true);
      });

    return () => {
      mounted = false;
      cameraReadyRef.current = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Physics + motion detection + finger tracking loop
  useEffect(() => {
    const FLOOR = window.innerHeight - 120;
    const GRID_W = 40;
    const GRID_H = 30;

    const detectMotion = () => {
      if (!cameraReadyRef.current || !videoRef.current || !motionCanvasRef.current) return;
      const ctx = motionCanvasRef.current.getContext("2d");
      if (!ctx) return;

      const W = GRID_W, H = GRID_H;
      motionCanvasRef.current.width = W;
      motionCanvasRef.current.height = H;

      try { ctx.drawImage(videoRef.current, 0, 0, W, H); } catch { return; }

      let current: Uint8ClampedArray;
      try { current = ctx.getImageData(0, 0, W, H).data; } catch { return; }

      if (prevFrameRef.current) {
        const prev = prevFrameRef.current;
        let totalMotionPixels = 0;
        const motionPoints: { gx: number; strength: number }[] = [];

        for (let py = 0; py < H; py += 2) {
          for (let px = 0; px < W; px += 2) {
            const idx = (py * W + px) * 4;
            const diff =
              Math.abs(current[idx]   - prev[idx]) +
              Math.abs(current[idx+1] - prev[idx+1]) +
              Math.abs(current[idx+2] - prev[idx+2]);

            if (diff > 40) {
              totalMotionPixels++;
              motionPoints.push({ gx: px, strength: diff / 255 });

              // Camera feed is mirrored — flip x
              const sx = (1 - px / W) * window.innerWidth;
              const sy = (py / H) * window.innerHeight;

              for (const p of particles) {
                if (p.isSpace) continue;
                const dx = p.x - sx;
                const dy = p.y - sy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 80 && dist > 0) {
                  const force = (80 - dist) / 80 * 1.2;
                  p.vx += (dx / dist) * force;
                  p.vy += (dy / dist) * force;
                  p.landed = false;
                }
              }
            }
          }
        }

        if (totalMotionPixels > 200) {
          let motionX = 0, count = 0;
          for (const { gx, strength } of motionPoints) {
            motionX += (1 - gx / W) * window.innerWidth * strength;
            count += strength;
          }
          if (count > 0) {
            motionX /= count;
            const randomIdx = Math.floor(Math.random() * particles.length);
            particles[randomIdx].x = motionX + (Math.random() - 0.5) * 60;
            particles[randomIdx].y = -40;
            particles[randomIdx].vy = 1 + Math.random() * 2;
            particles[randomIdx].vx = (Math.random() - 0.5) * 2;
            particles[randomIdx].landed = false;
          }
        }
      }

      prevFrameRef.current = new Uint8ClampedArray(current);
    };

    const detectFinger = () => {
      const video = videoRef.current;
      const canvas = fingerCanvasRef.current;
      if (!video || !canvas || !cameraReadyRef.current) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 80, H = 60;
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(video, 0, 0, W, H);
      const imageData = ctx.getImageData(0, 0, W, H);
      const data = imageData.data;

      let maxBrightness = 0;
      let fingerGx = -1, fingerGy = -1;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Skin tone: high red, medium green, low blue
          const skinScore = r > 100 && g > 50 && b < 140 && r > g && r > b
            ? (r - b) + (r - g) * 0.5
            : 0;

          if (skinScore > maxBrightness) {
            maxBrightness = skinScore;
            fingerGx = x;
            fingerGy = y;
          }
        }
      }

      if (maxBrightness > 60 && fingerGx >= 0) {
        // Mirror X because video is mirrored
        const screenX = (1 - fingerGx / W) * window.innerWidth;
        const screenY = (fingerGy / H) * window.innerHeight;
        fingerPosRef.current = { x: screenX, y: screenY };
      } else {
        fingerPosRef.current = null;
      }
    };

    const loop = (ts: number) => {
      frameCountRef.current++;
      if (frameCountRef.current % 2 === 0) {
        detectMotion();
        detectFinger();
      }

      // Finger drag logic
      const finger = fingerPosRef.current;
      if (finger) {
        setFingerCursor({ x: finger.x, y: finger.y });

        const dragging = draggedParticleRef.current;
        if (dragging !== null) {
          const p = particles[dragging];
          if (p && !p.isSpace) {
            p.x = p.x + (finger.x - p.x) * 0.4;
            p.y = p.y + (finger.y - p.y) * 0.4;
            p.vx = (finger.x - p.x) * 0.1;
            p.vy = (finger.y - p.y) * 0.1;
            p.landed = false;
          }
        } else {
          let closestIdx = -1;
          let closestDist = 50;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (p.isSpace) continue;
            const dist = Math.sqrt((p.x - finger.x) ** 2 + (p.y - finger.y) ** 2);
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = i;
            }
          }
          if (closestIdx >= 0) {
            draggedParticleRef.current = closestIdx;
          }
        }
      } else {
        draggedParticleRef.current = null;
        setFingerCursor(null);
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.isSpace || ts < p.startTime) continue;
        if (draggedParticleRef.current === i) continue;

        if (!p.landed) {
          if (p.target && !quoteSortedRef.current) {
            const dx = p.target.x - p.x;
            const dy = p.target.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 3) {
              p.x = p.target.x;
              p.y = p.target.y;
              p.vx = 0;
              p.vy = 0;
              p.landed = true;
            } else {
              p.vx = p.vx * 0.7 + dx * 0.15;
              p.vy = p.vy * 0.7 + dy * 0.15;
              p.y += p.vy;
              p.x += p.vx;
            }
          } else {
            p.vy += 0.08;
            p.vx = Math.max(-6, Math.min(6, p.vx));
            p.vy = Math.max(-6, Math.min(8, p.vy));
            p.y += p.vy;
            p.x += p.vx;
            p.vx *= 0.88;
            p.vy *= 0.92;
            p.rotation += p.rotVel;
            p.rotVel *= 0.97;

            if (p.y > FLOOR) {
              p.y = FLOOR;
              p.vy *= -0.25;
              p.vx *= 0.7;
              p.landed = true;
            }
            if (p.x < 20) { p.x = 20; p.vx = Math.abs(p.vx) * 0.5; }
            if (p.x > window.innerWidth - 20) {
              p.x = window.innerWidth - 20;
              p.vx = -Math.abs(p.vx) * 0.5;
            }
          }
        }

        const el = letterEls.current[i];
        if (el) el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [particles, triggerSort]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    let closestIdx = -1;
    let closestDist = 60;
    particles.forEach((p, i) => {
      if (p.isSpace) return;
      const dist = Math.sqrt((p.x - mouseX) ** 2 + (p.y - mouseY) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });
    if (closestIdx >= 0) {
      draggedParticleRef.current = closestIdx;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedParticleRef.current === null) return;
    const p = particles[draggedParticleRef.current];
    if (!p || p.isSpace) return;
    p.x = e.clientX;
    p.y = e.clientY;
    p.vx = 0;
    p.vy = 0;
    p.landed = false;
    const el = letterEls.current[draggedParticleRef.current];
    if (el) el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
  };

  const handleMouseUp = () => {
    draggedParticleRef.current = null;
  };

  const resolvedLang = resolveLanguage(language);
  const langOpt = LANGUAGE_OPTIONS.find(l => l.id === resolvedLang);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(255,255,255,0.87)",
        backdropFilter: "blur(3px)",
        zIndex: 9500,
        overflow: "hidden",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: "fixed",
          bottom: 80,
          right: 16,
          width: 200,
          height: 150,
          border: "2px solid",
          borderColor: "#fff #555 #555 #fff",
          boxShadow: "2px 2px 0 #808080",
          opacity: cameraActive ? 0.9 : 0,
          transform: "scaleX(-1)",
          zIndex: 8999,
          objectFit: "cover",
          borderRadius: 2,
        }}
      />

      <canvas ref={motionCanvasRef} style={{ display: "none" }} />
      <canvas ref={fingerCanvasRef} style={{ display: "none" }} />

      {particles.map((p, i) =>
        p.isSpace ? null : (
          <div
            key={i}
            ref={el => { letterEls.current[i] = el; }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
              fontFamily: p.font,
              fontSize: p.size,
              color: p.color,
              cursor: "grab",
              userSelect: "none",
              willChange: "transform",
              lineHeight: 1,
              whiteSpace: "nowrap",
              WebkitTextStroke: "0.4px rgba(0,0,0,0.08)",
            } as React.CSSProperties}
          >
            {p.char}
          </div>
        )
      )}

      {langOpt && (
        <div
          style={{
            position: "fixed",
            bottom: 72,
            left: 20,
            fontFamily: "'VT323', monospace",
            fontSize: 14,
            color: "rgba(0,0,0,0.28)",
            pointerEvents: "none",
            letterSpacing: 0.5,
          }}
        >
          {langOpt.flag} {langOpt.label} · figure it out ✦
        </div>
      )}

      {cameraActive && (
        <div style={{
          position: "fixed",
          bottom: 234,
          right: 16,
          fontFamily: "'VT323', monospace",
          fontSize: 13,
          color: "rgba(0,0,0,0.5)",
          zIndex: 8999,
          textAlign: "right",
          pointerEvents: "none",
        }}>
          move your hands ✦
        </div>
      )}

      {cameraError && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            fontFamily: "'VT323', monospace",
            fontSize: 13,
            color: "#CC0000",
            background: "#fff",
            border: "1px solid #CC0000",
            padding: "4px 8px",
            zIndex: 9501,
          }}
        >
          camera unavailable — use mouse to catch words
        </div>
      )}

      {fingerCursor && (
        <div style={{
          position: "fixed",
          left: fingerCursor.x - 12,
          top: fingerCursor.y - 12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "2px solid #FF6B9D",
          background: "rgba(255, 107, 157, 0.2)",
          pointerEvents: "none",
          zIndex: 8998,
          transform: draggedParticleRef.current !== null ? "scale(1.4)" : "scale(1)",
          transition: "transform 0.1s",
        }} />
      )}

      {!quoteSorted && (
        <button
          onClick={triggerSort}
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'VT323', monospace",
            fontSize: 18,
            background: "#C0C0C0",
            border: "2px solid",
            borderColor: "#fff #555 #555 #fff",
            padding: "4px 16px",
            cursor: "pointer",
            zIndex: 9001,
            letterSpacing: 1,
            boxShadow: "2px 2px 0 #808080",
          }}
        >
          ✦ click to assemble
        </button>
      )}

      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 20,
          right: 24,
          fontFamily: "'VT323', monospace",
          fontSize: 17,
          color: "#808080",
          cursor: "pointer",
          letterSpacing: 0.5,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#000")}
        onMouseLeave={e => (e.currentTarget.style.color = "#808080")}
      >
        ✕ skip
      </div>

      {quoteSorted && (
        <button
          onClick={() => onComplete(quote)}
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#000080",
            color: "#fff",
            border: "2px solid",
            borderColor: "#fff #555 #555 #fff",
            padding: "6px 28px",
            fontFamily: "'VT323', monospace",
            fontSize: 20,
            cursor: "pointer",
            boxShadow: "2px 2px 0 #808080",
            whiteSpace: "nowrap",
            zIndex: 9501,
          }}
        >
          ✦ save this quote
        </button>
      )}
    </div>,
    document.body
  );
}
