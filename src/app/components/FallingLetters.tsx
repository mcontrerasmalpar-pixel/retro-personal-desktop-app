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
  spawned: boolean;
}

function initParticles(quote: string): Particle[] {
  return quote.split("").map((char) => ({
    char,
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    font: RANSOM_FONTS[Math.floor(Math.random() * RANSOM_FONTS.length)],
    size: 24 + Math.floor(Math.random() * 20),
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
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef(0);
  const cameraReadyRef = useRef(false);
  const saltCooldownRef = useRef(0);
  const unspawnedQueueRef = useRef<number[]>([]);
  const quoteSortedRef = useRef(false);

  const totalNonSpace = particles.filter(p => !p.isSpace).length;

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [quoteSorted, setQuoteSorted] = useState(false);
  const [spawnedCount, setSpawnedCount] = useState(0);

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
    toSpawn.forEach(i => {
      particles[i].x = fromX + (Math.random() - 0.5) * 60;
      particles[i].y = 20 + Math.random() * 40;
      particles[i].vx = (Math.random() - 0.5) * 3;
      particles[i].vy = 1 + Math.random() * 2;
      particles[i].spawned = true;
      particles[i].landed = false;
    });

    setSpawnedCount(prev => prev + actualCount);
  }, [particles]);

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

    // Flush any remaining unspawned particles to just above their targets
    const queue = unspawnedQueueRef.current;
    while (queue.length > 0) {
      const i = queue.shift()!;
      const tgt = targets[i];
      if (tgt) {
        particles[i].x = tgt.x;
        particles[i].y = -60;
        particles[i].vx = 0;
        particles[i].vy = 0;
        particles[i].spawned = true;
        particles[i].landed = false;
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
    const FLOOR = window.innerHeight - 160;
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

      for (let bar = 0; bar < NUM_BARS; bar++) {
        // Map bar index to video column, mirrored
        const videoX = Math.floor((1 - bar / NUM_BARS) * MW);

        let rSum = 0, gSum = 0, bSum = 0, motionSum = 0;

        for (let y = 0; y < MH; y++) {
          const idx = (y * MW + videoX) * 4;
          rSum += currentFrame[idx];
          gSum += currentFrame[idx + 1];
          bSum += currentFrame[idx + 2];

          if (prevFrameRef.current) {
            const prev = prevFrameRef.current;
            motionSum +=
              Math.abs(currentFrame[idx]     - prev[idx]) +
              Math.abs(currentFrame[idx + 1] - prev[idx + 1]) +
              Math.abs(currentFrame[idx + 2] - prev[idx + 2]);
          }
        }

        const avgR = rSum / MH;
        const avgG = gSum / MH;
        const avgB = bSum / MH;
        barMotion[bar] = motionSum / MH;

        const motionBoost = Math.min(1, barMotion[bar] / 30);
        const alpha = 0.45 + motionBoost * 0.35;

        sCtx.fillStyle = `rgba(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)}, ${alpha})`;
        sCtx.fillRect(bar * BAR_W, 0, BAR_W - 1, SH);

        if (barMotion[bar] > 20) {
          sCtx.fillStyle = `rgba(255, 255, 255, ${motionBoost * 0.6})`;
          sCtx.fillRect(bar * BAR_W, 0, 2, SH);
        }
      }

      prevFrameRef.current = new Uint8ClampedArray(currentFrame);

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
              p.vy *= -0.2;
              p.vx *= 0.6;
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
  }, [particles, spawnLetters]);

  const resolvedLang = resolveLanguage(language);
  const langOpt = LANGUAGE_OPTIONS.find(l => l.id === resolvedLang);

  const allSpawned = spawnedCount >= totalNonSpace;
  const showHint = spawnedCount === 0 && cameraActive;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(3px)",
        zIndex: 9500,
        overflow: "hidden",
      }}
    >
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

      {/* Salt gesture progress counter */}
      {spawnedCount < totalNonSpace && (
        <div style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'VT323', monospace",
          fontSize: 16,
          color: "rgba(0,0,0,0.4)",
          zIndex: 8999,
          letterSpacing: 1,
          pointerEvents: "none",
        }}>
          🧂 {spawnedCount} / {totalNonSpace} letters
        </div>
      )}

      {/* Salt gesture hint — shown until first letter spawns */}
      {showHint && (
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

      {/* Bottom hint — shown while camera is active and no spawns yet */}
      {cameraActive && showHint && (
        <div style={{
          position: "fixed",
          bottom: 170,
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
          🧂 just move — letters will fall
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

      {/* Assemble button — prominent when all spawned */}
      {allSpawned && !quoteSorted && (
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
          ✦ assemble the quote
        </button>
      )}

      {/* Early assemble — dimmed, available after first letter */}
      {!allSpawned && spawnedCount > 0 && !quoteSorted && (
        <button
          onClick={triggerSort}
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'VT323', monospace",
            fontSize: 14,
            background: "#C0C0C0",
            border: "2px solid",
            borderColor: "#fff #555 #555 #fff",
            padding: "3px 12px",
            cursor: "pointer",
            zIndex: 9001,
            letterSpacing: 1,
            opacity: 0.6,
          }}
        >
          assemble now ({spawnedCount} letters)
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
