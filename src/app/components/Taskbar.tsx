import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import imgWindowsLogo from "../../imports/Frame31/4ddf8aabad600847e98c6e175d90fe95d15fca0e.png";
import imgVolume from "../../imports/Frame31/f0283d6e426924efcb64db3925725b15d98661bf.png";
import { FallingLetters } from "./FallingLetters";
import { LanguagePicker } from "./LanguagePicker";
import { getDailyQuote } from "./quotes";

const bevelBtnStyle: React.CSSProperties = {
  background: "#C0C0C0",
  border: "2px solid",
  borderColor: "#fff #555 #555 #fff",
  padding: "4px 12px",
  fontFamily: "'VT323', monospace",
  fontSize: 16,
  cursor: "pointer",
};

interface MinimizedWindow {
  id: string;
  title: string;
}

interface Props {
  minimizedWindows: MinimizedWindow[];
  onRestoreWindow: (id: string) => void;
  activeWindowId: string | null;
  onOpenWallpaperPicker: () => void;
  onOpenCompanionPicker: () => void;
}

export function Taskbar({ minimizedWindows, onRestoreWindow, activeWindowId, onOpenWallpaperPicker, onOpenCompanionPicker }: Props) {
  const [time, setTime] = useState(getTimeStr());
  const [startOpen, setStartOpen] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    localStorage.getItem("personalos_quote_language") ?? null
  );
  const [quoteRevealed, setQuoteRevealed] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showQuoteExperience, setShowQuoteExperience] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeStr()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePermissionAccept = () => {
    setShowPermissionDialog(false);
    if (!selectedLanguage) {
      setShowLanguagePicker(true);
    } else {
      setShowQuoteExperience(true);
    }
  };

  const handleLanguageSelect = (lang: string) => {
    localStorage.setItem("personalos_quote_language", lang);
    setSelectedLanguage(lang);
    setShowLanguagePicker(false);
    setShowQuoteExperience(true);
  };

  const handleQuoteComplete = (q: string) => {
    setQuoteText(q);
    setQuoteRevealed(true);
    setShowQuoteExperience(false);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      height: 50,
      background: "#C0C0C0",
      boxShadow: "inset 0 2px 0 #fff",
      display: "flex",
      alignItems: "center",
      padding: "0 4px",
      gap: 4,
      zIndex: 8000,
      userSelect: "none",
    }}>
      {/* Start button */}
      <button
        onClick={() => setStartOpen(o => !o)}
        style={{
          height: 38,
          padding: "0 12px",
          background: "#C0C0C0",
          border: "2px solid",
          borderColor: "#fff #555 #555 #fff",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "'VT323', monospace",
          fontSize: 20,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        <img src={imgWindowsLogo} alt="Start" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
        Start
      </button>

      {/* Divider */}
      <div style={{ width: 2, height: 38, background: "#808080", borderRight: "1px solid #fff", flexShrink: 0 }} />

      {/* Quote zone */}
      {!quoteRevealed ? (
        <div
          onClick={() => setShowPermissionDialog(true)}
          style={{
            fontFamily: "'VT323', monospace",
            fontSize: 14,
            color: "#808080",
            padding: "0 12px",
            cursor: "pointer",
            letterSpacing: 1,
            borderLeft: "1px solid #888",
            borderRight: "1px solid #888",
            height: "100%",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            transition: "color 0.15s",
            pointerEvents: "all",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#000")}
          onMouseLeave={e => (e.currentTarget.style.color = "#808080")}
        >
          ✦ click for today's quote
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 12px",
            borderLeft: "1px solid #888",
            borderRight: "1px solid #888",
            height: "100%",
            flexShrink: 0,
            maxWidth: 260,
          }}
        >
          <div style={{
            fontFamily: "'VT323', monospace",
            fontSize: 14,
            color: "#333",
            fontStyle: "italic",
            letterSpacing: 0.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {quoteText}
          </div>
          <div
            onClick={() => setShowLanguagePicker(true)}
            style={{
              fontFamily: "'VT323', monospace",
              fontSize: 11,
              color: "#808080",
              cursor: "pointer",
              letterSpacing: 0.3,
              marginTop: 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#000")}
            onMouseLeave={e => (e.currentTarget.style.color = "#808080")}
          >
            change language
          </div>
        </div>
      )}

      {/* Minimized windows */}
      <div style={{ flex: 1, display: "flex", gap: 2, overflow: "hidden" }}>
        {minimizedWindows.map(w => (
          <button
            key={w.id}
            onClick={() => onRestoreWindow(w.id)}
            style={{
              height: 36,
              padding: "0 8px",
              background: activeWindowId === w.id ? "#B0B0B0" : "#C0C0C0",
              border: "2px solid",
              borderColor: activeWindowId === w.id ? "#555 #fff #fff #555" : "#fff #555 #555 #fff",
              fontFamily: "'VT323', monospace",
              fontSize: 16,
              cursor: "pointer",
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {w.title}
          </button>
        ))}
      </div>

      {/* System tray */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        border: "2px solid",
        borderColor: "#555 #fff #fff #555",
        height: 38,
        boxSizing: "border-box",
      }}>
        <img src={imgVolume} alt="Volume" style={{ width: 20, height: 20, imageRendering: "pixelated" }} />
        <span style={{ fontFamily: "'VT323', monospace", fontSize: 18, whiteSpace: "nowrap" }}>
          {time}
        </span>
      </div>

      {/* Start menu */}
      {startOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 7999 }}
            onClick={() => setStartOpen(false)}
          />
          <div style={{
            position: "absolute",
            bottom: 50,
            left: 4,
            width: 200,
            background: "#C0C0C0",
            border: "2px solid",
            borderColor: "#fff #555 #555 #fff",
            zIndex: 8001,
          }}>
            <div style={{ display: "flex" }}>
              <div style={{
                width: 28,
                background: "linear-gradient(180deg, #808080 0%, #555 100%)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                padding: 4,
              }}>
                <span style={{
                  color: "#C0C0C0",
                  fontFamily: "'VT323', monospace",
                  fontSize: 14,
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  letterSpacing: 2,
                }}>
                  PersonalOS 95
                </span>
              </div>
              <div style={{ flex: 1 }}>
                {[
                  { icon: "🖼", label: "Change Wallpaper...", onClick: () => { setStartOpen(false); onOpenWallpaperPicker(); } },
                  { icon: "🐾", label: "Choose companion...", onClick: () => { setStartOpen(false); onOpenCompanionPicker(); } },
                ].map((item, i) => (
                  false ? null : (
                    <div
                      key={i}
                      onClick={(item as any).onClick}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        cursor: "pointer",
                        fontFamily: "'VT323', monospace",
                        fontSize: 17,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#000080", e.currentTarget.style.color = "#fff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = "#000")}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Permission dialog — portaled above everything */}
      {showPermissionDialog && createPortal(
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.32)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9000,
        }}>
          <div style={{
            width: 320,
            background: "#C0C0C0",
            border: "2px solid",
            borderColor: "#fff #555 #555 #fff",
            boxShadow: "3px 3px 0 #808080",
          }}>
            <div style={{
              background: "linear-gradient(90deg, #000080, #1084D0)",
              padding: "4px 8px",
              color: "#fff",
              fontFamily: "'VT323', monospace",
              fontSize: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span>✦ today's quote</span>
              <div
                onClick={() => setShowPermissionDialog(false)}
                style={{
                  width: 18, height: 18,
                  background: "#C0C0C0",
                  border: "2px solid",
                  borderColor: "#fff #555 #555 #fff",
                  color: "#000",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  lineHeight: 1,
                  fontFamily: "monospace",
                }}
              >
                ✕
              </div>
            </div>

            <div style={{ padding: 16 }}>
              <div style={{
                fontFamily: "'VT323', monospace",
                fontSize: 17,
                color: "#000",
                marginBottom: 14,
                lineHeight: 1.5,
              }}>
                want to know your quote for today? ✦
                <br />
                <span style={{ fontSize: 13, color: "#808080" }}>
                  your camera will be used to interact with the letters.
                  it stays on only while you play.
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowPermissionDialog(false)}
                  style={bevelBtnStyle}
                >
                  not now
                </button>
                <button
                  onClick={handlePermissionAccept}
                  style={{ ...bevelBtnStyle, background: "#000080", color: "#fff" }}
                >
                  yes, show me ✦
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Language picker */}
      {showLanguagePicker && (
        <LanguagePicker
          initialLanguage={selectedLanguage}
          onSelect={handleLanguageSelect}
          onCancel={() => setShowLanguagePicker(false)}
        />
      )}

      {/* Falling letters experience */}
      {showQuoteExperience && selectedLanguage && (
        <FallingLetters
          quote={getDailyQuote(selectedLanguage)}
          language={selectedLanguage}
          onComplete={handleQuoteComplete}
          onClose={() => setShowQuoteExperience(false)}
        />
      )}
    </div>
  );
}

function getTimeStr() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
