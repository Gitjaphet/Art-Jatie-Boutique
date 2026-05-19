"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./FloatingAI.module.css";
import { chatWithJatie } from "@/lib/api";


type ProductCard = {
  id: number;
  name: string;
  price_ar: number;
  image: string;
  colors: string;
  sizes: string;
  stock: string;
  category: string;
};

type Message = {
  sender: "bot" | "user";
  text: string;
  products?: ProductCard[];
};


// Identifiant unique par visiteur (persisté dans localStorage)
function getClientId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("jatie_client_id");
  if (!id) {
    id = "visitor_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    localStorage.setItem("jatie_client_id", id);
  }
  return id;
}

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clientId] = useState<string>(() => getClientId());
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Bonjour ! Je suis Jatie, votre assistante Art Jatie ✨ Comment puis-je vous aider aujourd'hui ?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (inputValue.trim() === "" || isLoading) return;

    const userText = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsLoading(true);

    try {
      const result = await chatWithJatie(userText, clientId, "web");
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: result.response,
        products: result.products,
      }]);

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Désolée, je rencontre un petit problème. Réessayez ou contactez-nous sur WhatsApp 😊",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Bulle d'accroche */}
      <div
        className={`${styles.hintBubble} ${isOpen ? styles.hintHidden : ""}`}
        onClick={() => setIsOpen(true)}
      >
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
        <span className={styles.hintText}>Discuter avec Jatie</span>
      </div>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className={styles.chatCard}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.statusDot} />
              <span>Jatie — Art Jatie AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
              ✕
            </button>
          </div>

          <div className={styles.chatBody}>
            <div className={styles.messagesContainer}>
              {messages.map((msg, index) => (
                <div key={index}>
                  <div className={`${styles.message} ${styles[msg.sender]}`}>
                    <p>{msg.text}</p>
                  </div>
                  {msg.products && msg.products.length > 0 && (
                    <div className={styles.productCards}>
                      {msg.products.map((p) => (
                        <div key={p.id} className={styles.productCard}>
                          <img src={p.image} alt={p.name} className={styles.productImage} />
                          <div className={styles.productInfo}>
                            <p className={styles.productName}>{p.name}</p>
                            <p className={styles.productPrice}>
                              {p.price_ar.toLocaleString("fr-FR")} Ar
                            </p>
                            <p className={styles.productStock}>{p.stock}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Indicateur de frappe */}
              {isLoading && (
                <div className={`${styles.message} ${styles.bot}`}>
                  <p className={styles.typing}>Jatie écrit...</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className={styles.footer}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Posez votre question..."
              className={styles.inputArea}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              className={styles.sendBtn}
              disabled={isLoading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2Z"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        className={`${styles.trigger} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Discuter avec Jatie"
      >
        {isOpen ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}