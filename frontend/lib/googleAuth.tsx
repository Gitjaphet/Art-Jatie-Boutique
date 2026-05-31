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
}

const AuthContext = createContext<AuthContextType | null>(null);

const CLIENT_ID = "949981876915-l1q6btco8j3qkosv1svjvdiivr72lgrc.apps.googleusercontent.com";

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [onLoginSuccess, setOnLoginSuccess] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Charger le script Google
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.head.appendChild(script);

    // Restaurer session depuis localStorage
    const saved = localStorage.getItem("artjatie_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!showLoginModal) return;
    // Initialiser Google One Tap quand le modal s'ouvre
    const timer = setTimeout(() => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response: any) => {
            // Décoder le JWT Google
            const payload = JSON.parse(atob(response.credential.split(".")[1]));
            const newUser = {
              name: payload.name,
              email: payload.email,
              picture: payload.picture,
            };
            setUser(newUser);
            localStorage.setItem("artjatie_user", JSON.stringify(newUser));
            setShowLoginModal(false);
            // Déclencher l'action qui attendait la connexion
            if (onLoginSuccess) {
              onLoginSuccess();
              setOnLoginSuccess(null);
            }
          },
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { 
            theme: "outline", 
            size: "large", 
            text: "continue_with",
            width: 280,
            locale: "fr"
          }
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [showLoginModal, onLoginSuccess]);

  const signIn = () => setShowLoginModal(true);

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("artjatie_user");
  };

  return (
    <AuthContext.Provider value={{ 
      user, signIn, signOut, 
      showLoginModal, setShowLoginModal,
      onLoginSuccess, setOnLoginSuccess 
    }}>
      {children}
      {showLoginModal && (
        <LoginModal 
          // 1. Action si on clique sur la Croix (On annule tout)
          onClose={() => {
            setShowLoginModal(false);
            setOnLoginSuccess(null); // On vide l'action en attente
          }} 
          // 2. Action si on clique sur "Continuer sans se connecter" (On continue l'action)
          onGuestContinue={() => {
            setShowLoginModal(false);
            if (onLoginSuccess) {
              onLoginSuccess(); // Ajoute au panier ou ouvre la modale sur-mesure !
              setOnLoginSuccess(null);
            }
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

function LoginModal({ onClose, onGuestContinue }: { onClose: () => void, onGuestContinue: () => void }) {
  return (
    <div 
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "40px 32px",
        width: "360px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        position: "relative"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 16,
          background: "none", border: "none", fontSize: 20,
          cursor: "pointer", color: "#999"
        }}>✕</button>

        {/* Logo Art Jatie */}
        <img src="/images/logo/art_jatie.png" alt="Art Jatie" 
          style={{ height: 60, marginBottom: 16, objectFit: "contain" }} />

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>
          Connexion rapide
        </h2>
        <p style={{ fontSize: 14, color: "#666", margin: "0 0 24px", lineHeight: 1.5 }}>
          Connectez-vous pour remplir automatiquement votre nom et email dans le formulaire.
        </p>

        {/* Bouton Google injecté ici */}
        <div id="google-signin-btn" style={{ display: "flex", justifyContent: "center", marginBottom: 16 }} />

        {/* ✅ LE BOUTON MAGIQUE QUI RÉSOUT LE PROBLÈME */}
        <button onClick={onGuestContinue} style={{
          background: "none", border: "none", color: "#999",
          fontSize: 13, cursor: "pointer", textDecoration: "underline"
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