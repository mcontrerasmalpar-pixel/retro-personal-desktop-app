import React, { useState, useCallback, useRef, useEffect } from "react";
import { makeBlobCursor } from "../App";
import { CatMemorama } from "./CatMemorama";
import { DraggableWindow } from "./DraggableWindow";
import { Taskbar } from "./Taskbar";
import { PixelPet } from "./PixelPet";
import { MySpaceWindow } from "./windows/MySpaceWindow";
import { MyNetworkWindow } from "./windows/MyNetworkWindow";
import { MemoriesWindow } from "./windows/MemoriesWindow";
import { HobbiesWindow } from "./windows/HobbiesWindow";
import { TimeWindow } from "./windows/TimeWindow";
import { WeatherWindow } from "./windows/WeatherWindow";
import { JournalWindow } from "./windows/JournalWindow";
import { GoalsWindow } from "./windows/GoalsWindow";
import { PolaroidWidget } from "./PolaroidWidget";
import { WallpaperPicker, WallpaperOption, WALLPAPERS } from "./WallpaperPicker";
import { CompanionPicker } from "./CompanionPicker";

import imgNetworkIcon from "../../imports/Frame31/de305db1dc194a52295ae88edb0c58b127570c7e.png";
import imgFolderIcon from "../../imports/Frame31/260d63e92cab49e82c8dd3ad9aae04b50b2fcd5b.png";
import imgGlobeIcon from "../../imports/Frame31/e223e4e707391fdba4fa9a3207b1c1d09cd27b5a.png";
import imgComputerIcon from "../../imports/Frame31/8307fb0f2ba5d6ae91376a0ccd938f42cc41aa7e.png";

interface WindowState {
  id: string;
  open: boolean;
  minimized: boolean;
  zIndex: number;
}

type WindowId =
  | "myspace"
  | "mynetwork"
  | "memories"
  | "hobbies"
  | "time"
  | "weather"
  | "journal"
  | "goals";

const WINDOW_CONFIGS: {
  id: WindowId;
  title: string;
  label: string;
  icon: React.ReactNode;
  desktopIcon: React.ReactNode | null;
  initialPos: { x: number; y: number };
  width: number;
  minHeight: number;
  desktopIconHidden?: boolean;
}[] = [
  {
    id: "myspace",
    title: "My Space — me.exe",
    label: "MY SPACE",
    icon: <FolderIcon tabColor="#FF6B9D" />,
    desktopIcon: <FolderIcon tabColor="#FF6B9D" />,
    initialPos: { x: 80, y: 60 },
    width: 480,
    minHeight: 420,
  },
  {
    id: "mynetwork",
    title: "My Network — people.dll",
    label: "MY NETWORK",
    icon: <FolderIcon tabColor="#4D9DE0" />,
    desktopIcon: <FolderIcon tabColor="#4D9DE0" />,
    initialPos: { x: 160, y: 80 },
    width: 460,
    minHeight: 400,
  },
  {
    id: "memories",
    title: "Memories — archive.zip",
    label: "MEMORIES",
    icon: <FolderIcon tabColor="#6BCB77" />,
    desktopIcon: <FolderIcon tabColor="#6BCB77" />,
    initialPos: { x: 240, y: 60 },
    width: 520,
    minHeight: 440,
  },
  {
    id: "hobbies",
    title: "My Hobbies — explore.html",
    label: "MY HOBBIES",
    icon: <FolderIcon tabColor="#E15FED" />,
    desktopIcon: <FolderIcon tabColor="#E15FED" />,
    initialPos: { x: 100, y: 100 },
    width: 500,
    minHeight: 460,
  },
  {
    id: "time",
    title: "Time — clock.sys",
    label: "TIME",
    icon: <span style={{ fontSize: 16 }}>🕐</span>,
    desktopIcon: <ClockIcon />,
    initialPos: { x: 300, y: 80 },
    width: 300,
    minHeight: 360,
  },
  {
    id: "weather",
    title: "Weather — sky.dat",
    label: "WEATHER",
    icon: <span style={{ fontSize: 16 }}>⛅</span>,
    desktopIcon: <WeatherIcon />,
    initialPos: { x: 200, y: 120 },
    width: 380,
    minHeight: 420,
  },
  {
    id: "journal",
    title: "Journal — journal.txt",
    label: "JOURNAL",
    icon: <span style={{ fontSize: 16 }}>📓</span>,
    desktopIcon: null,
    desktopIconHidden: true,
    initialPos: { x: 560, y: 80 },
    width: 440,
    minHeight: 360,
  },
  {
    id: "goals",
    title: "Goals — goals.dat",
    label: "GOALS",
    icon: <span style={{ fontSize: 16 }}>🎯</span>,
    desktopIcon: null,
    desktopIconHidden: true,
    initialPos: { x: 580, y: 100 },
    width: 480,
    minHeight: 500,
  },
];

