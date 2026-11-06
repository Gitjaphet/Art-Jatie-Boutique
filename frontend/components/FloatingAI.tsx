"use client";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import styles from "./FloatingAI.module.css";
import { chatWithJatie } from "@/lib/api";

type Produit = {
  id: number;
  nom: string;
  prix_ar: number;
  prix_eur: number | null;
  ancien_prix_ar?: number | null;
  image: string;
  url: string;
  disponibilite: string;
};

type Message = { from: "bot" | "user"; text: string; produits?: Produit[]; suggestions?: string[] };

const HISTORIQUE_MAX = 10;
const formatAr = (n: number) => `${n.toLocaleString("fr-FR")} Ar`;

// **gras** → <strong>. Tout le reste reste du texte : aucun HTML n'est injecté (pas de faille XSS).
function enLigne(texte: string): ReactNode[] {
  return texte.split(/(\*\*[^*]+\*\*)/g).map((morceau, i) =>
    morceau.length > 4 && morceau.startsWith("**") && morceau.endsWith("**")
      ? <strong key={i}>{morceau.slice(2, -2)}</strong>
      : morceau
  );
}

// Mise en forme légère des réponses : paragraphes, listes à puces (-, •, *) et gras.
function TexteBot({ texte }: { texte: string }) {
  const blocs: ReactNode[] = [];
  let liste: string[] = [];

  const fermerListe = () => {
    if (!liste.length) return;
    const items = liste;
    blocs.push(
      <ul key={`l${blocs.length}`} className={styles.botListe}>
        {items.map((item, i) => <li key={i}>{enLigne(item)}</li>)}
      </ul>
    );
    liste = [];
  };

  for (const brut of texte.split("\n")) {
    const ligne = brut.trim();
    const puce = ligne.match(/^[-•*]\s+(.*)$/);
    if (puce) {
      liste.push(puce[1]);
      continue;
    }
    fermerListe();
    if (ligne) {
      blocs.push(
        <p key={`p${blocs.length}`} className={styles.botPara}>
          {enLigne(ligne.replace(/^#+\s*/, ""))}
        </p>
      );
    }
  }
  fermerListe();

  return <div className={styles.botText}>{blocs}</div>;
}

function CarteProduit({
  p,
  onOuvrir,
  onCommander,
}: {
  p: Produit;
  onOuvrir: () => void;
  onCommander: (p: Produit) => void;
}) {
  const contenu = (
    <>
      {p.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt={p.nom} className={styles.produitImg} loading="lazy" />
      ) : (
        <div className={styles.produitImg} />
      )}
      <div className={styles.produitInfo}>
        <span className={styles.produitNom}>{p.nom}</span>
        <span className={styles.produitPrix}>
          {formatAr(p.prix_ar)}
          {p.prix_eur !== null && <span className={styles.produitEur}>≈ {p.prix_eur} €</span>}
        </span>
        <span className={styles.produitDispo}>{p.disponibilite}</span>
      </div>
    </>
  );
  const epuise = p.disponibilite.startsWith("Épuisé");
  // Bloc = lien vers la fiche + bouton séparé (jamais de bouton dans un lien)
  return (
    <div className={styles.produitCard}>
      {p.url ? (
        <Link href={p.url} className={styles.produitLien} onClick={onOuvrir}>{contenu}</Link>
      ) : (
        <div className={styles.produitLien}>{contenu}</div>
      )}
      <button
        type="button"
        className={styles.produitCommander}
        onClick={() => onCommander(p)}
        disabled={epuise}
      >
        {epuise ? "Épuisé" : "Commander"}
      </button>
    </div>
  );
}

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: "Bonjour !" }]);
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historiqueCommande, setHistoriqueCommande] = useState<Record<string, unknown> | null>(null);
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

  // Desktop : la molette au-dessus du widget fait défiler la conversation, jamais la page.
  // Un défilement horizontal (Maj + molette, pavé tactile) reste pour le carrousel de cartes.
  useEffect(() => {
    const card = cardRef.current;
    if (!isOpen || !card) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      bodyRef.current?.scrollBy({ top: e.deltaY, behavior: "instant" });
    };
    card.addEventListener("wheel", onWheel, { passive: false });
    return () => card.removeEventListener("wheel", onWheel);
  }, [isOpen]);

  // Toujours afficher le dernier message
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages, isLoading, isOpen]);

  // Sur mobile le widget couvre la page : on le ferme quand la cliente ouvre une fiche produit
  const fermerSurMobile = () => {
    if (window.innerWidth < 501) setIsOpen(false);
  };

  // Un seul chemin d'envoi : saisie, bouton de réponse rapide et bouton « Commander » d'une carte.
  const envoyer = async (texte: string, commander: number | null = null) => {
    const userText = texte.trim();
    if (!userText || isLoading) return;
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: userText }]);
    setIsLoading(true);
    try {
      const formattedHistory = messages.slice(-HISTORIQUE_MAX).map(m => ({
        role: m.from === "bot" ? "assistant" : "user",
        content: m.produits?.length
          ? `${m.text}\n[Produits proposés : ${m.produits.map(p => p.nom).join(" ; ")}]`
          : m.text,
      }));
      const result = await chatWithJatie(userText, clientId, "web", historiqueCommande, formattedHistory, commander);
      setMessages(prev => [...prev, {
        from: "bot",
        text: result.response,
        produits: result.produits ?? [],
        suggestions: result.suggestions ?? [],
      }]);
      setHistoriqueCommande(result.historique_commande ?? null);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Désolée, problème technique 😅" }]);
    } finally {
      setIsLoading(false);
    }
  };
  const send = () => envoyer(input);
  const commander = (p: Produit) => envoyer(`Je souhaite commander « ${p.nom} »`, p.id);

  if (!isOpen) return (
    <>
      <div className={styles.notif}>
        Discutez avec votre assistant IA✨
      </div>
      <button className={styles.trigger} onClick={() => setIsOpen(true)} aria-label="Ouvrir l'assistant IA">
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
        <button onClick={() => setIsOpen(false)} aria-label="Fermer le chat">✕</button>
      </div>
      <div className={styles.body} ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={m.from === "bot" ? styles.botRow : styles.userRow}>
            {m.from === "bot" && <div className={styles.avatarSmall}>J</div>}
            {m.from === "bot" ? (
              <div className={m.produits?.length ? `${styles.bot} ${styles.botLarge}` : styles.bot}>
                <TexteBot texte={m.text} />
                {!!m.produits?.length && (
                  <div className={styles.produits}>
                    {m.produits.map(p => (
                      <CarteProduit key={p.id} p={p} onOuvrir={fermerSurMobile} onCommander={commander} />
                    ))}
                  </div>
                )}
                {/* Réponses rapides : seulement sous le dernier message de Jatie */}
                {i === messages.length - 1 && !isLoading && !!m.suggestions?.length && (
                  <div className={styles.suggestions}>
                    {m.suggestions.map(s => (
                      <button key={s} type="button" className={styles.suggestion} onClick={() => envoyer(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.user}>{m.text}</div>
            )}
            {m.from === "user" && <div className={styles.avatarSmallUser}>C</div>}
          </div>
        ))}
        {isLoading && (
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
        <button onClick={send} aria-label="Envoyer le message">➤</button>
      </div>
    </div>,
    document.body
  );
}
