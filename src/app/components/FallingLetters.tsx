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

interface DragState {
  idx: number;
  offsetX: number;
  offsetY: number;
  lastX: number;
  lastY: number;
  velX: number;
  velY: number;
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
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const frameCountRef = useRef(0);
  const cameraReadyRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const lastClapRef = useRef<number>(0);
  const clapCountRef = useRef(0);
  const firstClapTimeRef = useRef(0);
  const quoteSortedRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [clapDetected, setClapDetected] = useState(false);
  const [quoteSorted, setQuoteSorted] = useState(false);

  const triggerSort = useCallback(() => {
    setClapDetected(true);
    setTimeout(() => setClapDetected(false), 600);

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

  // Auto-start camera and microphone on mount
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

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(stream => {
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        micStreamRef.current = stream;
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
      })
      .catch(() => {
        // mic not available — clap detection disabled, button fallback only
      });

    return () => {
      mounted = false;
      cameraReadyRef.current = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  // Physics + motion detection + clap detection loop
  useEffect(() => {
    const FLOOR = window.innerHeight - 120;
    const GRID_W = 40;
    const GRID_H = 30;

    const checkClap = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      const now = performance.now();

      if (avg > 55 && now - lastClapRef.current > 300) {
        lastClapRef.current = now;
        if (clapCountRef.current === 0) {
          clapCountRef.current = 1;
          firstClapTimeRef.current = now;
        } else if (clapCountRef.current === 1) {
          if (now - firstClapTimeRef.current < 1500) {
            clapCountRef.current = 0;
            triggerSort();
          } else {
            clapCountRef.current = 1;
            firstClapTimeRef.current = now;
          }
        }
      }

      if (clapCountRef.current === 1 && now - firstClapTimeRef.current > 2000) {
        clapCountRef.current = 0;
      }
    };

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

    const loop = (ts: number) => {
      frameCountRef.current++;
      if (frameCountRef.current % 3 === 0) {
        detectMotion();
        checkClap();
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.isSpace || ts < p.startTime) continue;
        if (dragRef.current?.idx === i) continue;

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

  const handleMouseDown = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    const p = particles[i];
    p.landed = false;
    dragRef.current = {
      idx: i,
      offsetX: e.clientX - p.x,
      offsetY: e.clientY - p.y,
      lastX: e.clientX,
      lastY: e.clientY,
      velX: 0,
      velY: 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    const p = particles[d.idx];
    d.velX = e.clientX - d.lastX;
    d.velY = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    p.x = e.clientX - d.offsetX;
    p.y = e.clientY - d.offsetY;
    const el = letterEls.current[d.idx];
    if (el) el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
  };

  const handleMouseUp = () => {
    if (!dragRef.current) return;
    const { idx, velX, velY } = dragRef.current;
    particles[idx].vx = velX * 0.5;
    particles[idx].vy = velY * 0.5;
    dragRef.current = null;
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
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <style>{`
        @keyframes clapFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {clapDetected && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(255, 230, 102, 0.3)",
          pointerEvents: "none",
          zIndex: 8999,
          animation: "clapFlash 0.6s ease forwards",
        }} />
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: "fixed",
          bottom: 80, right: 16,
          width: 100, height: 75,
          border: "2px solid",
          borderColor: "#fff #555 #555 #fff",
          opacity: cameraActive ? 0.7 : 0,
          transform: "scaleX(-1)",
          zIndex: 8999,
          objectFit: "cover",
        }}
      />

      <canvas ref={motionCanvasRef} style={{ display: "none" }} />

      {particles.map((p, i) =>
        p.isSpace ? null : (
          <div
            key={i}
            ref={el => { letterEls.current[i] = el; }}
            onMouseDown={e => handleMouseDown(i, e)}
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
        <div
          style={{
            position: "fixed",
            bottom: 160,
            right: 16,
            fontFamily: "'VT323', monospace",
            fontSize: 11,
            color: "rgba(0,0,0,0.3)",
            pointerEvents: "none",
            textAlign: "right",
          }}
        >
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
          📷 camera unavailable — use mouse to catch words
        </div>
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
          }}
        >
          👏👏 clap twice or click to assemble ✦
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
