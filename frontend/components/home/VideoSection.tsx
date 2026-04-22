"use client";

import { useRef, useState, useEffect, Fragment } from "react";
import styles from "./VideoSection.module.css";

const TIKTOK_PATH =
  "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.52V6.77a4.85 4.85 0 0 1-1.02-.08z";

const HEART_PATH =
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

const VOLUME_OFF_PATH = "M9 9v6l-5-3V9h5z";
const VOLUME_OFF_ARC = "M15.54 8.46a5 5 0 0 1 0 7.07";
const VOLUME_ON_POLY = "11 5 6 9 2 9 2 15 6 15 11 19 11 5";
const VOLUME_ON_ARC1 = "M19.07 4.93a10 10 0 0 1 0 14.14";
const VOLUME_ON_ARC2 = "M15.54 8.46a5 5 0 0 1 0 7.07";

const TIKTOK_AVATARS = [
  {
    id: 1,
    initials: "ML",
    color: "#e86b8c",
    delay: 0,
    bottom: "38%",
    size: 38,
  },
  {
    id: 2,
    initials: "SA",
    color: "#9b72cf",
    delay: 0.9,
    bottom: "54%",
    size: 32,
  },
  {
    id: 3,
    initials: "FH",
    color: "#f4a261",
    delay: 1.8,
    bottom: "68%",
    size: 36,
  },
  {
    id: 4,
    initials: "CK",
    color: "#2ec4b6",
    delay: 2.5,
    bottom: "24%",
    size: 30,
  },
];

const HEARTS = [
  { id: 1, delay: 0, left: "12%", size: 18, color: "#e86b8c" },
  { id: 2, delay: 0.6, left: "30%", size: 14, color: "#f4a261" },
  { id: 3, delay: 1.3, left: "60%", size: 20, color: "#e86b8c" },
  { id: 4, delay: 2.0, left: "80%", size: 12, color: "#9b72cf" },
  { id: 5, delay: 2.8, left: "48%", size: 16, color: "#e86b8c" },
];

const STATS = [
  { target: 15, suffix: "+", label: "Artisanes" },
  { target: 500, suffix: "+", label: "Clientes" },
  { target: 100, suffix: "%", label: "Main" },
];

/* ── Compteur animé (easeOutQuart) ── */
function useCounter(target: number, active: boolean, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return count;
}

