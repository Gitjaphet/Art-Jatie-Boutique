"use client";

import Link from "next/link";
import { useState } from "react";
import s from "./PageLivraison.module.css";

// ─── SVG Icon components ──────────────────────────────────────────────────

const IconTruck = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 4v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconPackage = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const IconRefresh = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-3.36" />
  </svg>
);

const IconShield = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconMapPin = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconMail = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconPhone = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.28 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.13 6.13l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconClock = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconWhatsapp = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a10.45 10.45 0 0 1-5.302-1.44l-.381-.224-3.948 1.036 1.054-3.844-.248-.394A10.443 10.443 0 0 1 1.6 11.986C1.6 6.259 6.259 1.6 11.986 1.6a10.34 10.34 0 0 1 7.353 3.046 10.34 10.34 0 0 1 3.046 7.353c-.003 5.728-4.662 10.386-10.334 10.386zm8.813-19.2A12.003 12.003 0 0 0 12.051 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.885 2.59z" />
  </svg>
);

const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconChevron = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconArrowRight = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconRuler = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.3 15.89L15.89 21.3a2 2 0 0 1-2.83 0L2.7 10.94a2 2 0 0 1 0-2.83L8.11 2.7a2 2 0 0 1 2.83 0L21.3 13.06a2 2 0 0 1 0 2.83z" />
    <line x1="7.49" y1="7.49" x2="9.27" y2="9.27" />
    <line x1="10.61" y1="10.61" x2="12.39" y2="12.39" />
    <line x1="13.73" y1="13.73" x2="15.51" y2="15.51" />
  </svg>
);

const IconHelpCircle = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────

type Zone = {
  icon: React.ReactNode;
  name: string;
  sub: string;
  price: "free" | "devis" | string;
  delay: string;
};

const zones: Zone[] = [
  {
    icon: <IconMapPin size={14} />,
    name: "Nosy Be — En ville",
    sub: "Jabala et ses alentours immédiats",
    price: "free",
    delay: "Demi-journée",
  },
  {
    icon: <IconMapPin size={14} />,
    name: "Nosy Be — Darsalam",
    sub: "À partir de 1 km de Jabala",
    price: "5 000 Ar",
    delay: "Demi-journée",
  },
  {
    icon: <IconMapPin size={14} />,
    name: "Nosy Be — Dzamanjar",
    sub: "À partir de 1 km de Jabala",
    price: "7 000 Ar",
    delay: "Demi-journée",
  },
  {
    icon: <IconMapPin size={14} />,
    name: "Autre zone Nosy Be",
    sub: "Tarif sur devis — 032 022 5170",
    price: "devis",
    delay: "À confirmer",
  },
  {
    icon: <IconTruck size={14} />,
    name: "Madagascar (Tana & autres villes)",
    sub: "Via Service Rapide, Besady, Cotisse…",
    price: "devis",
    delay: "3 – 7 jours ouvrés",
  },
  {
    icon: <IconPackage size={14} />,
    name: "International",
    sub: "Europe, Réunion, Mayotte et au-delà",
    price: "devis",
    delay: "7 jours – 3 mois selon le mode de transport",
  },
];

type AccItem = {
  question: string;
  answer: React.ReactNode;
};

const faqItems: AccItem[] = [
  {
    question: "Quels articles peuvent être retournés ?",
    answer: (
      <>
        <p className={s.accText}>
          Nous acceptons les retours sous <strong> 2 jours </strong> après
          réception, à condition que l&rsquo;article soit en état d'origine:
        </p>
        <ul className={s.accList}>
          <li>Non porté et non lavé</li>
          <li>Dans son emballage d&rsquo;origine ou similaire</li>
          <li>Sans dommage lié à une mauvaise utilisation</li>
        </ul>
      </>
    ),
  },
  {
    question: "Comment initier un retour ?",
    answer: (
      <p className={s.accText}>
        Contactez-nous via WhatsApp au <strong>032 022 5170</strong> ou par
        email à <strong>contact@artjatie.mg</strong> avec votre numéro de
        commande et la raison du retour. Nous vous confirmons la procédure sous
        24 h.
      </p>
    ),
  },
  {
    question: "Les créations sur mesure sont-elles remboursables ?",
    answer: (
      <p className={s.accText}>
        Pour les pièces <strong>sur mesure</strong> ou sur commande, une avance est requise pour lancer la fabrication. En cas d'annulation ou de changement d'avis de votre part, <strong>seulement 50% de votre acompte</strong> vous sera remboursé (les 50% restants couvrant les frais de fabrication engagés). Bien entendu, en cas de défaut de fabrication avéré, nous faisons systématiquement le nécessaire pour trouver une solution satisfaisante.
      </p>
    ),
  },
  {
    question: "Quel est le délai de remboursement ?",
    answer: (
      <p className={s.accText}>
        Après vérification de l&rsquo;article retourné, le remboursement ou
        l&rsquo;échange est traité sous <strong>3 à 5 jours ouvrés</strong> via
        le moyen de paiement utilisé à l&rsquo;achat (MVola, Orange Money).
      </p>
    ),
  },
  
];

// ─── Component ────────────────────────────────────────────────────────────

