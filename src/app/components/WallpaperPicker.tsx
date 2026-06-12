import React, { useRef, useState } from "react";
import { DraggableWindow } from "./DraggableWindow";
import imgGreetings from "../../imports/Microsoft_Greetings_Workshop_2.0_-_Menu.jpeg";
import imgBliss from "../../imports/windows.jpg";

export type WallpaperOption = {
  id: string;
  label: string;
  value: string;
  mood?: "blooming" | "neutral" | "healing";
  thumb?: string; // CSS background for thumbnail
};

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: "bliss",
    label: "Bliss ✦ classic",
    value: `url(${imgBliss}) center/cover no-repeat`,
    thumb: `url(${imgBliss}) center/cover no-repeat`,
  },
  {
    id: "classic-teal",
    label: "Classic Teal",
    value: "#008080",
    thumb: "#008080",
  },
  {
    id: "andean-valley",
    label: "Andean Valley",
    value: "linear-gradient(180deg,#87CEEB 0%,#87CEEB 50%,#5B8C5A 50%,#8FBC8F 100%)",
    thumb: "linear-gradient(180deg,#87CEEB 0%,#87CEEB 50%,#5B8C5A 50%,#8FBC8F 100%)",
    mood: "blooming",
  },
  {
    id: "mountain-hearts",
    label: "Mountain Hearts",
    value: "linear-gradient(180deg,#D4537E 0%,#993556 55%,#5a1a30 100%)",
    thumb: "linear-gradient(180deg,#D4537E 0%,#993556 55%,#5a1a30 100%)",
    mood: "healing",
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    value: "linear-gradient(180deg,#E8A87C 0%,#d4861c 55%,#5a3e10 100%)",
    thumb: "linear-gradient(180deg,#E8A87C 0%,#d4861c 55%,#5a3e10 100%)",
    mood: "neutral",
  },
  {
    id: "night-sky",
    label: "Night Sky",
    value: "linear-gradient(180deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
    thumb: "linear-gradient(180deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
  },
  {
    id: "cotton-candy",
    label: "Cotton Candy",
    value: "linear-gradient(135deg,#fbc2eb 0%,#a6c1ee 100%)",
    thumb: "linear-gradient(135deg,#fbc2eb 0%,#a6c1ee 100%)",
  },
  {
    id: "greetings-workshop",
    label: "Greetings Workshop",
    value: `url(${imgGreetings}) center/cover no-repeat`,
    thumb: `url(${imgGreetings}) center/cover no-repeat`,
  },
];

interface Props {
  current: WallpaperOption;
  autoMood: boolean;
  onApply: (w: WallpaperOption) => void;
  onAutoMoodChange: (v: boolean) => void;
  onClose: () => void;
}

export function WallpaperPicker({ current, autoMood, onApply, onAutoMoodChange, onClose }: Props) {
  const [selected, setSelected] = useState<WallpaperOption>(current);
  const [wallpapers, setWallpapers] = useState<WallpaperOption[]>(WALLPAPERS);
  const [localAuto, setLocalAuto] = useState(autoMood);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newWp: WallpaperOption = {
      id: `custom-${Date.now()}`,
      label: file.name.replace(/\.[^.]+$/, ""),
      value: `url(${url}) center/cover no-repeat`,
      thumb: `url(${url}) center/cover no-repeat`,
    };
    setWallpapers(prev => [...prev, newWp]);
    setSelected(newWp);
    e.target.value = "";
  };

  return (
    <DraggableWindow
      id="wallpaper-picker"
      title="Display Properties — wallpaper.cpl"
      icon={<span style={{ fontSize: 16 }}>🖼</span>}
      onClose={onClose}
      onMinimize={onClose}
      onFocus={() => {}}
      zIndex={9000}
      initialPosition={{ x: Math.max(40, (window.innerWidth - 420) / 2), y: Math.max(40, (window.innerHeight - 480) / 2) }}
      width={420}
      minHeight={460}
    >
      <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, padding: 12 }}>
        {/* Mini desktop preview */}
        <div style={{
          width: "100%", height: 100,
          background: selected.value,
          border: "2px solid", borderColor: "#555 #fff #fff #555",
          marginBottom: 12,
          position: "relative",
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* Mini taskbar */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 12, background: "#C0C0C0",
            borderTop: "1px solid #fff",
          }} />
          <div style={{
            color: "rgba(255,255,255,0.6)",
            fontFamily: "'VT323', monospace", fontSize: 13,
            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
          }}>
            {selected.label}
          </div>
        </div>

        <div style={{ fontSize: 15, color: "#555", marginBottom: 8 }}>Wallpaper:</div>

        {/* Grid of thumbnails */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
          maxHeight: 220,
          overflowY: "auto",
          border: "2px solid", borderColor: "#555 #fff #fff #555",
          padding: 6,
          background: "#fff",
          marginBottom: 10,
        }}>
          {wallpapers.map(wp => (
            <div
              key={wp.id}
              onClick={() => setSelected(wp)}
              style={{
                height: 50,
                background: wp.thumb || wp.value,
                border: selected.id === wp.id
                  ? "2px solid #000080"
                  : "2px solid #C0C0C0",
                cursor: "pointer",
                position: "relative",
                boxSizing: "border-box",
              }}
            >
              {selected.id === wp.id && (
                <div style={{
                  position: "absolute", inset: 0,
                  outline: "2px solid #000080",
                  outlineOffset: -2,
                }} />
              )}
              {wp.mood && (
                <div style={{
                  position: "absolute", bottom: 2, right: 2,
                  fontSize: 9, color: "#fff",
                  textShadow: "0 0 2px #000",
                  fontFamily: "'VT323', monospace",
                }}>
                  {wp.mood === "blooming" ? "🌸" : wp.mood === "healing" ? "💜" : "✨"}
                </div>
              )}
            </div>
          ))}

          {/* Upload slot */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              height: 50,
              border: "2px dashed #A0A0A0",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              background: "#F8F8F8",
              fontSize: 20,
              color: "#A0A0A0",
              boxSizing: "border-box",
            }}
            title="Upload image"
          >
            ＋
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
        </div>

        {/* Label below selected */}
        <div style={{
          background: "#D8D8D8", border: "2px solid", borderColor: "#555 #fff #fff #555",
          padding: "3px 8px", marginBottom: 10, fontSize: 15, color: "#333",
        }}>
          {selected.label}
          {selected.mood ? ` · auto-mood: ${selected.mood}` : ""}
        </div>

        {/* Auto-mood checkbox */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
          <div
            onClick={() => setLocalAuto(v => !v)}
            style={{
              width: 16, height: 16, flexShrink: 0,
              border: "2px solid", borderColor: "#555 #fff #fff #555",
              background: localAuto ? "#000080" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {localAuto && (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <polyline points="1,5 4,8 9,2" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 15 }}>Apply wallpaper by mood automatically</span>
        </label>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <BevelBtn onClick={onClose}>Cancel</BevelBtn>
          <BevelBtn
            onClick={() => {
              onAutoMoodChange(localAuto);
              onApply(selected);
              onClose();
            }}
          >
            ✔ Apply
          </BevelBtn>
        </div>
      </div>
    </DraggableWindow>
  );
}

function BevelBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#C0C0C0",
        border: "2px solid", borderColor: "#fff #555 #555 #fff",
        padding: "4px 16px",
        fontFamily: "'VT323', monospace", fontSize: 17,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
