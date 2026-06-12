import React, { useState, useEffect, useRef, useCallback } from "react";
import { CompanionPickerModal } from "./CompanionPicker";

const TOMODACHI = ["#FF6B9D", "#FFE566", "#6BCB77", "#4D9DE0", "#E15FED", "#FF9A9E", "#A1C4FD"];
const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
const TITLE_COLORS = ["#FF6B9D", "#FFE566", "#6BCB77", "#4D9DE0", "#E15FED"];
const PHRASES = ["ready when you are ✦", "your space is waiting", "hello again, friend"];

interface Props {
  onLogin: (username: string, snapshot: string | null) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobCanvasRef = useRef<HTMLCanvasElement>(null);

  // Audio refs — never cause re-renders
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const dragOscRef   = useRef<OscillatorNode | null>(null);
  const dragGainRef  = useRef<GainNode | null>(null);
  const strokeColorRef = useRef(0);
  const isDrawingRef = useRef(false);
  const lastPosRef   = useRef<{ x: number; y: number } | null>(null);

  // Blob animation list
  const blobsRef = useRef<{ x: number; y: number; r: number; color: string; points: number[]; opacity: number }[]>([]);
  const rafRef   = useRef<number>(0);

  // Login form
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [btnPressed, setBtnPressed] = useState(false);

  // Companion picker
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [pendingUsername, setPendingUsername]          = useState("");

  // Invitation fade
  const [inviteVisible, setInviteVisible] = useState(true);
  const [phraseIdx, setPhraseIdx]         = useState(0);

