"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./FloatingAI.module.css";
import { chatWithJatie } from "@/lib/api";

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ from: "bot", text: "Bonjour !" }]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historiqueCommande, setHistoriqueCommande] = useState<Record<string, any> | null>(null);
  const [clientId] = useState(() => {
    if (typeof window === "undefined") return "anonymous";
    let id = localStorage.getItem("jatie_client_id");
    if (!id) { id = "visitor_" + Date.now(); localStorage.setItem("jatie_client_id", id); }
    return id;
  });

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      return;
    }

    // Bloquer le scroll arrière-plan — mobile seulement
    if (window.innerWidth < 501) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    }

    // visualViewport pour iOS clavier
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      if (!cardRef.current) return;
      if (window.innerWidth >= 501) return;
      cardRef.current.style.height = `${vv.height}px`;
      cardRef.current.style.top = `${vv.offsetTop}px`;
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      // Cleanup — toujours remettre les styles quand on ferme
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: userText }]);
    setIsLoading(true);
    try {
      const formattedHistory = messages.map(m => ({
        role: m.from === "bot" ? "assistant" : "user",
        content: m.text,
      }));
      const result = await chatWithJatie(userText, clientId, "web", historiqueCommande, formattedHistory);
      setMessages(prev => [...prev, { from: "bot", text: result.response }]);
      setHistoriqueCommande(result.historique_commande ?? null);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Désolée, problème technique 😅" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return (
    <>
      <div className={styles.notif}>
        Discutez avec votre assistant IA✨
      </div>
      <button className={styles.trigger} onClick={() => setIsOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </>
  );

  return createPortal(
    <div className={styles.card} ref={cardRef}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.avatar}>J</div>
          <div>
            <div className={styles.headerName}>Jatie ✨</div>
            <div className={styles.headerStatus}>● En ligne</div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)}>✕</button>
      </div>
      <div className={styles.body}>
        {messages.map((m, i) => (
          <div key={i} className={m.from === "bot" ? styles.botRow : styles.userRow}>
            {m.from === "bot" && <div className={styles.avatarSmall}>J</div>}
            <div className={m.from === "bot" ? styles.bot : styles.user}>
              {m.from === "bot" ? (
                <span dangerouslySetInnerHTML={{ __html: m.text.replace(
                  / (https?:\/\/\S+)/g,
                  '<img src="$1" alt="produit" style="width:100%;border-radius:8px;margin-top:6px;" />'
                )}} />
              ) : m.text}
            </div>
            {m.from === "user" && <div className={styles.avatarSmallUser}>C</div>}
          </div>
        ))}
        {isLoading && (   // ← ICI
          <div className={styles.botRow}>
            <div className={styles.avatarSmall}>J</div>
            <div className={styles.bot}>
              <span className={styles.typing}>Jatie écrit…</span>
            </div>
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Écrire…" disabled={isLoading} />
        <button onClick={send}>➤</button>
      </div>
    </div>,
    document.body
  );
}