function AnimatedStat({
  target,
  suffix,
  label,
  active,
  delay,
}: {
  target: number;
  suffix: string;
  label: string;
  active: boolean;
  delay: number;
}) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (active && !started) {
      const t = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(t);
    }
  }, [active, started, delay]);
  const count = useCounter(target, started);
  return (
    <div className={styles.stat}>
      <span className={styles.statNum}>
        {count}
        {suffix}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

export default function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const videoSideRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [heartsActive, setHeartsActive] = useState(false);
  const [statsActive, setStatsActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            if (entry.target === sectionRef.current) {
              setIsVisible(true);
              setTimeout(() => setStatsActive(true), 400);
              setTimeout(() => setHeartsActive(true), 800);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    if (textRef.current) observer.observe(textRef.current);
    if (videoSideRef.current) observer.observe(videoSideRef.current);
    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <section
      className={`${styles.root} ${isVisible ? styles.rootVisible : ""}`}
      ref={sectionRef}
    >
      <span className={styles.watermark} aria-hidden="true">
        A
      </span>

      <div className={styles.container}>
        {/* ── TEXTE GAUCHE ── */}
        <div className={styles.text} ref={textRef}>
          <p className={styles.eyebrow}>Savoir-Faire</p>
          <h2 className={styles.title}>Dans les coulisses</h2>
          <p className={styles.titleItalic}>de nos ateliers.</p>

          <div className={styles.sep}>
            <div className={styles.sepLine} />
            <div className={styles.sepDot} />
          </div>

          <p className={styles.desc}>
            Chaque point de crochet raconte une histoire. Nos artisanes
            malgaches travaillent avec minutie et passion pour créer des pièces
            uniques.
          </p>

          {/* Stats avec compteurs animés */}
          <div className={styles.stats}>
            {STATS.map((s, i) => (
              <Fragment key={s.label}>
                {i > 0 && <div className={styles.statDivider} />}
                <AnimatedStat
                  target={s.target}
                  suffix={s.suffix}
                  label={s.label}
                  active={statsActive}
                  delay={i * 200}
                />
              </Fragment>
            ))}
          </div>

          <a
            href="https://www.tiktok.com/@artjatie"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btn}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d={TIKTOK_PATH} />
            </svg>
            <span>Nous suivre sur TikTok</span>
            <span className={styles.btnArrow}>→</span>
          </a>
        </div>

        {/* ── VIDEO DROITE ── */}
        <div className={styles.videoSide} ref={videoSideRef}>
          <div className={styles.circle} aria-hidden="true" />

          <div className={styles.tiktokBadge} aria-hidden="true">
            <span>Live sur TikTok</span>
          </div>

          <div className={styles.floatCard} aria-hidden="true">
            <div className={styles.floatIcon}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--pink)"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d={HEART_PATH} />
              </svg>
            </div>
            <div>
              <div className={styles.floatNum}>★ 4.9</div>
              <div className={styles.floatLabel}>Satisfaction</div>
            </div>
          </div>

          {/* Avatars + cœurs */}
          <div className={styles.avatarStrip} aria-hidden="true">
            {TIKTOK_AVATARS.map((av) => (
              <div
                key={av.id}
                className={`${styles.avatarItem} ${heartsActive ? styles.avatarVisible : ""}`}
                style={{
                  bottom: av.bottom,
                  animationDelay: `${av.delay}s`,
                  transitionDelay: `${av.delay * 0.4}s`,
                }}
              >
                <div
                  className={styles.avatarCircle}
                  style={{
                    width: av.size,
                    height: av.size,
                    background: av.color,
                    fontSize: av.size * 0.36,
                  }}
                >
                  {av.initials}
                </div>
                <div className={styles.avatarHeart} style={{ color: av.color }}>
                  ♥
                </div>
              </div>
            ))}

            {heartsActive &&
              HEARTS.map((h) => (
                <div
                  key={h.id}
                  className={styles.floatingHeart}
                  style={{
                    left: h.left,
                    fontSize: h.size,
                    color: h.color,
                    animationDelay: `${h.delay}s`,
                  }}
                >
                  ♥
                </div>
              ))}
          </div>

          {/*
            ── TÉLÉPHONE ──
            CORRECTION DÉBORDEMENT :
            phoneWrap = conteneur avec overflow:visible → gère rotation + ombre + boutons physiques
            phone     = conteneur avec overflow:hidden  → clip propre du châssis + écran
            Ainsi le ::before (inset:-3px) est clipé par .phone, pas par .phoneWrap.
          */}
          <div
            className={`${styles.phoneWrap} ${isVisible ? styles.phoneVisible : ""}`}
          >
            {/* Boutons physiques titanium — hors du clip */}
            <div className={styles.phoneSilent} aria-hidden="true" />
            <div className={styles.phoneVol1} aria-hidden="true" />
            <div className={styles.phoneVol2} aria-hidden="true" />
            <div className={styles.phonePower} aria-hidden="true" />

            {/* Châssis clipé proprement */}
            <div className={styles.phone}>
              <div className={styles.phoneInner}>
                <div className={styles.dynamicIsland} aria-hidden="true" />

                <video
                  ref={videoRef}
                  src="/videos/hero/coulisses.mp4"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className={styles.video}
                />

                <div className={styles.phoneOverlay} aria-hidden="true" />

                <button
                  className={styles.muteBtn}
                  onClick={toggleMute}
                  aria-label={isMuted ? "Activer le son" : "Couper le son"}
                >
                  {isMuted ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d={VOLUME_OFF_PATH} />
                      <path d={VOLUME_OFF_ARC} />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <polygon points={VOLUME_ON_POLY} />
                      <path d={VOLUME_ON_ARC1} />
                      <path d={VOLUME_ON_ARC2} />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
