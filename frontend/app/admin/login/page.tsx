"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!res.ok) throw new Error("Identifiants incorrects");

      const data = await res.json();
      localStorage.setItem("admin_token", data.access_token);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Animated background elements */}
      <div className={styles.bg}>
        <div className={styles.bgGradient} />
        <div className={styles.bgNoise} />

        {/* Decorative crochet-inspired SVG patterns */}
        <svg
          className={`${styles.floatShape} ${styles.shape1}`}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="60"
            cy="60"
            r="55"
            stroke="rgba(190,24,93,0.18)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <circle
            cx="60"
            cy="60"
            r="38"
            stroke="rgba(190,24,93,0.12)"
            strokeWidth="1"
            strokeDasharray="3 6"
          />
          <circle
            cx="60"
            cy="60"
            r="20"
            stroke="rgba(190,24,93,0.1)"
            strokeWidth="1"
          />
          <circle cx="60" cy="60" r="5" fill="rgba(190,24,93,0.2)" />
        </svg>

        <svg
          className={`${styles.floatShape} ${styles.shape2}`}
          viewBox="0 0 80 80"
          fill="none"
        >
          <path
            d="M40 4 L76 40 L40 76 L4 40 Z"
            stroke="rgba(190,24,93,0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <path
            d="M40 18 L62 40 L40 62 L18 40 Z"
            stroke="rgba(190,24,93,0.1)"
            strokeWidth="1"
          />
          <circle
            cx="40"
            cy="40"
            r="6"
            stroke="rgba(190,24,93,0.2)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>

        <svg
          className={`${styles.floatShape} ${styles.shape3}`}
          viewBox="0 0 100 100"
          fill="none"
        >
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={50 + 45 * Math.cos((i * Math.PI) / 4)}
              y2={50 + 45 * Math.sin((i * Math.PI) / 4)}
              stroke="rgba(190,24,93,0.12)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          ))}
          <circle
            cx="50"
            cy="50"
            r="10"
            stroke="rgba(190,24,93,0.18)"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="50" cy="50" r="3" fill="rgba(190,24,93,0.25)" />
        </svg>

        <svg
          className={`${styles.floatShape} ${styles.shape4}`}
          viewBox="0 0 60 120"
          fill="none"
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse
              key={i}
              cx="30"
              cy={10 + i * 20}
              rx="20"
              ry="8"
              stroke="rgba(190,24,93,0.13)"
              strokeWidth="1.2"
              fill="none"
              strokeDasharray={i % 2 === 0 ? "5 3" : "2 4"}
            />
          ))}
        </svg>

        <svg
          className={`${styles.floatShape} ${styles.shape5}`}
          viewBox="0 0 90 90"
          fill="none"
        >
          <path
            d="M45 5 C70 5 85 20 85 45 C85 70 70 85 45 85 C20 85 5 70 5 45 C5 20 20 5 45 5Z"
            stroke="rgba(190,24,93,0.14)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="8 4"
          />
          <path
            d="M45 20 C60 20 70 30 70 45 C70 60 60 70 45 70 C30 70 20 60 20 45 C20 30 30 20 45 20Z"
            stroke="rgba(190,24,93,0.09)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Thin horizontal decorative lines */}
        <div className={styles.lineTop} />
        <div className={styles.lineBottom} />
      </div>

      {/* Watermark text */}
      <div className={styles.watermark}>Art Jatie</div>

      {/* Login Card */}
      <div className={styles.card}>
        <div className={styles.cardInner}>
          {/* Top accent bar */}
          <div className={styles.accentBar} />

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.logoWrap}>
              <Image
                src="/images/logo/art_jatie.png"
                alt="Art Jatie"
                width={150}
                height={52}
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <div className={styles.headerDivider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerDot} />
              <span className={styles.dividerLine} />
            </div>
            <p className={styles.subtitle}>Espace Administration</p>
            <p className={styles.subtitleNote}>
              Accès réservé aux administrateurs
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorBox}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Adresse Email
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="admin@artjatie.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Mot de passe
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.cardFooter}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Connexion chiffrée et sécurisée
          </div>

          {/* Bottom accent bar */}
          <div className={styles.accentBarBottom} />
        </div>
      </div>
    </div>
  );
}
