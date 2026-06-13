"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./FloatingAI.module.css";
import { chatWithJatie } from "@/lib/api";
import { useCartStore } from "@/lib/cart";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductCard = {
  id: number;
  name: string;
  price_ar: number;
  image: string;
  colors: string;
  sizes: string;
  stock: string;
  category: string;
  sales_count?: number;
  description?: string;
};

type ChatStep =
  | "chat"           // conversation normale
  | "confirm_item"   // pop-up confirmation "Voulez-vous prendre X ?"
  | "ask_more"       // "Vous voulez autre chose ?"
  | "ask_name"       // collecte nom
  | "ask_whatsapp"   // collecte WhatsApp
  | "ask_location"   // collecte lieu de livraison
  | "ask_payment"    // choix paiement
  | "done";          // résumé final

type CartItem = {
  product: ProductCard;
  quantity: number;
};

type Message = {
  sender: "bot" | "user";
  text?: string;
  products?: ProductCard[];      // affichage Messenger (1 par message)
  singleProduct?: ProductCard;   // une seule carte dans le flow
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("jatie_client_id");
  if (!id) {
    id = "visitor_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    localStorage.setItem("jatie_client_id", id);
  }
  return id;
}

function salesComment(p: ProductCard, index: number): string {
  const count = p.sales_count ?? 0;
  const stockLabel = p.stock === "En stock" ? "disponible" : "sur commande";
  const sizes = p.sizes ? `Taille ${p.sizes}` : "";
  const colors = p.colors ? `· ${p.colors}` : "";

  if (count > 5 || index === 0) {
    return `Notre pièce la plus appréciée ✨ ${p.name} illumine chaque silhouette. ${stockLabel} — seulement ${p.price_ar.toLocaleString("fr-FR")} Ar. ${sizes} ${colors}`.trim();
  }
  if (index === 1) {
    return `Un vrai coup de cœur 😍 ${p.name} — élégante et abordable à ${p.price_ar.toLocaleString("fr-FR")} Ar. ${sizes} ${colors}`.trim();
  }
  return `${p.name} — ${stockLabel} à ${p.price_ar.toLocaleString("fr-FR")} Ar. ${sizes} ${colors}`.trim();
}

// ─── Composant carte produit style Messenger ──────────────────────────────────

function MessengerProductCard({
  product,
  index,
  onJP,
  onZoom,
}: {
  product: ProductCard;
  index: number;
  onJP: (p: ProductCard) => void;
  onZoom: (p: ProductCard) => void;
}) {
  const isStock = product.stock === "En stock";
  return (
    <div className={styles.messengerCard}>
      {/* Image cliquable pour zoom */}
      <div className={styles.messengerImageWrap} onClick={() => onZoom(product)}>
        <img
          src={product.image}
          alt={product.name}
          className={styles.messengerImage}
        />
        <div className={styles.messengerZoomHint}>🔍 Voir en grand</div>
        <span className={`${styles.stockBadge} ${isStock ? styles.stockBadgeGreen : styles.stockBadgeGray}`}>
          {isStock ? "✓ En stock" : "Sur commande"}
        </span>
      </div>

      {/* Texte commercial */}
      <p className={styles.messengerComment}>{salesComment(product, index)}</p>

      {/* Prix + bouton JP */}
      <div className={styles.messengerFooter}>
        <span className={styles.messengerPrice}>
          {product.price_ar.toLocaleString("fr-FR")} Ar
        </span>
        <button
          className={styles.jpBtn}
          onClick={() => onJP(product)}
        >
          🛒 Je Prends
        </button>
      </div>
    </div>
  );
}

// ─── Pop-up confirmation ───────────────────────────────────────────────────────

