import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ── All 83 cat meme images from Figma ──────────────────────────────────────
import img0  from "../../imports/Frame1-1/8290beb361f2f918d23f148bd4c874ce69940c0b.png";
import img1  from "../../imports/Frame1-1/29a207e4627e60034f4d57eabc7bb53408a6c82c.png";
import img2  from "../../imports/Frame1-1/7f037ac8baa5ce7b43bbfba695b5f904797ac445.png";
import img3  from "../../imports/Frame1-1/155ef36af90e58801c16a04817ea3b7632f2cee4.png";
import img4  from "../../imports/Frame1-1/0c9ae9958d0f771f73587574f87692b7e1acec8f.png";
import img5  from "../../imports/Frame1-1/bf1293717eaec5ceeb88d37edb70bf24d6337b64.png";
import img6  from "../../imports/Frame1-1/19461707422482b566c9741aa2451e43498c1ad6.png";
import img7  from "../../imports/Frame1-1/d223bdb00478b75a07b7dfc6778727ad1bbcb928.png";
import img8  from "../../imports/Frame1-1/7752d929eedc87e20d36367f49ba46ffc4039079.png";
import img9  from "../../imports/Frame1-1/c59a2ac73c6c4ab2025eeba15a96818ebb1c3264.png";
import img10 from "../../imports/Frame1-1/9048927d1369a0f2146d1d2fe7a1a56dc00b9d5d.png";
import img11 from "../../imports/Frame1-1/0db8dbe064c933726336f1c1d37ac702f35dc3c6.png";
import img12 from "../../imports/Frame1-1/231929759c332929d18fcc591e878f130701d06b.png";
import img13 from "../../imports/Frame1-1/b8cdc93599538e2686597de262e905eb3af077b5.png";
import img14 from "../../imports/Frame1-1/7cddc6d41c3643bbad2680b3800ad962525732bf.png";
import img15 from "../../imports/Frame1-1/dbc0275b96b2c9cd319bc93f6db8d7cb792a9845.png";
import img16 from "../../imports/Frame1-1/0bcf22e209590ed3e2acd61d658456e3ee8eb4a8.png";
import img17 from "../../imports/Frame1-1/b9cc81c26c1fabd62bd6ee256b3ab0ca49b47333.png";
import img18 from "../../imports/Frame1-1/3b020d6e348805c851e24f08df189f4d58e67bba.png";
import img19 from "../../imports/Frame1-1/c1a569dacdf6cc307db01a1850001087ab00573b.png";
import img20 from "../../imports/Frame1-1/43891e24e5faf4430328f458b821ff450af60531.png";
import img21 from "../../imports/Frame1-1/7cba3c1048062f2b4a3cc637f09a8c0a8afa1050.png";
import img22 from "../../imports/Frame1-1/f5820dd879a1793eeb8eca2eb2540245efa9d7c6.png";
import img23 from "../../imports/Frame1-1/d007261ace4874f3e516915bb9cfc2964a353dfa.png";
import img24 from "../../imports/Frame1-1/0d491792ea1216b6d35ae05981d5dbf49536d5e2.png";
import img25 from "../../imports/Frame1-1/d575832ea936fa139fd22aa84e50b1868b67a700.png";
import img26 from "../../imports/Frame1-1/62edbec43ffec1a3a44602a957f15944c2a42acd.png";
import img27 from "../../imports/Frame1-1/9f1eb1b0696e154ada6d5cb421d714a6b0825e13.png";
import img28 from "../../imports/Frame1-1/abd596bf35ec19c5c08e92ad809025edb0ed8987.png";
import img29 from "../../imports/Frame1-1/abd97291982654a4d7f822042e10cd2c8574f3f6.png";
import img30 from "../../imports/Frame1-1/9ac9e8056ccecd852c03326c54b9cb52c5ae14e0.png";
import img31 from "../../imports/Frame1-1/0de40c50e2e8f1cf2c1f950eb00976f7149d3137.png";
import img32 from "../../imports/Frame1-1/36c908d108802ef7da63d12a60b39ed633fef445.png";
import img33 from "../../imports/Frame1-1/6096e13a3bad97ed22692534b2147d50a23612ee.png";
import img34 from "../../imports/Frame1-1/0b59daf7cc69cf97a6e3777b5781116694e883fe.png";
import img35 from "../../imports/Frame1-1/0966d4e467071652e01a2dd0ccc063e08c395288.png";
import img36 from "../../imports/Frame1-1/c4ada3508216bd250a7beb7e3b8c7a1a7da2dbc3.png";
import img37 from "../../imports/Frame1-1/bc60dacbf7ca63edd566fd2c679129ba6146d6b8.png";
import img38 from "../../imports/Frame1-1/59b2a434245513201136874ae551b81ccddc2ccb.png";
import img39 from "../../imports/Frame1-1/a0ac50a71cf3585174ec286470757b6e56189307.png";
import img40 from "../../imports/Frame1-1/5faaa1fb20f211f7f5dff40165a2f7f14a8de464.png";
import img41 from "../../imports/Frame1-1/f36aa0e87e56adec8243e99e2a7f5d0345ad727b.png";
import img42 from "../../imports/Frame1-1/cae205d63bf93fd14a45a43fc4d881409481b3eb.png";
import img43 from "../../imports/Frame1-1/f191e00652ae60749144b00575b844a97331be70.png";
import img44 from "../../imports/Frame1-1/d8e6fa01500589cad8926f345bd86c4c2a4b416e.png";
import img45 from "../../imports/Frame1-1/9629e0728b4543099db9b29764c396161222c0fd.png";
import img46 from "../../imports/Frame1-1/2fb5811eb80c20fa004cdcd0fd01bfe920cf0f99.png";
import img47 from "../../imports/Frame1-1/59364f2dc3d1bf51baa745241ae3cfd9338c6053.png";
import img48 from "../../imports/Frame1-1/6f699e750f0b865e233b83d085199d8a80b8f769.png";
import img49 from "../../imports/Frame1-1/28d061d30f0a6ab54254f32457d3dc1b018a93b8.png";
import img50 from "../../imports/Frame1-1/d412cbd40abb6e2731c7900e71eb03ec339a384f.png";
import img51 from "../../imports/Frame1-1/598562fce7ef56dc81f6792abaf07ee5ec9f4515.png";
import img52 from "../../imports/Frame1-1/064c80889a5ee07f2f1031dc360ce2a6949cefea.png";
import img53 from "../../imports/Frame1-1/a9edae253c3da50bd6ba0ab9f050336b6e7af4d8.png";
import img54 from "../../imports/Frame1-1/472a96a69cfa93a26730ac74d8e8aaabf5ebff3a.png";
import img55 from "../../imports/Frame1-1/5487912d112ebc88fe882f0b499f3528ec2a0bff.png";
import img56 from "../../imports/Frame1-1/42d098c27de4a96ba509817d5de9f48195d71b83.png";
import img57 from "../../imports/Frame1-1/3848073db2b794849696421c6069fb3d6afbe8ad.png";
import img58 from "../../imports/Frame1-1/ca44d13843f016697daa7780fa5401c34f649755.png";
import img59 from "../../imports/Frame1-1/4332b1f47b9e8c3bdfde6c72506fc47827e79439.png";
import img60 from "../../imports/Frame1-1/c50b58b5d13d740cdffac29b0fbca62d1e552b60.png";
import img61 from "../../imports/Frame1-1/90f324a5e0dbb18963e6b828efe751858a2df92b.png";
import img62 from "../../imports/Frame1-1/81a92b271934a4b96473571b31bf5d9f438a3426.png";
import img63 from "../../imports/Frame1-1/c5fbcbed40613d9d3d621f3de8d2a47a298647ca.png";
import img64 from "../../imports/Frame1-1/f43eb7df69d0d4e044304496307d5d4420109421.png";
import img65 from "../../imports/Frame1-1/70f1658ed209f2c350921e7f49489b05f0986160.png";
import img66 from "../../imports/Frame1-1/871814b6c0b20d448f9c46cd703de3710183d52c.png";
import img67 from "../../imports/Frame1-1/07993a4dd1092a91feb848fc48c5388bedd362df.png";
import img68 from "../../imports/Frame1-1/c61fc7ab5d3b6b5d66558d3c141e9670e9d4c9d8.png";
import img69 from "../../imports/Frame1-1/5b68288f527afcef03ad24824a98529953a3305e.png";
import img70 from "../../imports/Frame1-1/3a664a4cbf3a47e52f5c940432211f7ff26cee31.png";
import img71 from "../../imports/Frame1-1/9ef20e94733c0a6f833cd67570185304d9de9d45.png";
import img72 from "../../imports/Frame1-1/048df039948d3182766c67c032ed8ce4e68777e0.png";
import img73 from "../../imports/Frame1-1/95fa922d242fd2cdacc0c0b7d8b20d7e78d53e75.png";
import img74 from "../../imports/Frame1-1/092842629709b97a880f4aa6747509f93d89e15d.png";
import img75 from "../../imports/Frame1-1/b63312a03f16b7ff489a189f8cd103bf246de783.png";
import img76 from "../../imports/Frame1-1/22240fe766f14e056f38261105a8a112196a848f.png";
import img77 from "../../imports/Frame1-1/82602100fcde6dcf1e1e798b4d8a70eeb6eda4a8.png";
import img78 from "../../imports/Frame1-1/c3b72a093da4901acfe3124ef364b032989a5218.png";
import img79 from "../../imports/Frame1-1/0cdb1f2093abd8e58e974010a22f26adc0c4002d.png";
import img80 from "../../imports/Frame1-1/32d8779c622386e387d6d20575fa5979382f3bab.png";
import img81 from "../../imports/Frame1-1/639d216fccc7a2f719676941ce372e9f91485b8b.png";
import img82 from "../../imports/Frame1-1/70df26902888b0b659aa1b11a9aa8c6e69dc005c.png";

