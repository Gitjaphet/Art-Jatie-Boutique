"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./FloatingAI.module.css";

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ from: "bot", text: "Bonjour !" }]);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { from: "user", text: input }, { from: "bot", text: "Bonjour !" }]);
    setInput("");
  };

  if (!isOpen) return <button className={styles.trigger} onClick={() => setIsOpen(true)}>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
</button>

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
            <div className={m.from === "bot" ? styles.bot : styles.user}>{m.text}</div>
            {m.from === "user" && <div className={styles.avatarSmallUser}>C</div>}
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Écrire…" />
        <button onClick={send}>➤</button>
      </div>
    </div>,
    document.body
  );
}