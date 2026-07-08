"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  signIn: () => void;
  signOut: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  onLoginSuccess: (() => void) | null;
  setOnLoginSuccess: (fn: (() => void) | null) => void;
  triggerLoginFlow: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CLIENT_ID = "949981876915-l1q6btco8j3qkosv1svjvdiivr72lgrc.apps.googleusercontent.com";

const KEY_USER   = "artjatie_user";
const KEY_CHOICE = "artjatie_auth_choice"; // "google" | "guest"

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [onLoginSuccess, setOnLoginSuccess] = useState<(() => void) | null>(null);

  // Ne charge que les données locales au montage — pas de script Google ici
  useEffect(() => {
    const saved = localStorage.getItem(KEY_USER);
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Charge le script Google uniquement à l'ouverture de la modal
  useEffect(() => {
    if (!showLoginModal) return;

    const loadGoogleScript = () =>
      new Promise<void>((resolve) => {
        if ((window as any).google) {
          resolve();
          return;
        }
        const existing = document.getElementById("google-gsi-script");
        if (existing) {
          existing.addEventListener("load", () => resolve());
          return;
        }
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

    let cancelled = false;

    loadGoogleScript().then(() => {
      if (cancelled) return;
      const timer = setTimeout(() => {
        if ((window as any).google) {
          (window as any).google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (response: any) => {
              const payload = JSON.parse(atob(response.credential.split(".")[1]));
              const newUser = { name: payload.name, email: payload.email, picture: payload.picture };
              setUser(newUser);
              localStorage.setItem(KEY_USER, JSON.stringify(newUser));
              localStorage.setItem(KEY_CHOICE, "google");
              setShowLoginModal(false);
              if (onLoginSuccess) {
                onLoginSuccess();
                setOnLoginSuccess(null);
              }
            },
          });
          (window as any).google.accounts.id.renderButton(
            document.getElementById("google-signin-btn"),
            { theme: "outline", size: "large", text: "continue_with", width: 280, locale: "fr" }
          );
        }
      }, 300);
      return () => clearTimeout(timer);
    });

    return () => {
      cancelled = true;
    };
  }, [showLoginModal, onLoginSuccess]);

  // ✅ LA VRAIE FIX : triggerLoginFlow reçoit le callback ET vérifie le choix mémorisé
  const triggerLoginFlow = (callback: () => void) => {
    const choice = localStorage.getItem(KEY_CHOICE);
    if (choice) {
      // Déjà choisi sur ce navigateur → on exécute directement sans modal
      callback();
      return;
    }
    // Premier passage → afficher le modal, stocker le callback
    setOnLoginSuccess(() => callback);
    setShowLoginModal(true);
  };

  const signIn = () => {
    const choice = localStorage.getItem(KEY_CHOICE);
    if (choice) {
      if (onLoginSuccess) {
        onLoginSuccess();
        setOnLoginSuccess(null);
      }
      return;
    }
    setShowLoginModal(true);
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(KEY_CHOICE); // Reset → le modal réapparaîtra
  };

  return (
    <AuthContext.Provider value={{
      user, signIn, signOut,
      showLoginModal, setShowLoginModal,
      onLoginSuccess, setOnLoginSuccess,
      triggerLoginFlow,
    }}>
      {children}
      {showLoginModal && (
        <LoginModal
          onClose={() => {
            setShowLoginModal(false);
            setOnLoginSuccess(null);
          }}
          onGuestContinue={() => {
            localStorage.setItem(KEY_CHOICE, "guest"); // ✅ Mémorise "guest"
            setShowLoginModal(false);
            if (onLoginSuccess) {
              onLoginSuccess();
              setOnLoginSuccess(null);
            }
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

function LoginModal({ onClose, onGuestContinue }: { onClose: () => void; onGuestContinue: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "40px 32px",
        width: "360px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 16,
          background: "none", border: "none", fontSize: 20,
          cursor: "pointer", color: "#999",
        }}>✕</button>

        <img src="/images/logo/art_jatie.png" alt="Art Jatie"
          style={{ height: 60, marginBottom: 16, objectFit: "contain" }} />

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>
          Connexion rapide
        </h2>
        <p style={{ fontSize: 14, color: "#666", margin: "0 0 24px", lineHeight: 1.5 }}>
          Connectez-vous pour remplir automatiquement votre nom et email dans le formulaire.
        </p>

        <div id="google-signin-btn" style={{ display: "flex", justifyContent: "center", marginBottom: 16 }} />

        <button onClick={onGuestContinue} style={{
          background: "none", border: "none", color: "#999",
          fontSize: 13, cursor: "pointer", textDecoration: "underline",
        }}>
          Continuer sans se connecter
        </button>

        <p style={{ marginTop: 20, fontSize: 11, color: "#bbb" }}>
          🔒 Vos données ne sont pas stockées sur nos serveurs
        </p>
      </div>
    </div>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside GoogleAuthProvider");
  return ctx;
}