const CAT_POOL = [
  img0,  img1,  img2,  img3,  img4,  img5,  img6,  img7,  img8,  img9,
  img10, img11, img12, img13, img14, img15, img16, img17, img18, img19,
  img20, img21, img22, img23, img24, img25, img26, img27, img28, img29,
  img30, img31, img32, img33, img34, img35, img36, img37, img38, img39,
  img40, img41, img42, img43, img44, img45, img46, img47, img48, img49,
  img50, img51, img52, img53, img54, img55, img56, img57, img58, img59,
  img60, img61, img62, img63, img64, img65, img66, img67, img68, img69,
  img70, img71, img72, img73, img74, img75, img76, img77, img78, img79,
  img80, img81, img82,
];

const WIN_MESSAGES = [
  "memories unlocked ✦",
  "there you are",
  "welcome to your archive",
  "your memories are waiting",
  "the archive is open 📼",
];

const CONFETTI_SYMBOLS = ["♥", "★", "♥", "✦", "★", "♥", "✦", "★"];
const CONFETTI_COLORS  = ["#FF8C94", "#FFD93D", "#6BCB77", "#4D9DE0", "#FF6B6B", "#C77DFF"];

interface CardState {
  uid: number;
  pairId: number;
  src: string;
  flipped: boolean;
  matched: boolean;
}