function ConfirmPopup({
  product,
  onOk,
  onCancel,
}: {
  product: ProductCard;
  onOk: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popup}>
        <img src={product.image} alt={product.name} className={styles.popupImg} />
        <p className={styles.popupTitle}>Ajouter au panier ?</p>
        <p className={styles.popupName}>{product.name}</p>
        <p className={styles.popupPrice}>{product.price_ar.toLocaleString("fr-FR")} Ar</p>
        <div className={styles.popupBtns}>
          <button className={styles.popupOk} onClick={onOk}>✓ Oui, je prends</button>
          <button className={styles.popupCancel} onClick={onCancel}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pop-up zoom image — PLEIN ÉCRAN via portal ────────────────────────────────

function ZoomPopup({ product, onClose }: { product: ProductCard; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className={styles.zoomOverlay} onClick={onClose}>
      <div className={styles.zoomPopup} onClick={(e) => e.stopPropagation()}>
        <img src={product.image} alt={product.name} className={styles.zoomImg} />
        <p className={styles.zoomName}>{product.name}</p>
        <p className={styles.zoomPrice}>{product.price_ar.toLocaleString("fr-FR")} Ar</p>
        <button className={styles.zoomClose} onClick={onClose}>✕ Fermer</button>
      </div>
    </div>,
    document.body
  );
}

// ─── FloatingAI principal ──────────────────────────────────────────────────────

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clientId] = useState<string>(() => getClientId());

  // État du flow commande dans le chat
  const [step, setStep] = useState<ChatStep>("chat");
  const [pendingProduct, setPendingProduct] = useState<ProductCard | null>(null);
  const [zoomedProduct, setZoomedProduct] = useState<ProductCard | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderName, setOrderName] = useState("");
  const [orderWhatsapp, setOrderWhatsapp] = useState("");
  const [orderLocation, setOrderLocation] = useState("");

  // Cart store Zustand (pour sync avec le vrai panier)
  const { addItem } = useCartStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Bonjour ! Je suis Jatie, votre assistante Art Jatie ✨ Que puis-je faire pour vous aujourd'hui ?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step]);


  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute("data-chat-open", "true");
      // Empêche le scroll du body derrière le chat sur mobile
      document.body.style.overflow = "hidden";
    } else {
      document.body.removeAttribute("data-chat-open");
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // ── Envoi message normal ────────────────────────────────────────────────────

  const addBotMessage = (text: string, products?: ProductCard[]) => {
    setMessages((prev) => [...prev, { sender: "bot", text, products }]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
  };

  const handleSend = async () => {
    if (inputValue.trim() === "" || isLoading) return;

    // Gestion des étapes de collecte d'infos commande
    if (step === "ask_name") {
      const name = inputValue.trim();
      setOrderName(name);
      addUserMessage(name);
      setInputValue("");
      setStep("ask_whatsapp");
      setTimeout(() => addBotMessage("Votre numéro WhatsApp ? 📱"), 300);
      return;
    }
    if (step === "ask_whatsapp") {
      const wa = inputValue.trim();
      setOrderWhatsapp(wa);
      addUserMessage(wa);
      setInputValue("");
      setStep("ask_location");
      setTimeout(() => addBotMessage("Votre lieu de livraison ? (ville / quartier) 📍"), 300);
      return;
    }
    if (step === "ask_location") {
      const loc = inputValue.trim();
      setOrderLocation(loc);
      addUserMessage(loc);
      setInputValue("");
      setStep("ask_payment");
      setTimeout(() =>
        addBotMessage(
          "Mode de paiement :\n1️⃣ MVola — 034 30 513 60 (Noeline)\n2️⃣ Orange Money\n3️⃣ Paiement à la livraison (WhatsApp)\n\nRépondez 1, 2 ou 3 😊"
        ),
        300
      );
      return;
    }
    if (step === "ask_payment") {
      const choice = inputValue.trim();
      addUserMessage(choice);
      setInputValue("");
      const payLabels: Record<string, string> = {
        "1": "MVola",
        "2": "Orange Money",
        "3": "Paiement à la livraison",
      };
      const payLabel = payLabels[choice] || choice;
      const total = cart.reduce((s, i) => s + i.product.price_ar * i.quantity, 0);
      const itemsList = cart
        .map((i) => `• ${i.product.name} × ${i.quantity} — ${i.product.price_ar.toLocaleString("fr-FR")} Ar`)
        .join("\n");

      setStep("done");
      setTimeout(() =>
        addBotMessage(
          `🎉 Super ${orderName} ! Voici votre récapitulatif :\n\n${itemsList}\n\n💰 Total : ${total.toLocaleString("fr-FR")} Ar\n📍 Livraison : ${orderLocation}\n📱 WhatsApp : ${orderWhatsapp}\n💳 Paiement : ${payLabel}\n\nNous vous contacterons très bientôt sur WhatsApp pour confirmer ! Merci de votre confiance ✨`
        ),
        400
      );
      return;
    }

    // Conversation normale avec l'IA
    const userText = inputValue.trim();
    setInputValue("");
    addUserMessage(userText);
    setIsLoading(true);

    try {
      const result = await chatWithJatie(userText, clientId, "web");

      // Si l'IA renvoie des produits → affichage Messenger (1 message par produit)
      if (result.products && result.products.length > 0) {
        // Message intro de Jatie
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: result.response },
        ]);
        // Ensuite 1 carte par produit (avec délai style Messenger)
        result.products.forEach((p: ProductCard, i: number) => {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { sender: "bot", singleProduct: p },
            ]);
          }, (i + 1) * 400);
        });
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: result.response },
        ]);
      }
    } catch {
      addBotMessage(
        "Désolée, petit problème technique 😅 Réessayez ou contactez-nous sur WhatsApp !"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Clic "Je Prends" ────────────────────────────────────────────────────────

  const handleJP = (product: ProductCard) => {
    setPendingProduct(product);
    setStep("confirm_item");
  };

  const handleConfirmOk = () => {
    if (!pendingProduct) return;

    // Ajouter au Zustand cart store (sync avec /panier)
    addItem({
      id: pendingProduct.id,
      name: pendingProduct.name,
      price: pendingProduct.price_ar,
      image: pendingProduct.image,
      quantity: 1,
      category: pendingProduct.category,
    });

    // Ajouter au cart local du chat
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === pendingProduct.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === pendingProduct.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product: pendingProduct, quantity: 1 }];
    });

    setPendingProduct(null);
    setStep("ask_more");

    // Message bot
    const total =
      [...cart, { product: pendingProduct, quantity: 1 }].reduce(
        (s, i) => s + i.product.price_ar * i.quantity,
        0
      );
    setTimeout(() =>
      addBotMessage(
        `✅ "${pendingProduct.name}" ajouté au panier !\n\nTotal actuel : ${total.toLocaleString("fr-FR")} Ar 🛍\n\nVous souhaitez :\n👉 Continuer vos achats — dites-moi ce que vous cherchez\n👉 Finaliser ma commande — tapez "commander"`
      ),
      300
    );
  };

  const handleConfirmCancel = () => {
    setPendingProduct(null);
    setStep("chat");
    setTimeout(() =>
      addBotMessage("Pas de souci 😊 Vous voulez voir autre chose ?"),
      200
    );
  };

  // Détecte "commander" dans le chat pour lancer le flow checkout
  const handleSendWrapped = async () => {
    if (
      step === "ask_more" &&
      inputValue.trim().toLowerCase().includes("commander")
    ) {
      addUserMessage(inputValue.trim());
      setInputValue("");
      if (cart.length === 0) {
        setTimeout(() =>
          addBotMessage("Votre panier est vide 😊 Dites-moi ce qui vous intéresse !"),
          200
        );
        setStep("chat");
        return;
      }
      setStep("ask_name");
      setTimeout(() =>
        addBotMessage("Super ! Pour finaliser, votre nom complet SVP 😊"),
        300
      );
      return;
    }
    // Retour au chat normal si l'utilisateur ne veut pas commander
    if (step === "ask_more") {
      setStep("chat");
    }
    await handleSend();
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>
      {/* Bulle d'accroche */}
      <div
        className={`${styles.hintBubble} ${isOpen ? styles.hintHidden : ""}`}
        onClick={() => setIsOpen(true)}
      >
        <svg className={styles.hintIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 3L14.59 9.41L21 12L14.59 14.59L12 21L9.41 14.59L3 12L9.41 9.41L12 3Z" />
          <path d="M18 16L19 19L22 20L19 21L18 24L17 21L14 20L17 19L18 16Z" />
          <path d="M5 4L6 7L9 8L6 9L5 12L4 9L1 8L4 7L5 4Z" />
        </svg>
        <span className={styles.hintText}>Discuter avec Jatie</span>
      </div>

      {/* Pop-up confirmation JP */}
      {step === "confirm_item" && pendingProduct && (
        <ConfirmPopup
          product={pendingProduct}
          onOk={handleConfirmOk}
          onCancel={handleConfirmCancel}
        />
      )}

      {/* Pop-up zoom image */}
      {zoomedProduct && (
        <ZoomPopup product={zoomedProduct} onClose={() => setZoomedProduct(null)} />
      )}

      {/* Fenêtre de chat */}
      {/* Fenêtre de chat — via portal pour éviter le stacking context du wrapper */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div className={styles.chatCard}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.statusDot} />
              <span>Jatie — Art Jatie AI</span>
            </div>
            {cart.length > 0 && (
              <span className={styles.cartBadge}>🛒 {cart.length}</span>
            )}
            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>✕</button>
          </div>

          <div className={styles.chatBody}>
            <div className={styles.messagesContainer}>
              {messages.map((msg, index) => (
                <div key={index}>
                  {msg.text && (
                    <div className={`${styles.message} ${styles[msg.sender]}`}>
                      <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
                    </div>
                  )}
                  {msg.singleProduct && (
                    <MessengerProductCard
                      product={msg.singleProduct}
                      index={index}
                      onJP={handleJP}
                      onZoom={setZoomedProduct}
                    />
                  )}
                  {msg.products && msg.products.length > 0 && (
                    <div className={styles.productCards}>
                      {msg.products.map((p) => (
                        <MessengerProductCard
                          key={p.id}
                          product={p}
                          index={0}
                          onJP={handleJP}
                          onZoom={setZoomedProduct}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className={`${styles.message} ${styles.bot}`}>
                  <p className={styles.typing}>Jatie écrit…</p>
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
              onKeyDown={(e) => e.key === "Enter" && handleSendWrapped()}
              placeholder={
                step === "ask_name" ? "Votre nom…" :
                step === "ask_whatsapp" ? "Votre numéro WhatsApp…" :
                step === "ask_location" ? "Votre ville / quartier…" :
                step === "ask_payment" ? "1, 2 ou 3…" :
                "Posez votre question…"
              }
              className={styles.inputArea}
              disabled={isLoading || step === "confirm_item"}
            />
            <button
              onClick={handleSendWrapped}
              className={styles.sendBtn}
              disabled={isLoading || step === "confirm_item"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Bouton flottant */}
      <button
        className={`${styles.trigger} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Discuter avec Jatie"
      >
        {isOpen ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}