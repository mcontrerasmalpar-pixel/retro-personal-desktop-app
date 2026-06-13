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

const PAPER_COLORS = [
  "#FFFDE7", "#FFF8E1", "#F3E5F5", "#E8F5E9",
  "#FCE4EC", "#E3F2FD", "#FFF3E0", "#F1F8E9",
];

type ThermalStop = { threshold: number; r: number; g: number; b: number };

const THERMAL_PALETTES: Record<number, ThermalStop[]> = {
  0: [
    { threshold: 0,   r: 0,   g: 0,   b: 80  },
    { threshold: 60,  r: 80,  g: 0,   b: 120 },
    { threshold: 120, r: 220, g: 100, b: 0   },
    { threshold: 180, r: 255, g: 220, b: 0   },
    { threshold: 220, r: 255, g: 255, b: 180 },
    { threshold: 255, r: 255, g: 255, b: 255 },
  ],
  1: [
    { threshold: 0,   r: 0,   g: 20,  b: 60  },
    { threshold: 80,  r: 0,   g: 80,  b: 40  },
    { threshold: 140, r: 180, g: 60,  b: 0   },
    { threshold: 200, r: 255, g: 120, b: 0   },
    { threshold: 240, r: 255, g: 180, b: 80  },
    { threshold: 255, r: 255, g: 220, b: 160 },
  ],
  2: [
    { threshold: 0,   r: 0,   g: 0,   b: 40  },
    { threshold: 60,  r: 0,   g: 40,  b: 60  },
    { threshold: 120, r: 0,   g: 100, b: 60  },
    { threshold: 180, r: 40,  g: 160, b: 40  },
    { threshold: 220, r: 120, g: 200, b: 80  },
    { threshold: 255, r: 180, g: 240, b: 120 },
  ],
  3: [
    { threshold: 0,   r: 0,   g: 0,   b: 20  },
    { threshold: 80,  r: 0,   g: 0,   b: 80  },
    { threshold: 140, r: 20,  g: 0,   b: 120 },
    { threshold: 200, r: 60,  g: 0,   b: 160 },
    { threshold: 240, r: 100, g: 40,  b: 180 },
    { threshold: 255, r: 140, g: 80,  b: 200 },
  ],
  4: [
    { threshold: 0,   r: 20,  g: 0,   b: 40  },
    { threshold: 60,  r: 120, g: 0,   b: 80  },
    { threshold: 120, r: 200, g: 0,   b: 60  },
    { threshold: 180, r: 255, g: 0,   b: 100 },
    { threshold: 220, r: 255, g: 60,  b: 180 },
    { threshold: 255, r: 255, g: 140, b: 220 },
  ],
};

const MOOD_THERMAL_LABELS = [
  "white hot · great",
  "warm · good",
  "balanced · meh",
  "cold · sad",
  "intense · stressed",
];

function thermalColor(brightness: number, palette: ThermalStop[]): [number, number, number] {
  for (let i = 0; i < palette.length - 1; i++) {
    const curr = palette[i];
    const next = palette[i + 1];
    if (brightness >= curr.threshold && brightness <= next.threshold) {
      const t = (brightness - curr.threshold) / (next.threshold - curr.threshold);
      return [
        Math.round(curr.r + (next.r - curr.r) * t),
        Math.round(curr.g + (next.g - curr.g) * t),
        Math.round(curr.b + (next.b - curr.b) * t),
      ];
    }
  }
  const last = palette[palette.length - 1];
  return [last.r, last.g, last.b];
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

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
  spawned: boolean;
  spawnTime?: number;
}

function initParticles(quote: string): Particle[] {
  return quote.split("").map((char) => ({
    char,
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    font: RANSOM_FONTS[Math.floor(Math.random() * RANSOM_FONTS.length)],
    size: 36 + Math.floor(Math.random() * 24),
    color: char.trim() === ""
      ? "transparent"
      : RANSOM_COLORS[Math.floor(Math.random() * RANSOM_COLORS.length)],
    rotation: (Math.random() - 0.5) * 25,
    rotVel: (Math.random() - 0.5) * 2,
    landed: false,
    startTime: performance.now(),
    isSpace: char === " ",
    spawned: false,
  }));
}

interface FallingLettersProps {
  quote: string;
  language: string;
  mood: number;
  onComplete: (quote: string) => void;
  onClose: () => void;
}

