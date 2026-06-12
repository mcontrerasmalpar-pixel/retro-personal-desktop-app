import React, { useState, useRef } from "react";

interface Props {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  zIndex: number;
  initialPosition?: { x: number; y: number };
  width?: number;
  minHeight?: number;
}

export function DraggableWindow({
  title,
  icon,
  children,
  onClose,
  onMinimize,
  onFocus,
  zIndex,
  initialPosition = { x: 120, y: 80 },
  width = 520,
  minHeight = 380,
}: Props) {
  const [pos, setPos] = useState(initialPosition);
  const [maximized, setMaximized] = useState(false);
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".win-ctrl")) return;
    if (maximized) return;
    e.preventDefault();
    onFocus();
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };

    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const nx = Math.max(0, Math.min(window.innerWidth - width, dragRef.current.px + ev.clientX - dragRef.current.sx));
      const ny = Math.max(0, Math.min(window.innerHeight - 50, dragRef.current.py + ev.clientY - dragRef.current.sy));
      setPos({ x: nx, y: ny });
    };
    const up = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  const windowStyle: React.CSSProperties = maximized
    ? { position: "fixed", left: 0, top: 0, width: "100vw", height: "calc(100vh - 50px)", zIndex }
    : { position: "fixed", left: pos.x, top: pos.y, width, minHeight, zIndex };

  return (
    <div
      style={{
        ...windowStyle,
        background: "#C0C0C0",
        border: "2px solid",
        borderColor: "#fff #555 #555 #fff",
        boxShadow: "1px 1px 0 #808080",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        animation: "winOpen 0.15s ease-out",
      }}
      onClick={onFocus}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleTitleMouseDown}
        style={{
          background: "linear-gradient(90deg, #000080 0%, #1084D0 100%)",
          color: "#fff",
          padding: "3px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "default",
          flexShrink: 0,
          minHeight: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'VT323', monospace", fontSize: 18 }}>
          {icon && <span style={{ lineHeight: 1 }}>{icon}</span>}
          {title}
        </div>
        <div style={{ display: "flex", gap: 2 }} className="win-ctrl">
          <WinBtn onClick={onMinimize} title="Minimize">_</WinBtn>
          <WinBtn onClick={() => setMaximized(m => !m)} title="Maximize">□</WinBtn>
          <WinBtn onClick={onClose} title="Close" isClose>✕</WinBtn>
        </div>
      </div>

      {/* Menu bar area (optional decoration) */}
      <div style={{
        borderBottom: "1px solid #808080",
        borderTop: "1px solid #fff",
        padding: "1px 4px",
        background: "#C0C0C0",
        flexShrink: 0,
      }} />

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: "auto",
        fontFamily: "'VT323', monospace",
        fontSize: 16,
        color: "#000",
        padding: 8,
        position: "relative",
      }}>
        {children}
      </div>
    </div>
  );
}

function WinBtn({ onClick, children, title, isClose }: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  isClose?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      style={{
        width: 20,
        height: 20,
        background: "#C0C0C0",
        border: "2px solid",
        borderColor: "#fff #555 #555 #fff",
        color: "#000",
        fontFamily: "monospace",
        fontSize: 11,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        lineHeight: 1,
        flexShrink: 0,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </button>
  );
}