  // ── Canvas resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
      }
      const blobCanvas = blobCanvasRef.current;
      if (blobCanvas) {
        blobCanvas.width  = window.innerWidth;
        blobCanvas.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Blob animation loop ────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const canvas = blobCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const blobs = blobsRef.current;
        const alive: typeof blobs = [];
        for (const b of blobs) {
          b.opacity -= 0.003;
          if (b.opacity > 0) {
            ctx.save();
            ctx.globalAlpha = b.opacity;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            const pts = b.points;
            const n = pts.length / 2;
            for (let i = 0; i < n; i++) {
              const angle = (i / n) * Math.PI * 2;
              const r = b.r + pts[i * 2];
              const x = b.x + Math.cos(angle) * r;
              const y = b.y + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            alive.push(b);
          }
        }
        blobsRef.current = alive;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Invitation fade after 8s ───────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setInviteVisible(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // ── Phrase cycling ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(i => (i + 1) % PHRASES.length), 2800);
    return () => clearInterval(t);
  }, []);

  // ── Audio helpers ──────────────────────────────────────────────────────────
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const yToFreq = (y: number) => {
    const h = canvasRef.current?.height ?? window.innerHeight;
    const idx = Math.floor((1 - y / h) * PENTATONIC.length);
    return PENTATONIC[Math.max(0, Math.min(PENTATONIC.length - 1, idx))];
  };

  const playTone = (freq: number, dur = 0.3) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  };

  const startDragTone = (freq: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    dragOscRef.current  = osc;
    dragGainRef.current = gain;
  };

  const updateDragTone = (freq: number, speed: number) => {
    const osc  = dragOscRef.current;
    const gain = dragGainRef.current;
    const ctx  = audioCtxRef.current;
    if (!osc || !gain || !ctx) return;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.value = Math.min(0.3, 0.05 + speed * 0.005);
  };

  const stopDragTone = () => {
    const gain = dragGainRef.current;
    const osc  = dragOscRef.current;
    const ctx  = audioCtxRef.current;
    if (gain && ctx) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    if (osc  && ctx) osc.stop(ctx.currentTime + 0.1);
    dragOscRef.current  = null;
    dragGainRef.current = null;
  };

  // ── Drawing helpers ────────────────────────────────────────────────────────
  const spawnBlob = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = 30 + Math.random() * 40;
    const n = 12;
    const points: number[] = [];
    for (let i = 0; i < n; i++) {
      points.push(Math.random() * 15 - 7, 0);
    }
    blobsRef.current.push({
      x, y, r,
      color: TOMODACHI[Math.floor(Math.random() * TOMODACHI.length)],
      points,
      opacity: 0.85,
    });
  };

  const getCanvasPos = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  };

  // ── Pointer event handlers ─────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    initAudio();
    const { x, y } = getCanvasPos(e.clientX, e.clientY);
    isDrawingRef.current = true;
    lastPosRef.current = { x, y };

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();   // start a completely new path
      ctx.moveTo(x, y); // lift the pen and place it at the new position
    }

    startDragTone(yToFreq(y));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const { x, y } = getCanvasPos(e.clientX, e.clientY);

    // Safety: if no valid origin, start fresh — never connect to (0,0)
    if (!lastPosRef.current) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      lastPosRef.current = { x, y };
      return;
    }

    const last = lastPosRef.current;
    const dx = x - last.x;
    const dy = y - last.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    const lw = Math.max(2, Math.min(12, 20 - speed * 0.3));
    const color = TOMODACHI[strokeColorRef.current % TOMODACHI.length];

    ctx.lineWidth   = lw;
    ctx.strokeStyle = color;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.shadowBlur  = 12;
    ctx.shadowColor = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.shadowBlur  = 0;

    updateDragTone(yToFreq(y), speed);
    lastPosRef.current = { x, y };
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getCanvasPos(e.clientX, e.clientY);
    const last = lastPosRef.current;

    const dist = last ? Math.hypot(x - last.x, y - last.y) : 0;
    if (dist < 6) {
      spawnBlob(x, y);
      playTone(yToFreq(y));
    } else {
      strokeColorRef.current++;
    }

    // Reset path completely — next stroke starts fresh
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
    }

    stopDragTone();
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isDrawingRef.current) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
    }

    stopDragTone();
    isDrawingRef.current = false;
    lastPosRef.current = null;
    strokeColorRef.current++;
  }, []);

  // ── Touch support ──────────────────────────────────────────────────────────
  const toMouse = (touch: React.Touch) => ({ clientX: touch.clientX, clientY: touch.clientY });

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseDown({ ...toMouse(e.touches[0]) } as React.MouseEvent<HTMLCanvasElement>);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseMove({ ...toMouse(e.touches[0]) } as React.MouseEvent<HTMLCanvasElement>);
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    handleMouseUp({ ...toMouse(t) } as React.MouseEvent<HTMLCanvasElement>);
  };

  // ── Form submit ────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("enter both fields to continue.");
      return;
    }
    setError("");
    const name = username.trim();
    const snapshot = canvasRef.current?.toDataURL("image/png") ?? null;
    if (!localStorage.getItem("personalos_companion")) {
      setPendingUsername(name);
      setShowCompanionPicker(true);
    } else {
      onLogin(name, snapshot);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: "100%", height: "100vh",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'VT323', monospace",
    }}>

      {/* ── Blob canvas — bottom layer, no mouse events ────────────────── */}
      <canvas
        ref={blobCanvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          display: "block",
          pointerEvents: "none",
        }}
      />

      {/* ── Stroke canvas — top layer, receives all mouse/touch events ──── */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          display: "block",
          touchAction: "none",
          background: "transparent",
        }}
      />

      {/* ── Title + login panel (above canvas) ────────────────────────── */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}>
        {/* Title block */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            fontSize: 48,
            letterSpacing: 4,
            filter: "drop-shadow(4px 4px 0 rgba(0,0,0,0.4))",
            lineHeight: 1,
            marginBottom: 6,
          }}>
            {"PERSONAL OS".split("").map((ch, i) => (
              <span key={i} style={{
                color: TITLE_COLORS[i % TITLE_COLORS.length],
                WebkitTextStroke: "3px #000",
                paintOrder: "stroke fill",
                fontWeight: 900,
                display: "inline-block",
              }}>
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </div>

          <div style={{
            fontSize: 20,
            color: "#333",
            marginBottom: 6,
          }}>
            your space. your rules. ✦
          </div>

          <div style={{ fontSize: 18, color: "rgba(0,0,0,0.5)", letterSpacing: 6 }}>
            🌸 ⛩ 🌸 ⛩ 🌸
          </div>
        </div>

        {/* Win95 dialog */}
        <div style={{
          pointerEvents: "all",
          width: 300,
          background: "#C0C0C0",
          border: "2px solid",
          borderColor: "#fff #555 #555 #fff",
          boxShadow: "2px 2px 0 #808080",
        }}>
          {/* Title bar */}
          <div style={{
            background: "linear-gradient(90deg, #000080, #1084D0)",
            padding: "4px 8px",
            display: "flex", alignItems: "center",
            fontSize: 16, color: "#fff",
          }}>
            💾 Login — personal.os
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 15, marginBottom: 3, color: "#000" }}>USERNAME:</div>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#000080 #fff #fff #000080")}
                onBlur={e  => (e.target.style.borderColor = "#555 #fff #fff #555")}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 15, marginBottom: 3, color: "#000" }}>PASSWORD:</div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#000080 #fff #fff #000080")}
                onBlur={e  => (e.target.style.borderColor = "#555 #fff #fff #555")}
              />
            </div>

            {error && (
              <div style={{
                fontSize: 14, color: "#cc0000",
                marginBottom: 8, padding: "2px 6px",
                background: "rgba(204,0,0,0.08)",
                border: "1px solid rgba(204,0,0,0.2)",
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              onMouseDown={() => setBtnPressed(true)}
              onMouseUp={()   => setBtnPressed(false)}
              onMouseLeave={() => setBtnPressed(false)}
              style={{
                width: "100%",
                background: "#C0C0C0",
                border: "2px solid",
                borderColor: btnPressed ? "#555 #fff #fff #555" : "#fff #555 #555 #fff",
                padding: btnPressed ? "7px 0 5px" : "5px 0 7px",
                fontSize: 18, color: "#000",
                cursor: "pointer", letterSpacing: 2,
                transform: btnPressed ? "translateY(1px)" : "none",
                transition: "transform 0.05s",
                userSelect: "none",
                fontFamily: "'VT323', monospace",
              }}
            >
              ENTER.exe
            </button>
          </form>
        </div>
      </div>

      {/* ── Invitation text — bottom-left, fades after 8s ─────────────── */}
      <div style={{
        position: "fixed",
        bottom: 20, left: 24,
        zIndex: 20,
        pointerEvents: "none",
        transition: "opacity 1s ease",
        opacity: inviteVisible ? 1 : 0,
      }}>
        <div style={{ fontSize: 18, color: "rgba(0,0,0,0.45)" }}>
          make something before you enter ✦
        </div>
        <div style={{
          marginTop: 4,
          fontSize: 15,
          color: "rgba(0,0,0,0.3)",
        }}>
          {PHRASES[phraseIdx]}
        </div>
      </div>

      {/* ── Companion picker (first login) ────────────────────────────── */}
      {showCompanionPicker && (
        <CompanionPickerModal
          onConfirm={id => {
            localStorage.setItem("personalos_companion", id);
            setShowCompanionPicker(false);
            onLogin(pendingUsername, canvasRef.current?.toDataURL("image/png") ?? null);
          }}
          onSkip={() => {
            setShowCompanionPicker(false);
            onLogin(pendingUsername, canvasRef.current?.toDataURL("image/png") ?? null);
          }}
        />
      )}

      <style>{`
        @keyframes winOpen {
          from { transform: scale(0.85); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "#fff",
  border: "2px solid", borderColor: "#555 #fff #fff #555",
  fontFamily: "'VT323', monospace", fontSize: 18,
  padding: "4px 8px", outline: "none", color: "#000",
};