interface Props {
  username: string;
  initialMood?: number;
}

export function Desktop({ username, initialMood }: Props) {
  const [windows, setWindows] = useState<Record<WindowId, WindowState>>(
    Object.fromEntries(
      WINDOW_CONFIGS.map((c, i) => [
        c.id,
        { id: c.id, open: false, minimized: false, zIndex: 100 + i },
      ])
    ) as Record<WindowId, WindowState>
  );
  const [topZ, setTopZ] = useState(200);
  const [activeId, setActiveId] = useState<WindowId | null>(null);
  const [doubleClickTimer, setDoubleClickTimer] = useState<Record<string, number>>({});
  const [selectedMood, setSelectedMood] = useState<number | null>(initialMood ?? null);
  const [mySpaceWelcome, setMySpaceWelcome] = useState(false);
  const [petHappy, setPetHappy] = useState(false);
  const petHappyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wallpaper, setWallpaper] = useState<WallpaperOption>(
    WALLPAPERS.find(w => w.id === "bliss") ?? WALLPAPERS[0]
  );
  const [autoMoodWallpaper, setAutoMoodWallpaper] = useState(false);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const VALID_COMPANIONS = ["cat", "dog", "chicken", "cow", "redpanda", "frog"];
  const [companion, setCompanion] = useState(() => {
    const saved = localStorage.getItem("personalos_companion") ?? "";
    return VALID_COMPANIONS.includes(saved) ? saved : "cat";
  });
  const [companionPickerOpen, setCompanionPickerOpen] = useState(false);
  const [intentionJustCompleted, setIntentionJustCompleted] = useState(false);
  const [allGoalsSaved, setAllGoalsSaved] = useState(false);
  const [petThought, setPetThought] = useState<string | null>(null);
  const petThoughtTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [memoramaShown, setMemoramaShown] = useState(false);
  const [showMemorama, setShowMemorama] = useState(false);

  const PET_JOURNAL_REACTIONS = [
    "that sounds hard",
    "I'm proud of you",
    "yay!",
    "thank you for sharing",
    "I'm here with you",
    "you did that",
    "this matters",
  ];

  const handleJournalSaved = useCallback((_text: string) => {
    if (petThoughtTimer.current) clearTimeout(petThoughtTimer.current);
    const msg = PET_JOURNAL_REACTIONS[Math.floor(Math.random() * PET_JOURNAL_REACTIONS.length)];
    setPetThought(msg);
    petThoughtTimer.current = setTimeout(() => setPetThought(null), 4000);
  }, []);

  const handleIntentionComplete = useCallback(() => {
    setIntentionJustCompleted(true);
    setTimeout(() => setIntentionJustCompleted(false), 150);
  }, []);

  const petMoodStr: "blooming" | "neutral" | "healing" | undefined =
    selectedMood === null
      ? undefined
      : selectedMood <= 1
      ? "blooming"
      : selectedMood === 2
      ? "neutral"
      : "healing";

  const handleAllIntentionsComplete = useCallback(() => {
    if (petHappyTimer.current) clearTimeout(petHappyTimer.current);
    setPetHappy(true);
    petHappyTimer.current = setTimeout(() => setPetHappy(false), 3000);
  }, []);

  const focusWindow = useCallback(
    (id: WindowId) => {
      const newZ = topZ + 1;
      setTopZ(newZ);
      setActiveId(id);
      setWindows(prev => ({ ...prev, [id]: { ...prev[id], zIndex: newZ } }));
    },
    [topZ]
  );

  const openWindow = useCallback(
    (id: WindowId) => {
      if (id === "memories" && !memoramaShown) {
        setShowMemorama(true);
        return;
      }
      const newZ = topZ + 1;
      setTopZ(newZ);
      setActiveId(id);
      setWindows(prev => ({
        ...prev,
        [id]: { ...prev[id], open: true, minimized: false, zIndex: newZ },
      }));
    },
    [topZ, memoramaShown]
  );

  const handleMemoramaComplete = useCallback(() => {
    setShowMemorama(false);
    setMemoramaShown(true);
    const newZ = topZ + 1;
    setTopZ(newZ);
    setActiveId("memories");
    setWindows(prev => ({
      ...prev,
      memories: { ...prev.memories, open: true, minimized: false, zIndex: newZ },
    }));
  }, [topZ]);

  const closeWindow = useCallback(
    (id: WindowId) => {
      setWindows(prev => ({ ...prev, [id]: { ...prev[id], open: false } }));
      if (activeId === id) setActiveId(null);
    },
    [activeId]
  );

  const minimizeWindow = useCallback(
    (id: WindowId) => {
      setWindows(prev => ({ ...prev, [id]: { ...prev[id], minimized: true } }));
      if (activeId === id) setActiveId(null);
    },
    [activeId]
  );

  const restoreWindow = useCallback(
    (id: string) => {
      const wid = id as WindowId;
      const newZ = topZ + 1;
      setTopZ(newZ);
      setActiveId(wid);
      setWindows(prev => ({
        ...prev,
        [wid]: { ...prev[wid], minimized: false, zIndex: newZ },
      }));
    },
    [topZ]
  );

  const handleIconClick = (id: WindowId) => {
    const now = Date.now();
    const last = doubleClickTimer[id] || 0;
    if (now - last < 400) {
      openWindow(id);
      setDoubleClickTimer(prev => ({ ...prev, [id]: 0 }));
    } else {
      setDoubleClickTimer(prev => ({ ...prev, [id]: now }));
    }
  };

  const handleMoodChange = useCallback(
    (mood: number) => {
      setSelectedMood(mood);
      if (autoMoodWallpaper) {
        const moodKey = mood <= 1 ? "blooming" : mood === 2 ? "neutral" : "healing";
        const match = WALLPAPERS.find(w => w.mood === moodKey);
        if (match) setWallpaper(match);
      }
    },
    [autoMoodWallpaper]
  );

  useEffect(() => {
    if (initialMood !== undefined) handleMoodChange(initialMood);
  }, []);

  // Taskbar shows minimized windows from all registered configs
  const minimizedWindows = WINDOW_CONFIGS.filter(
    c => windows[c.id].open && windows[c.id].minimized
  ).map(c => ({ id: c.id, title: c.label }));

  // Desktop icons — only configs without desktopIconHidden
  const desktopIconConfigs = WINDOW_CONFIGS.filter(c => !c.desktopIconHidden);

  const MOOD_CURSOR_COLORS: Record<number, string> = {
    0: "#FFE566",
    1: "#6BCB77",
    2: "#4D9DE0",
    3: "#E15FED",
    4: "#FF6B9D",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: wallpaper.value,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'VT323', monospace",
        transition: "background 0.6s ease",
        cursor: makeBlobCursor(MOOD_CURSOR_COLORS[selectedMood ?? 0] ?? "#FFE566"),
      }}
      onContextMenu={e => {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
      }}
      onClick={() => setCtxMenu(null)}
    >
      {/* Subtle scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 4px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Desktop icons — left column (hidden-icon windows excluded) */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          zIndex: 50,
        }}
      >
        {desktopIconConfigs.map(config => (
          <DesktopIcon
            key={config.id}
            label={config.label}
            icon={config.desktopIcon!}
            onClick={() => handleIconClick(config.id)}
            selected={windows[config.id].open && !windows[config.id].minimized}
          />
        ))}
      </div>

      {/* All windows */}
      {WINDOW_CONFIGS.map(config => {
        const w = windows[config.id];
        if (!w.open || w.minimized) return null;
        return (
          <DraggableWindow
            key={config.id}
            id={config.id}
            title={config.title}
            icon={config.icon}
            onClose={() => closeWindow(config.id)}
            onMinimize={() => minimizeWindow(config.id)}
            onFocus={() => focusWindow(config.id)}
            zIndex={w.zIndex}
            initialPosition={config.initialPos}
            width={config.width}
            minHeight={config.minHeight}
          >
            <WindowContent
              id={config.id}
              username={username}
              currentMood={selectedMood ?? undefined}
              companion={companion}
              mySpaceWelcome={mySpaceWelcome}
              onAllIntentionsComplete={handleAllIntentionsComplete}
              onIntentionComplete={handleIntentionComplete}
              onOpenJournal={() => openWindow("journal")}
              onOpenGoals={() => openWindow("goals")}
              onAllGoalsSaved={() => setAllGoalsSaved(true)}
              onJournalSaved={handleJournalSaved}
            />
          </DraggableWindow>
        );
      })}

      {/* Desktop polaroid widget */}
      <PolaroidWidget mood={selectedMood ?? 0} />

      {/* Companion picker */}
      {companionPickerOpen && (
        <CompanionPicker
          currentId={companion}
          onSelect={id => {
            setCompanion(id);
            localStorage.setItem("personalos_companion", id);
          }}
          onClose={() => setCompanionPickerOpen(false)}
        />
      )}

      {/* Memories memorama gate */}
      {showMemorama && (
        <CatMemorama
          mood={selectedMood ?? undefined}
          onComplete={handleMemoramaComplete}
          onClose={() => setShowMemorama(false)}
        />
      )}

      {/* Wallpaper picker */}
      {wallpaperPickerOpen && (
        <WallpaperPicker
          current={wallpaper}
          autoMood={autoMoodWallpaper}
          onApply={setWallpaper}
          onAutoMoodChange={setAutoMoodWallpaper}
          onClose={() => setWallpaperPickerOpen(false)}
        />
      )}

      {/* Right-click context menu */}
      {ctxMenu && (
        <div
          style={{
            position: "fixed",
            left: ctxMenu.x,
            top: Math.min(ctxMenu.y, window.innerHeight - 160),
            background: "#C0C0C0",
            border: "2px solid",
            borderColor: "#fff #555 #555 #fff",
            zIndex: 7000,
            minWidth: 180,
            boxShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            fontFamily: "'VT323', monospace",
          }}
          onClick={e => e.stopPropagation()}
        >
          {[
            {
              icon: "🖼",
              label: "Change Wallpaper...",
              action: () => { setWallpaperPickerOpen(true); setCtxMenu(null); },
            },
            { icon: "🔄", label: "Refresh", action: () => setCtxMenu(null) },
            null,
            { icon: "ℹ️", label: "PersonalOS v1.0", action: () => setCtxMenu(null) },
          ].map((item, i) =>
            item === null ? (
              <div
                key={i}
                style={{
                  height: 1,
                  background: "#808080",
                  margin: "2px 4px",
                  borderBottom: "1px solid #fff",
                }}
              />
            ) : (
              <div
                key={i}
                onClick={item.action}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontSize: 17,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#000080";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#000";
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            )
          )}
        </div>
      )}

      {/* Pet + cloud + thought bubble — bottom right */}
      <div style={{ position: "fixed", bottom: 60, right: 16, zIndex: 7500 }}>
        {/* Thought bubble */}
        {petThought && (
          <div style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            marginBottom: 8,
            background: "#FFFFC0",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "6px 10px",
            fontFamily: "'VT323', monospace",
            fontSize: 15,
            color: "#333",
            whiteSpace: "nowrap",
            animation: "thoughtIn 0.2s ease-out",
            zIndex: 1,
          }}>
            {petThought}
            {/* Triangle tail pointing down */}
            <div style={{
              position: "absolute",
              bottom: -7,
              right: 18,
              width: 0, height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "7px solid #333",
            }} />
            <div style={{
              position: "absolute",
              bottom: -5,
              right: 19,
              width: 0, height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "6px solid #FFFFC0",
            }} />
          </div>
        )}

        {/* Floating cloud + pet group */}
        <div style={{
          position: "relative",
          width: 90,
          height: 120,
          animation: "cloudFloat 4s ease-in-out infinite",
        }}>
          {/* Pet sits above the cloud */}
          <div style={{
            position: "absolute",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
          }}>
            <PixelPet
              companionId={companion}
              mood={petMoodStr}
              intentionJustCompleted={intentionJustCompleted}
              allIntentionsDone={petHappy}
              showOvni={petHappy && allGoalsSaved && companion === "cow"}
            />
          </div>

          {/* Cloud */}
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 90, height: 40 }}>
            {/* Left bump */}
            <div style={{
              position: "absolute",
              width: 40, height: 35,
              background: "rgba(255,255,255,0.92)",
              borderRadius: "50%",
              top: -18, left: 8,
            }} />
            {/* Right bump */}
            <div style={{
              position: "absolute",
              width: 50, height: 38,
              background: "rgba(255,255,255,0.92)",
              borderRadius: "50%",
              top: -20, right: 6,
            }} />
            {/* Cloud body */}
            <div style={{
              width: 90, height: 40,
              background: "rgba(255,255,255,0.92)",
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              boxShadow: "0 4px 0 rgba(0,0,0,0.08)",
            }} />
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <Taskbar
        minimizedWindows={minimizedWindows}
        onRestoreWindow={restoreWindow}
        activeWindowId={activeId}
        onOpenWallpaperPicker={() => setWallpaperPickerOpen(true)}
        onOpenCompanionPicker={() => setCompanionPickerOpen(true)}
        currentMood={selectedMood ?? undefined}
      />

      <style>{`
        @keyframes winOpen {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes cloudFloat {
          0%,  100% { transform: translateY(0)    translateX(0); }
          25%        { transform: translateY(-8px)  translateX(4px); }
          50%        { transform: translateY(-6px)  translateX(-4px); }
          75%        { transform: translateY(-10px) translateX(2px); }
        }
        @keyframes thoughtIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── WindowContent ─────────────────────────────────────────────────────── */
function WindowContent({
  id,
  username,
  currentMood,
  companion,
  mySpaceWelcome,
  onAllIntentionsComplete,
  onIntentionComplete,
  onOpenJournal,
  onOpenGoals,
  onAllGoalsSaved,
  onJournalSaved,
}: {
  id: WindowId;
  username: string;
  currentMood?: number;
  companion?: string;
  mySpaceWelcome?: boolean;
  onAllIntentionsComplete?: () => void;
  onIntentionComplete?: () => void;
  onOpenJournal?: () => void;
  onOpenGoals?: () => void;
  onAllGoalsSaved?: () => void;
  onJournalSaved?: (text: string) => void;
}) {
  switch (id) {
    case "myspace":
      return (
        <MySpaceWindow
          username={username}
          currentMood={currentMood}
          showWelcome={mySpaceWelcome}
          onAllComplete={onAllIntentionsComplete}
          onIntentionComplete={onIntentionComplete}
          onOpenJournal={onOpenJournal}
          onOpenGoals={onOpenGoals}
        />
      );
    case "journal":
      return <JournalWindow onJournalSaved={onJournalSaved} />;
    case "goals":
      return <GoalsWindow onAllGoalsSaved={onAllGoalsSaved} />;
    case "mynetwork":
      return <MyNetworkWindow />;
    case "memories":
      return <MemoriesWindow />;
    case "hobbies":
      return <HobbiesWindow />;
    case "time":
      return <TimeWindow />;
    case "weather":
      return <WeatherWindow companionId={companion} />;
    default:
      return null;
  }
}

/* ─── DesktopIcon ───────────────────────────────────────────────────────── */
function DesktopIcon({
  label,
  icon,
  onClick,
  selected,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        width: 80,
        cursor: "pointer",
        padding: "4px",
        background:
          hovered || selected ? "rgba(255,255,255,0.2)" : "transparent",
        borderRadius: 2,
        transition: "background 0.1s",
        transform: hovered ? "scale(1.05)" : "scale(1)",
        transformOrigin: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: "'VT323', monospace",
          fontSize: 14,
          color: "#fff",
          textAlign: "center",
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
          lineHeight: 1.2,
          background: selected ? "#000080" : "transparent",
          padding: "1px 2px",
          maxWidth: 80,
          wordBreak: "break-word",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─── SVG pixel-art icons ───────────────────────────────────────────────── */
function FolderIcon({ tabColor, bodyColor = "#F0C040" }: { tabColor: string; bodyColor?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ imageRendering: "pixelated" }}>
      <rect x="4" y="14" width="16" height="6" rx="2" fill={tabColor} />
      <rect x="4" y="18" width="40" height="26" rx="2" fill={bodyColor} />
      <rect x="4" y="18" width="40" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <rect x="4" y="40" width="40" height="4" rx="2" fill="rgba(0,0,0,0.15)" />
    </svg>
  );
}

function MySpaceIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: "pixelated" }}
    >
      <rect width="48" height="48" fill="none" />
      <circle cx="24" cy="14" r="9" fill="#D2691E" />
      <rect x="14" y="26" width="20" height="16" rx="3" fill="#8B4513" />
      <rect x="10" y="28" width="8" height="12" rx="2" fill="#A0522D" />
      <rect x="30" y="28" width="8" height="12" rx="2" fill="#A0522D" />
      <rect x="20" y="11" width="3" height="3" rx="1" fill="#5C2700" />
      <rect x="27" y="11" width="3" height="3" rx="1" fill="#5C2700" />
      <path d="M20 18 Q24 22 28 18" fill="none" stroke="#5C2700" strokeWidth="1.5" />
      <polygon
        points="38,4 39.5,8.5 44,8.5 40.5,11 42,16 38,13 34,16 35.5,11 32,8.5 36.5,8.5"
        fill="#FFD700"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: "pixelated" }}
    >
      <circle cx="24" cy="24" r="20" fill="#fff" stroke="#555" strokeWidth="2" />
      <circle cx="24" cy="24" r="18" fill="#f8f8f8" stroke="#C0C0C0" strokeWidth="1" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={24 + 14 * Math.cos(a)}
            y1={24 + 14 * Math.sin(a)}
            x2={24 + 17 * Math.cos(a)}
            y2={24 + 17 * Math.sin(a)}
            stroke="#333"
            strokeWidth="1.5"
          />
        );
      })}
      <line x1="24" y1="24" x2="18" y2="15" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="24" x2="30" y2="11" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="24" x2="24" y2="9" stroke="#cc0000" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2" fill="#333" />
    </svg>
  );
}

function WeatherIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: "pixelated" }}
    >
      <circle cx="22" cy="20" r="8" fill="#FFD700" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={22 + 10 * Math.cos(a)}
            y1={20 + 10 * Math.sin(a)}
            x2={22 + 13 * Math.cos(a)}
            y2={20 + 13 * Math.sin(a)}
            stroke="#FFD700"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
      <ellipse cx="28" cy="30" rx="14" ry="9" fill="#E0E0E0" />
      <ellipse cx="20" cy="32" rx="9" ry="7" fill="#D0D0D0" />
      <ellipse cx="36" cy="31" rx="8" ry="6" fill="#E0E0E0" />
    </svg>
  );
}