export function FallingLetters({ quote, language, mood, onComplete, onClose }: FallingLettersProps) {
  const particlesRef = useRef<Particle[] | null>(null);
  if (particlesRef.current === null) {
    particlesRef.current = initParticles(quote);
  }
  const particles = particlesRef.current;

  const letterEls = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef(0);
  const cameraReadyRef = useRef(false);
  const saltCooldownRef = useRef(0);
  const unspawnedQueueRef = useRef<number[]>([]);
  const targetsRef = useRef<({ x: number; y: number } | null)[]>([]);
  const quoteCompleteRef = useRef(false);
  const moodRef = useRef(mood);
  useEffect(() => { moodRef.current = mood; }, [mood]);

  const totalNonSpace = particles.filter(p => !p.isSpace).length;

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [quoteComplete, setQuoteComplete] = useState(false);
  const [spawnedCount, setSpawnedCount] = useState(0);

  const calculateTargets = useCallback(() => {
    const words = quote.split(" ").filter(w => w.length > 0);
    const AVG_CHAR_W = 38;
    const WORD_GAP = 52;
    const totalWidth = words.reduce((acc, w) => acc + w.length * AVG_CHAR_W, 0)
      + (words.length - 1) * WORD_GAP;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.38;
    let cursorX = centerX - totalWidth / 2;

    const allChars = quote.split("");
    const result: ({ x: number; y: number } | null)[] = [];

    for (let i = 0; i < allChars.length; i++) {
      if (allChars[i] === " ") {
        result.push({ x: cursorX, y: centerY });
        cursorX += WORD_GAP;
      } else {
        result.push({ x: cursorX, y: centerY });
        cursorX += AVG_CHAR_W;
      }
    }

    return result;
  }, [quote]);

  // Pre-calculate targets on mount
  useEffect(() => {
    targetsRef.current = calculateTargets();
  }, [calculateTargets]);

  // Build shuffled spawn queue on mount
  useEffect(() => {
    const indices = particles
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => !p.isSpace)
      .map(({ i }) => i);

    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    unspawnedQueueRef.current = indices;
  }, [particles]);

  const spawnLetters = useCallback((fromX: number, count: number) => {
    const queue = unspawnedQueueRef.current;
    const actualCount = Math.min(count, queue.length);
    if (actualCount === 0) return;

    const toSpawn = queue.splice(0, actualCount);
    toSpawn.forEach((idx, spawnIdx) => {
      const spreadOffset = (spawnIdx - actualCount / 2) * 160;
      const spawnX = Math.max(60, Math.min(
        window.innerWidth - 60,
        fromX + spreadOffset + (Math.random() - 0.5) * 40
      ));

      particles[idx].x = spawnX;
      particles[idx].y = -60 - Math.random() * 40;
      particles[idx].vx = (Math.random() - 0.5) * 2;
      particles[idx].vy = 2 + Math.random() * 2;
      particles[idx].spawned = true;
      particles[idx].landed = false;
      particles[idx].spawnTime = performance.now();
      particles[idx].target = targetsRef.current[idx] ?? undefined;
    });

    setSpawnedCount(prev => prev + actualCount);
  }, [particles]);

  // Resize scan canvas to match viewport
  useEffect(() => {
    const resize = () => {
      if (scanCanvasRef.current) {
        scanCanvasRef.current.width = window.innerWidth;
        scanCanvasRef.current.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

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

  // Physics + scan bar loop
  useEffect(() => {
    const NUM_BARS = 32;

    const renderScanBars = () => {
      const video = videoRef.current;
      const motionCanvas = motionCanvasRef.current;
      const scanCanvas = scanCanvasRef.current;
      if (!video || !motionCanvas || !scanCanvas || !cameraReadyRef.current) return;

      const mCtx = motionCanvas.getContext("2d");
      const sCtx = scanCanvas.getContext("2d");
      if (!mCtx || !sCtx) return;

      const MW = 80, MH = 60;
      const SW = scanCanvas.width;
      const SH = scanCanvas.height;
      const BAR_W = SW / NUM_BARS;

      motionCanvas.width = MW;
      motionCanvas.height = MH;

      try { mCtx.drawImage(video, 0, 0, MW, MH); } catch { return; }

      let currentFrame: Uint8ClampedArray;
      try { currentFrame = mCtx.getImageData(0, 0, MW, MH).data; } catch { return; }

      sCtx.clearRect(0, 0, SW, SH);

      const barMotion: number[] = new Array(NUM_BARS).fill(0);
      const palette = THERMAL_PALETTES[moodRef.current] ?? THERMAL_PALETTES[1];

      for (let bar = 0; bar < NUM_BARS; bar++) {
        const videoX = Math.floor((1 - bar / NUM_BARS) * MW);

        let brightnessSum = 0;
        let motionSum = 0;
        const SAMPLES = MH;

        for (let y = 0; y < SAMPLES; y++) {
          const idx = (y * MW + videoX) * 4;
          const r = currentFrame[idx];
          const g = currentFrame[idx + 1];
          const b = currentFrame[idx + 2];

          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          brightnessSum += brightness;

          if (prevFrameRef.current) {
            const prev = prevFrameRef.current;
            const diff = Math.abs(r - prev[idx])
              + Math.abs(g - prev[idx + 1])
              + Math.abs(b - prev[idx + 2]);
            motionSum += diff;
          }
        }

        const avgBrightness = brightnessSum / SAMPLES;
        const motionLevel = motionSum / SAMPLES;
        barMotion[bar] = motionLevel;

        const [tr, tg, tb] = thermalColor(avgBrightness, palette);

        const motionBoost = Math.min(1, motionLevel / 25);
        const boostedR = Math.min(255, tr + motionBoost * 40);
        const boostedG = Math.min(255, tg + motionBoost * 40);
        const boostedB = Math.min(255, tb + motionBoost * 40);

        const alpha = 0.55 + motionBoost * 0.25;
        const barX = bar * BAR_W;

        sCtx.fillStyle = `rgba(${Math.round(boostedR)}, ${Math.round(boostedG)}, ${Math.round(boostedB)}, ${alpha})`;
        sCtx.fillRect(barX, 0, BAR_W - 1, SH);

        if (motionLevel > 18) {
          sCtx.fillStyle = `rgba(255, 255, 255, ${motionBoost * 0.5})`;
          sCtx.fillRect(barX, 0, 2, SH);
        }
      }

      prevFrameRef.current = new Uint8ClampedArray(currentFrame);

      const gradient = sCtx.createLinearGradient(0, SH * 0.5, 0, SH);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.15)");
      sCtx.fillStyle = gradient;
      sCtx.fillRect(0, SH * 0.5, SW, SH * 0.5);

      if (saltCooldownRef.current <= 0) {
        let maxMotionBar = -1;
        let maxMotion = 25;

        for (let bar = 0; bar < NUM_BARS; bar++) {
          if (barMotion[bar] > maxMotion) {
            maxMotion = barMotion[bar];
            maxMotionBar = bar;
          }
        }

        if (maxMotionBar >= 0) {
          saltCooldownRef.current = 8;
          const screenX = (maxMotionBar + 0.5) * BAR_W;
          spawnLetters(screenX, 2);

          sCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
          sCtx.fillRect(maxMotionBar * BAR_W, 0, BAR_W, SH);
        }
      }

      if (saltCooldownRef.current > 0) saltCooldownRef.current--;
    };

    const loop = (ts: number) => {
      frameCountRef.current++;
      if (frameCountRef.current % 2 === 0) {
        renderScanBars();
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p.spawned || p.isSpace) continue;

        if (!p.landed) {
          const age = p.spawnTime ? ts - p.spawnTime : 999;

          if (p.target && age > 400) {
            // Spring toward target after 400ms free fall
            const dx = p.target.x - p.x;
            const dy = p.target.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 4) {
              p.x = p.target.x;
              p.y = p.target.y;
              p.vx = 0;
              p.vy = 0;
              p.rotation = (Math.random() - 0.5) * 10;
              p.landed = true;
            } else {
              p.vx = p.vx * 0.75 + dx * 0.12;
              p.vy = p.vy * 0.75 + dy * 0.12;
              p.vx = Math.max(-18, Math.min(18, p.vx));
              p.vy = Math.max(-18, Math.min(18, p.vy));
              p.x += p.vx;
              p.y += p.vy;
            }
          } else {
            // Free fall for first 400ms
            p.vy += 0.15;
            p.vx *= 0.95;
            p.vy = Math.min(p.vy, 12);
            if (p.x < 30) { p.x = 30; p.vx = Math.abs(p.vx) * 0.5; }
            if (p.x > window.innerWidth - 30) {
              p.x = window.innerWidth - 30;
              p.vx = -Math.abs(p.vx) * 0.5;
            }
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotVel;
            p.rotVel *= 0.97;
          }
        }

        const el = letterEls.current[i];
        if (el) {
          const age = p.spawnTime ? ts - p.spawnTime : 999;
          const spawnScale = age < 300 ? age / 300 : 1;
          el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${spawnScale})`;
        }
      }

      // Check if all letters have landed and none remain unspawned
      if (unspawnedQueueRef.current.length === 0 && !quoteCompleteRef.current) {
        let allLanded = true;
        let anySpawned = false;
        for (const p of particles) {
          if (p.isSpace) continue;
          if (!p.spawned) { allLanded = false; break; }
          if (!p.landed) { allLanded = false; break; }
          anySpawned = true;
        }
        if (allLanded && anySpawned) {
          quoteCompleteRef.current = true;
          setQuoteComplete(true);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [particles, spawnLetters]);

  const resolvedLang = resolveLanguage(language);
  const langOpt = LANGUAGE_OPTIONS.find(l => l.id === resolvedLang);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "transparent",
        zIndex: 9500,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Hidden video — source only, scan bars render to canvas instead */}
      <video ref={videoRef} autoPlay muted playsInline style={{ display: "none" }} />

      <canvas ref={motionCanvasRef} style={{ display: "none" }} />

      <canvas
        ref={scanCanvasRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 8990,
          pointerEvents: "none",
        }}
      />

      {cameraActive && (
        <div style={{
          position: "fixed",
          bottom: 234,
          right: 16,
          fontFamily: "'VT323', monospace",
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          zIndex: 8999,
          textAlign: "right",
          textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
          pointerEvents: "none",
        }}>
          🌡 {MOOD_THERMAL_LABELS[mood] ?? MOOD_THERMAL_LABELS[1]}
        </div>
      )}

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
              fontWeight: seededRandom(i * 37) > 0.4 ? 700 : 400,
              fontStyle: seededRandom(i * 41) > 0.7 ? "italic" : "normal",
              userSelect: "none",
              willChange: "transform",
              lineHeight: 1,
              whiteSpace: "nowrap",
              background: PAPER_COLORS[Math.floor(seededRandom(i * 53) * PAPER_COLORS.length)],
              padding: "3px 6px",
              boxShadow: "2px 2px 4px rgba(0,0,0,0.3), 1px 1px 0 rgba(0,0,0,0.1)",
              border: "0.5px solid rgba(0,0,0,0.08)",
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

      {/* Progress hint — "just move" or "N more..." */}
      {!quoteComplete && spawnedCount < totalNonSpace && (
        <div style={{
          position: "fixed",
          bottom: 90,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'VT323', monospace",
          fontSize: 18,
          color: "rgba(0,0,0,0.5)",
          zIndex: 8999,
          textAlign: "center",
          pointerEvents: "none",
          letterSpacing: 1,
        }}>
          {spawnedCount === 0
            ? "🧂 just move — letters will fall"
            : `${totalNonSpace - spawnedCount} more...`
          }
        </div>
      )}

      {/* Center hint — shown until first letter spawns */}
      {spawnedCount === 0 && cameraActive && (
        <div style={{
          position: "fixed",
          top: "35%",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'VT323', monospace",
          fontSize: 22,
          color: "rgba(0,0,0,0.35)",
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 8997,
          lineHeight: 1.6,
        }}>
          🧂 just move<br />
          <span style={{ fontSize: 14 }}>letters will fall from your fingers</span>
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
          camera unavailable
        </div>
      )}

      {/* Auto-save button — fades in when all letters have landed */}
      {quoteComplete && (
        <button
          onClick={() => onComplete(quote)}
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            animation: "fadeIn 0.4s ease forwards",
            background: "#000080",
            color: "#fff",
            border: "2px solid",
            borderColor: "#fff #555 #555 #fff",
            padding: "8px 28px",
            fontFamily: "'VT323', monospace",
            fontSize: 22,
            cursor: "pointer",
            boxShadow: "2px 2px 0 #808080",
            whiteSpace: "nowrap",
            letterSpacing: 2,
            zIndex: 9501,
          }}
        >
          ✦ save this quote
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
    </div>,
    document.body
  );
}
