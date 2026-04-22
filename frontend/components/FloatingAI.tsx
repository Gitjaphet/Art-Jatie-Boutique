"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./FloatingAI.module.css";

// Définition du type pour les messages
type Message = {
  sender: "bot" | "user";
  text: string;
};

// Réponses statiques pour le simulateur (démo)
const MOCK_ANSWERS: { [key: string]: string } = {
  bonjour:
    "Bonjour ! Bienvenue chez Art Jatie. Je suis votre assistant virtuel. ✨ Comment puis-je vous aider ?",
  catalogue:
    "Vous pouvez découvrir toutes nos créations (Sacs, Maillots, Tenues) dans la section Boutique de notre menu.",
  "sur mesure":
    "Absolument ! Nous adorons créer des pièces uniques. Pourriez-vous me décrire votre projet ou la pièce que vous souhaitez ?",
  tarifs:
    "Nos tarifs varient selon la pièce. Par exemple, un sac de notre collection Premium commence à 75.000 Ar.",
  default:
    "Désolé, je ne comprends pas tout à fait. N'hésitez pas à demander 'Catalogue', 'Sur mesure' ou 'Tarifs' pour des infos précises.",
};

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Bonjour ! Je suis l'IA de Art Jatie. ✨ Comment puis-je sublimer votre expérience aujourd'hui ?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll pour voir le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() === "") return;

    // 1. Ajouter le message de l'utilisateur
    const userText = inputValue.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInputValue(""); // Effacer la zone de saisie

    // 2. Simuler une réponse du bot (avec un délai)
    setTimeout(() => {
      const lowerText = userText.toLowerCase();
      let botResponse = MOCK_ANSWERS["default"];

      if (lowerText.includes("bonjour")) botResponse = MOCK_ANSWERS["bonjour"];
      else if (
        lowerText.includes("catalogue") ||
        lowerText.includes("boutique")
      )
        botResponse = MOCK_ANSWERS["catalogue"];
      else if (lowerText.includes("mesure"))
        botResponse = MOCK_ANSWERS["sur mesure"];
      else if (lowerText.includes("tarif") || lowerText.includes("prix"))
        botResponse = MOCK_ANSWERS["tarifs"];

      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    }, 1000);
  };

  return (
    <div className={styles.wrapper}>
      {/* --- Nouvelle Bulle d'accroche (brillante et flottante) --- */}
      <div
        className={`${styles.hintBubble} ${isOpen ? styles.hintHidden : ""}`}
        onClick={() => setIsOpen(true)}
      >
        {/* Icône Noire ✨ (Version SVG Premium) */}
        <svg
          className={styles.hintIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 3L14.59 9.41L21 12L14.59 14.59L12 21L9.41 14.59L3 12L9.41 9.41L12 3Z"></path>
          <path d="M18 16L19 19L22 20L19 21L18 24L17 21L14 20L17 19L18 16Z"></path>
          <path d="M5 4L6 7L9 8L6 9L5 12L4 9L1 8L4 7L5 4Z"></path>
        </svg>

        <span className={styles.hintText}>Discuter avec l&apos;IA</span>
      </div>

      {/* --- Fenêtre de Chat Flottante (Noir & Rose) --- */}
      {isOpen && (
        <div className={styles.chatCard}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.statusDot} />
              <span>Art Jatie AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeBtn}
            >
              ✕
            </button>
          </div>

          <div className={styles.chatBody}>
            <div className={styles.messagesContainer}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${styles[msg.sender]}`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className={styles.footer}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()} // Utilisation de onKeyDown pour Enter
              placeholder="Posez votre question..."
              className={styles.inputArea}
            />
            <button onClick={handleSend} className={styles.sendBtn}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2Z"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* --- Bouton d'activation flottant (Noir Chic) --- */}
      <button
        className={`${styles.trigger} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Discuter avec l'IA"
      >
        {isOpen ? (
          // Icône Croix quand ouvert
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          // Icône Chatbot quand fermé (SVG)
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}