export default function PageLivraison() {
  const [openAcc, setOpenAcc] = useState<number | null>(0);

  const toggleAcc = (i: number) => setOpenAcc((prev) => (prev === i ? null : i));

  return (
    <div className={s.wrap}>

      {/* ── BREADCRUMB ───────────────────────────────────────────────────── */}
      <nav className={`${s.breadcrumb} ${s.fadeUp} ${s.d1}`} aria-label="Fil d'Ariane">
        <Link href="/">Accueil</Link>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        <span>Aide &amp; Infos</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        <span>Livraison &amp; Retours</span>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <header className={s.hero}>
        <div className={`${s.fadeUp} ${s.d2}`}>
          <div className={s.heroEyebrow}>Aide &amp; Informations</div>
          <h1 className={s.heroTitle}>
            Livraison <em>&amp;</em>
            <br />
            Retours
          </h1>
          <p className={s.heroSub}>
            Chaque création Art Jatie est préparée avec soin depuis notre
            atelier de Seganinga, Nosy Be. Voici tout ce que vous devez savoir
            sur l&rsquo;expédition et notre politique de retours.
          </p>
        </div>

        <div className={`${s.heroMeta} ${s.fadeUp} ${s.d3}`}>
          <div className={s.heroMetaItem}>
            <div className={`${s.heroMetaIcon} ${s.iconReveal}`} style={{ animationDelay: "0.35s" }}>
              <IconTruck size={20} />
            </div>
            <div className={s.heroMetaText}>
              <strong>Livraison locale</strong>
              <span>Gratuite à Nosy Be en ville</span>
            </div>
          </div>
          <div className={s.heroMetaItem}>
            <div className={`${s.heroMetaIcon} ${s.iconReveal}`} style={{ animationDelay: "0.45s" }}>
              <IconRefresh size={20} />
            </div>
            <div className={s.heroMetaText}>
              <strong>Retours sous 2 jours</strong>
              <span>Article avec défaut d'origine uniquement</span>
            </div>
          </div>
          <div className={s.heroMetaItem}>
            <div className={`${s.heroMetaIcon} ${s.iconReveal}`} style={{ animationDelay: "0.55s" }}>
              <IconShield size={20} />
            </div>
            <div className={s.heroMetaText}>
              <strong>Commande sécurisée</strong>
              <span>MVola · Orange Money</span>
            </div>
          </div>
        </div>
      </header>

      <div className={s.divider} />

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className={s.body}>
        <main>

          {/* ── ZONES ──────────────────────────────────────────────────── */}
          <section className={`${s.section} ${s.fadeUp} ${s.d3}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>01</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Zones &amp; Tarifs</span>
            </div>
            <h2 className={s.sectionTitle}>
              Zones de <em>livraison</em>
            </h2>
            <p className={s.sectionLead}>
              Nous livrons depuis notre atelier de Seganinga vers toute
              Madagascar et au-delà. Les délais sont estimatifs et peuvent
              varier selon la coopérative choisie.
            </p>

            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead className={s.tableThead}>
                  <tr>
                    <th>Destination</th>
                    <th>Frais</th>
                    <th>Délai estimé</th>
                  </tr>
                </thead>
                <tbody className={s.tableTbody}>
                  {zones.map((z, i) => (
                    <tr key={i}>
                      <td className={s.tableCell}>
                        <div className={s.zoneName}>
                          <div className={s.zoneNameIcon}>{z.icon}</div>
                          <div>
                            {z.name}
                            <div className={s.zoneSub}>{z.sub}</div>
                          </div>
                        </div>
                      </td>
                      <td className={s.tableCell}>
                        {z.price === "free" && (
                          <span className={s.tagFree}>
                            <IconCheck size={12} />
                            Gratuite
                          </span>
                        )}
                        {z.price === "devis" && (
                          <span className={s.tagDevis}>Sur devis</span>
                        )}
                        {z.price !== "free" && z.price !== "devis" && (
                          <span className={s.tagPrice}>{z.price}</span>
                        )}
                      </td>
                      <td className={s.tableCell}>
                        <span className={s.tagDelay}>{z.delay}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── PROCESS ────────────────────────────────────────────────── */}
          <section className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>02</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Préparation &amp; Expédition</span>
            </div>
            <h2 className={s.sectionTitle}>
              Votre commande, <em>étape par étape</em>
            </h2>
            <p className={s.sectionLead}>
              De la confirmation au colis entre vos mains, chaque moment est
              suivi avec attention.
            </p>

            <div className={s.steps}>
              {[
                {
                  icon: <IconCheck size={14} />,
                  title: "Commande confirmée",
                  desc: "Vous recevez une confirmation par WhatsApp ou email dans les heures suivant votre achat.",
                  final: false,
                },
                {
                  icon: <IconPackage size={14} />,
                  title: "Préparation à l'atelier",
                  desc: "Chaque pièce est soigneusement emballée dans notre atelier de Seganinga. Comptez 1 à 2 jours ouvrés.",
                  final: false,
                },
                {
                  icon: <IconTruck size={14} />,
                  title: "Expédition & suivi",
                  desc: "Votre colis est remis au livreur ou à la coopérative choisie. Un numéro de suivi vous est communiqué.",
                  final: false,
                },
                {
                  icon: <IconShield size={14} />,
                  title: "Livraison chez vous",
                  desc: "Votre création Art Jatie arrive à destination. En cas d'absence, nous convenons d'une nouvelle remise.",
                  final: true,
                },
              ].map((step, i) => (
                <div key={i} className={s.step}>
                  <div className={s.stepLine}>
                    <div className={`${s.stepDot} ${step.final ? s.stepDotFinal : ""}`}>
                      {step.icon}
                    </div>
                    {i < 3 && <div className={s.stepConnector} />}
                  </div>
                  <div className={s.stepBody}>
                    <div className={s.stepBodyTitle}>{step.title}</div>
                    <p className={s.stepBodyDesc}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── RETOURS ────────────────────────────────────────────────── */}
          <section className={`${s.section} ${s.fadeUp} ${s.d5}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>03</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Politique de retours</span>
            </div>
            <h2 className={s.sectionTitle}>
              Retours <em>&amp;</em> échanges
            </h2>
            <p className={s.sectionLead}>
              Votre satisfaction est notre priorité. Voici les conditions
              détaillées pour un retour ou un échange.
            </p>

            <div className={s.accordion}>
              {faqItems.map((item, i) => (
                <div
                  key={i}
                  className={`${s.accItem} ${openAcc === i ? s.accItemOpen : ""}`}
                >
                  <button
                    className={s.accHeader}
                    onClick={() => toggleAcc(i)}
                    aria-expanded={openAcc === i}
                  >
                    <span className={s.accTitle}>{item.question}</span>
                    <div className={s.accChevron}>
                      <IconChevron size={12} />
                    </div>
                  </button>
                  <div className={s.accBody}>{item.answer}</div>
                </div>
              ))}
            </div>
          </section>

        </main>

        {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
        <aside className={`${s.sidebar} ${s.fadeUp} ${s.d4}`}>

          {/* Contact */}
          <div className={s.contactCard}>
            <p className={s.contactCardTitle}>Besoin d&rsquo;aide ?</p>
            <p className={s.contactCardSub}>
              Notre équipe répond à toutes vos questions sur la livraison
              ou les retours, du lundi au samedi.
            </p>
            <a
              href="https://wa.me/261320225170"
              target="_blank"
              rel="noopener noreferrer"
              className={s.contactBtnPrimary}
            >
              <IconWhatsapp size={15} />
              WhatsApp — 032 022 5170
            </a>
            <a href="mailto:contact@artjatie.mg" className={s.contactBtnSecondary}>
              <IconMail size={14} />
              contact@artjatie.mg
            </a>
            <div className={s.contactMeta}>
              <div className={s.contactMetaRow}>
                <IconMapPin size={13} />
                <span>Seganinga, Nosy Be, Madagascar</span>
              </div>
              <div className={s.contactMetaRow}>
                <IconPhone size={13} />
                <span>+261 34 30 513 60</span>
              </div>
              <div className={s.contactMetaRow}>
                <IconClock size={13} />
                <span>Lun – Sam · 8 h – 18 h</span>
              </div>
            </div>
          </div>

          {/* Policy summary */}
          <div className={s.policyCard}>
            <div className={s.policyCardTitle}>
              <IconShield size={13} />
              En résumé
            </div>
            {[
              { icon: <IconClock size={12} />, label: "Délai de retour", value: "2 jours après réception" },
              { icon: <IconPackage size={12} />, label: "État de l'article", value: "Non utilisé, défaut d'origine" },
              { icon: <IconRefresh size={12} />, label: "Échange", value: "Possible selon disponibilité" },
              { icon: <IconShield size={12} />, label: "Sur mesure", value: "Non remboursable (sauf défaut)" },
              { icon: <IconCheck size={12} />, label: "Remboursement", value: "Sous 3 – 5 jours ouvrés" },
            ].map((p, i) => (
              <div key={i} className={s.policyItem}>
                <div className={s.policyItemIcon}>{p.icon}</div>
                <div className={s.policyItemText}>
                  <strong>{p.label}</strong>
                  <span>{p.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Related links */}
          <div className={s.helpCard}>
            <div className={s.helpCardTitle}>Pages utiles</div>
            <div className={s.helpLinks}>
              <Link href="/guide" className={s.helpLink}>
                <div className={s.helpLinkLeft}>
                  <IconRuler size={14} />
                  Guide des Tailles
                </div>
                <div className={s.helpLinkArrow}><IconArrowRight size={13} /></div>
              </Link>
              <Link href="/faq" className={s.helpLink}>
                <div className={s.helpLinkLeft}>
                  <IconHelpCircle size={14} />
                  Questions Fréquentes
                </div>
                <div className={s.helpLinkArrow}><IconArrowRight size={13} /></div>
              </Link>
              <Link href="/contact" className={s.helpLink}>
                <div className={s.helpLinkLeft}>
                  <IconMail size={14} />
                  Nous contacter
                </div>
                <div className={s.helpLinkArrow}><IconArrowRight size={13} /></div>
              </Link>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}