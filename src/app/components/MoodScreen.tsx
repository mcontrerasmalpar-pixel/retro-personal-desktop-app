import React, { useState, useEffect, useRef } from "react";
import { getCompanionIdleImage } from "./PixelPet";

const BLOBS = [
  { emoji: "😄", label: "great",    color: "#FFE566" },
  { emoji: "🙂", label: "good",     color: "#6BCB77" },
  { emoji: "😐", label: "meh",      color: "#4D9DE0" },
  { emoji: "😔", label: "sad",      color: "#E15FED" },
  { emoji: "😤", label: "stressed", color: "#FF6B9D" },
];

const TITLE_COLORS = ["#FF6B9D", "#FFE566", "#6BCB77", "#4D9DE0", "#E15FED"];
const TITLE_TEXT = "how are you today?";

interface Props {
  username: string;
  companionId: string;
  canvasSnapshot?: string | null;
  onComplete: (moodIndex: number) => void;
}

export function MoodScreen({ username, companionId, canvasSnapshot, onComplete }: Props) {
  const [selected, setSelected]         = useState<number | null>(null);
  const [btnHovered, setBtnHovered]     = useState(false);
  const [hoveredBlob, setHoveredBlob]   = useState<number | null>(null);
  const [visibleChars, setVisibleChars] = useState(0);
  const [contentVisible, setContentVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVisibleChars(prev => {
        if (prev >= TITLE_TEXT.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          contentTimerRef.current = setTimeout(() => setContentVisible(true), 400);
          return prev;
        }
        return prev + 1;
      });
    }, 80);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
    };
  }, []);

  return (
    <div style={{
      width: "100%", height: "100vh",
      background: "#fff",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 32,
      padding: "32px 20px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'VT323', monospace",
    }}>

      {/* ── Layer 1: snapshot blurs and fades out ─────────────────────── */}
      {canvasSnapshot && (
        <img
          src={canvasSnapshot}
          alt=""
          style={{
            position: "fixed", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            filter: "blur(8px)",
            transform: "scale(1.05)",
            animation: "snapshotFade 2s ease forwards",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Layer 2: white overlay fades in ───────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0,
        background: "white",
        animation: "whiteFade 2s ease 0.5s forwards",
        opacity: 0,
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* ── Content (above fade layers) ───────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>

        {/* Title — typewriter */}
        <div style={{ textAlign: "center" }}>
          <div style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,0.25))", lineHeight: 1, marginBottom: 10 }}>
            {TITLE_TEXT.split("").map((ch, i) => (
              <span
                key={i}
                style={{
                  color: i < visibleChars ? TITLE_COLORS[i % TITLE_COLORS.length] : "transparent",
                  WebkitTextStroke: i < visibleChars ? "3px #000" : "0px",
                  transition: "color 0.2s ease",
                  fontSize: 42,
                  fontWeight: 900,
                  fontFamily: "'VT323', monospace",
                  display: "inline-block",
                } as React.CSSProperties}
              >
                {ch === " " ? " " : ch}
              </span>
            ))}
          </div>

          {/* Subtitle — fades in after title */}
          <div style={{
            fontSize: 18,
            color: "#555",
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}>
            tap how you feel right now
          </div>
        </div>

        {/* Blob row — staggered entrance */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {BLOBS.map((blob, i) => {
            const isSelected = selected === i;
            const isHovered  = hoveredBlob === i;
            return (
              <div
                key={i}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? "translateY(0)" : "translateY(16px)",
                  transition: `opacity 0.5s ease ${i * 0.15}s, transform 0.5s ease ${i * 0.15}s`,
                }}
              >
                <div
                  onClick={() => setSelected(i)}
                  onMouseEnter={() => setHoveredBlob(i)}
                  onMouseLeave={() => setHoveredBlob(null)}
                  style={{
                    width: 88, height: 88,
                    borderRadius: "60% 40% 55% 45% / 45% 55% 45% 55%",
                    background: blob.color,
                    border: isSelected ? "3px solid rgba(0,0,0,0.4)" : "3px solid rgba(0,0,0,0.2)",
                    boxShadow: isSelected
                      ? "0 10px 0 rgba(0,0,0,0.2)"
                      : isHovered
                      ? "0 8px 0 rgba(0,0,0,0.15)"
                      : "0 4px 0 rgba(0,0,0,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    transform: isSelected
                      ? "scale(1.15) translateY(-6px)"
                      : isHovered
                      ? "scale(1.12) translateY(-4px)"
                      : "scale(1)",
                    transition: "transform 0.15s, box-shadow 0.15s, border 0.15s",
                    userSelect: "none",
                  }}
                >
                  <div style={{
                    width: 72, height: 72,
                    borderRadius: "55% 45% 50% 50% / 50% 50% 55% 45%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 34,
                  }}>
                    {blob.emoji}
                  </div>
                </div>
                <div style={{
                  fontSize: 16,
                  color: "#333",
                  opacity: contentVisible ? 1 : 0,
                  transition: `opacity 0.5s ease ${i * 0.15 + 0.1}s`,
                }}>
                  {blob.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue button */}
        <div style={{ minHeight: 56, display: "flex", alignItems: "center" }}>
          {selected !== null && (
            <button
              onClick={() => onComplete(selected)}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                background: "#FFE566",
                border: "3px solid #000",
                borderRadius: 30,
                padding: "10px 32px",
                fontFamily: "'VT323', monospace",
                fontSize: 22,
                letterSpacing: 2,
                cursor: "pointer",
                boxShadow: btnHovered ? "0 6px 0 rgba(0,0,0,0.2)" : "0 4px 0 rgba(0,0,0,0.2)",
                transform: btnHovered ? "translateY(-2px)" : "translateY(0)",
                transition: "transform 0.12s, box-shadow 0.12s",
                userSelect: "none",
              }}
            >
              enter my space ✦
            </button>
          )}
        </div>
      </div>

      {/* Pet — bottom right */}
      <img
        src={getCompanionIdleImage(companionId)}
        alt="companion"
        style={{
          position: "fixed",
          bottom: 16, right: 20,
          width: 64, height: 80,
          imageRendering: "pixelated",
          objectFit: "contain",
          animation: "petFloat 2s ease-in-out infinite",
          zIndex: 3,
          opacity: contentVisible ? 1 : 0,
          transition: "opacity 0.8s ease 0.8s",
        }}
      />

      <style>{`
        @keyframes petFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes snapshotFade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes whiteFade {
          0%   { opacity: 0; }
          100% { opacity: 0.92; }
        }
      `}</style>
    </div>
  );
}