interface Props {
  mood?: number;
  onComplete: () => void;
  onClose?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): CardState[] {
  const pool = shuffle(CAT_POOL);
  const chosen = pool.slice(0, 3);
  const pairs: CardState[] = [];
  chosen.forEach((src, pairId) => {
    pairs.push({ uid: pairId * 2,     pairId, src, flipped: false, matched: false });
    pairs.push({ uid: pairId * 2 + 1, pairId, src, flipped: false, matched: false });
  });
  return shuffle(pairs);
}

export function CatMemorama({ mood, onComplete, onClose }: Props) {
  const isSadStressed = mood !== undefined && (mood === 3 || mood === 4);

  const [cards, setCards] = useState<CardState[]>(() => buildDeck());
  const [faceUp, setFaceUp] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  const [prizeUid, setPrizeUid] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [winMsg] = useState(() => WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]);
  const [showConfetti, setShowConfetti] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flip = useCallback((uid: number) => {
    if (disabled) return;
    const card = cards.find(c => c.uid === uid);
    if (!card || card.flipped || card.matched) return;

    const nextFaceUp = [...faceUp, uid];
    setCards(prev => prev.map(c => c.uid === uid ? { ...c, flipped: true } : c));
    setFaceUp(nextFaceUp);

    if (nextFaceUp.length === 2) {
      setDisabled(true);
      const [a, b] = nextFaceUp.map(id => cards.find(c => c.uid === id)!);

      checkTimer.current = setTimeout(() => {
        if (a.pairId === b.pairId) {
          // Match!
          const newMatched = matchedCount + 1;
          setCards(prev => prev.map(c =>
            c.uid === a.uid || c.uid === b.uid ? { ...c, matched: true } : c
          ));
          setPrizeUid(b.uid);
          setTimeout(() => setPrizeUid(null), 1000);
          setMatchedCount(newMatched);
          setFaceUp([]);
          setDisabled(false);

          if (newMatched === 3) {
            setWon(true);
            setShowConfetti(true);
            winTimer.current = setTimeout(() => onComplete(), 2200);
          }
        } else {
          // No match — flip back
          setCards(prev => prev.map(c =>
            c.uid === a.uid || c.uid === b.uid ? { ...c, flipped: false } : c
          ));
          setFaceUp([]);
          setDisabled(false);
        }
      }, 800);
    }
  }, [cards, faceUp, disabled, matchedCount, onComplete]);

  useEffect(() => () => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (winTimer.current)  clearTimeout(winTimer.current);
  }, []);

  const confettiParticles = Array.from({ length: 24 }, (_, i) => ({
    sym: CONFETTI_SYMBOLS[i % CONFETTI_SYMBOLS.length],
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: Math.random() * 340 - 20,
    delay: Math.random() * 0.4,
  }));

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'VT323', monospace",
      zIndex: 5000,
    }}>
      {/* Win confetti layer */}
      <AnimatePresence>
        {showConfetti && (
          <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
            {confettiParticles.map((p, i) => (
              <motion.span
                key={i}
                initial={{ x: p.x + 260, y: -20, opacity: 1, rotate: 0 }}
                animate={{ y: 520, opacity: 0, rotate: 360 }}
                transition={{ duration: 1.6, delay: p.delay, ease: "easeIn" }}
                style={{
                  position: "absolute", top: 0, left: 0,
                  color: p.color, fontSize: 18, lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {p.sym}
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Win overlay (covers the dialog) */}
      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
              position: "fixed", inset: 0, zIndex: 999,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div style={{
              background: "#C0C0C0",
              border: "3px solid", borderColor: "#fff #555 #555 #fff",
              boxShadow: "2px 2px 0 #000",
              padding: "28px 36px",
              textAlign: "center",
              minWidth: 260,
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🐱</div>
              <div style={{ fontSize: 26, color: "#000080", marginBottom: 6 }}>{winMsg}</div>
              <div style={{ fontSize: 15, color: "#808080" }}>opening your archive...</div>
              {/* Progress dots */}
              <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 6 }}>
                {[0.2, 0.5, 0.8, 1.1].map((d, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: d }}
                    style={{ width: 8, height: 8, background: "#000080", borderRadius: "50%" }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog window */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        style={{
          background: "#C0C0C0",
          border: "2px solid", borderColor: "#fff #555 #555 #fff",
          boxShadow: "2px 2px 0 #000, 4px 4px 0 rgba(0,0,0,0.2)",
          width: 360,
          userSelect: "none",
        }}
      >
        {/* Title bar */}
        <div style={{
          background: "linear-gradient(90deg, #000080, #1084D0)",
          color: "#fff",
          padding: "4px 6px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 17,
        }}>
          <span>📼 unlock your memories — memorama.exe</span>
          {onClose && (
            <div
              onClick={onClose}
              style={{
                width: 16, height: 16,
                background: "#C0C0C0",
                border: "2px solid", borderColor: "#fff #555 #555 #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "#000", fontFamily: "monospace",
                cursor: "pointer", flexShrink: 0,
              }}
            >✕</div>
          )}
        </div>

        {/* Menu bar decoration */}
        <div style={{
          borderBottom: "1px solid #808080", borderTop: "1px solid #fff",
          padding: "1px 4px", background: "#C0C0C0", fontSize: 14,
          color: "#555",
        }} />

        {/* Body */}
        <div style={{ padding: "14px 16px 18px" }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 6,
          }}>
            {/* reCAPTCHA-style badge */}
            <div style={{
              width: 38, height: 38, flexShrink: 0,
              background: "#4D9DE0",
              border: "2px solid", borderColor: "#fff #333 #333 #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>
              🐱
            </div>
            <div>
              <div style={{ fontSize: 18, lineHeight: 1.2 }}>
                {isSadStressed
                  ? "take your time — just match the cats 💛"
                  : "match the cats to open the archive"}
              </div>
              <div style={{ fontSize: 14, color: "#808080" }}>no timer, no pressure ✦</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: 0, borderTop: "1px solid #808080", borderBottom: "1px solid #fff",
            margin: "10px 0",
          }} />

          {/* 2×3 card grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            justifyItems: "center",
          }}>
            {cards.map(card => (
              <MemCard
                key={card.uid}
                card={card}
                isPrize={card.uid === prizeUid}
                onClick={() => flip(card.uid)}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div style={{
            marginTop: 14, display: "flex", justifyContent: "center", gap: 8,
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: "50%",
                background: i < matchedCount ? "#2d6a4f" : "#C0C0C0",
                border: "2px solid", borderColor: i < matchedCount ? "#52b788 #1b4332 #1b4332 #52b788" : "#fff #808080 #808080 #fff",
                transition: "background 0.3s",
              }} />
            ))}
          </div>

          {/* reCAPTCHA footer */}
          <div style={{
            marginTop: 12, fontSize: 12, color: "#808080", textAlign: "right",
          }}>
            personalOS · memorama.exe v1.0
          </div>
        </div>
      </motion.div>

      <style>{`
        .memcard-inner {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .memcard-inner.flipped {
          transform: rotateY(180deg);
        }
        .memcard-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .memcard-back {
          /* default visible side */
        }
        .memcard-front {
          transform: rotateY(180deg);
        }
        @keyframes cardBounce {
          0%   { transform: rotateY(180deg) scale(1); }
          30%  { transform: rotateY(180deg) scale(1.18); }
          60%  { transform: rotateY(180deg) scale(0.96); }
          80%  { transform: rotateY(180deg) scale(1.06); }
          100% { transform: rotateY(180deg) scale(1); }
        }
        .memcard-inner.prize {
          animation: cardBounce 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

/* ── Memory card ─────────────────────────────────────────────────────────── */
function MemCard({ card, isPrize, onClick }: {
  card: CardState;
  isPrize: boolean;
  onClick: () => void;
}) {
  const isFlipped = card.flipped || card.matched;
  const innerClass = ["memcard-inner", isFlipped ? "flipped" : "", isPrize ? "prize" : ""].join(" ").trim();

  return (
    <div
      onClick={onClick}
      style={{
        width: 90, height: 90,
        perspective: 600,
        cursor: card.matched ? "default" : "pointer",
      }}
    >
      <div className={innerClass}>
        {/* Back face — card face-down */}
        <div
          className="memcard-face memcard-back"
          style={{
            background: "#4D9DE0",
            border: "3px solid", borderColor: "#6BB8F0 #1a5c8a #1a5c8a #6BB8F0",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.15)",
          }}
        >
          <span style={{ fontSize: 32, color: "#fff", opacity: 0.9, fontFamily: "'VT323', monospace" }}>?</span>
        </div>

        {/* Front face — cat meme */}
        <div
          className="memcard-face memcard-front"
          style={{
            border: card.matched
              ? "3px solid" : "3px solid",
            borderColor: card.matched
              ? "#52b788 #1b4332 #1b4332 #52b788"
              : "#fff #555 #555 #fff",
            overflow: "hidden",
            background: "#f0f0f0",
          }}
        >
          <img
            src={card.src}
            alt="cat meme"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {card.matched && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(82,183,136,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 22, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}>✓</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
