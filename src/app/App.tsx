import { useState, useEffect } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { MoodScreen } from "./components/MoodScreen";
import { Desktop } from "./components/Desktop";

type Stage = "login" | "mood" | "desktop";

export const makeBlobCursor = (color: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <path d="
      M16 2
      C20 2, 26 4, 28 8
      C30 11, 31 14, 29 18
      C27 22, 30 26, 26 28
      C22 30, 18 31, 14 29
      C10 27, 6 29, 4 26
      C2 23, 1 19, 3 15
      C5 11, 2 7, 6 5
      C9 3, 13 2, 16 2 Z
    " fill="${color}" opacity="0.92"/>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, auto`;
};

export default function App() {
  const [stage, setStage] = useState<Stage>("login");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { cursor: ${makeBlobCursor("#FFE566")} !important; }
      button, [role="button"], a, .desktop-icon, .bevel-btn, .start-btn, label, select
        { cursor: ${makeBlobCursor("#FF6B9D")} !important; }
      input, textarea
        { cursor: ${makeBlobCursor("#4D9DE0")} !important; }
      .win-titlebar, [class*="titlebar"], [class*="title-bar"]
        { cursor: ${makeBlobCursor("#E15FED")} !important; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [username, setUsername] = useState("");
  const [initialMood, setInitialMood] = useState<number | undefined>(undefined);
  const [canvasSnapshot, setCanvasSnapshot] = useState<string | null>(null);

  const handleLogin = (name: string, snapshot: string | null) => {
    setUsername(name);
    setCanvasSnapshot(snapshot);
    setStage("mood");
  };

  const handleMoodComplete = (moodIndex: number) => {
    setInitialMood(moodIndex);
    setStage("desktop");
  };

  const companionId = (() => {
    const saved = localStorage.getItem("personalos_companion") ?? "";
    const valid = ["cat", "dog", "chicken", "cow", "redpanda", "frog"];
    return valid.includes(saved) ? saved : "cat";
  })();

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; overflow: hidden; }
        ::-webkit-scrollbar { width: 14px; height: 14px; }
        ::-webkit-scrollbar-track { background: #C0C0C0; }
        ::-webkit-scrollbar-thumb {
          background: #C0C0C0;
          border: 2px solid;
          border-color: #fff #555 #555 #fff;
        }
        ::-webkit-scrollbar-corner { background: #C0C0C0; }
        @keyframes winOpen {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes catBlink {
          0%, 88%, 100% { transform: scaleY(1); }
          94% { transform: scaleY(0.1); }
        }
        @keyframes catWag {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes catBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes catWalk {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-2px); }
          75% { transform: translateY(1px); }
        }
        @keyframes catLegSwing {
          0%, 100% { transform: rotate(12deg); }
          50% { transform: rotate(-12deg); }
        }
        @keyframes catTailWalk {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes bootFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes bootFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes blockBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes confettiFall {
          from { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          to { transform: translateY(60px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
        {stage === "login"   && <LoginScreen onLogin={handleLogin} />}
        {stage === "mood"    && <MoodScreen username={username} companionId={companionId} canvasSnapshot={canvasSnapshot} onComplete={handleMoodComplete} />}
        {stage === "desktop" && <Desktop username={username} initialMood={initialMood} />}
      </div>
    </>
  );
}
