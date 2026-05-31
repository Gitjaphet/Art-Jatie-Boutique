"use client";

import Link from "next/link";
import s from "./PageConfidentialite.module.css";

// ─── SVG Icons ────────────────────────────────────────────────────────────

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

const IconArrowRight = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconUser = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconCreditCard = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconMessageCircle = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconEye = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEdit = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const IconShare = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconBan = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const IconList = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────

type DataCard = { icon: React.ReactNode; title: string; desc: string };

const dataCards: DataCard[] = [
  { icon: <IconUser size={16} />, title: "Identité", desc: "Nom complet, numéro WhatsApp ou téléphone, adresse email si fournie." },
  { icon: <IconMapPin size={16} />, title: "Livraison", desc: "Adresse de livraison, zone géographique choisie pour la livraison." },
  { icon: <IconCreditCard size={16} />, title: "Paiement", desc: "Numéro MVola ou Orange Money, référence de transaction. Aucune donnée bancaire sensible n'est stockée." },
  { icon: <IconMessageCircle size={16} />, title: "Messages", desc: "Messages envoyés via WhatsApp, email ou formulaire, pour traiter vos demandes." },
];

type RightItem = { icon: React.ReactNode; title: string; desc: string };

const rightItems: RightItem[] = [
  { icon: <IconEye size={14} />, title: "Droit d'accès", desc: "Obtenir une copie des données personnelles que nous détenons à votre sujet." },
  { icon: <IconEdit size={14} />, title: "Droit de rectification", desc: "Corriger des données inexactes ou incomplètes vous concernant." },
  { icon: <IconTrash size={14} />, title: "Droit à l'effacement", desc: "Demander la suppression de vos données, sous réserve d'obligations légales." },
  { icon: <IconShare size={14} />, title: "Droit à la portabilité", desc: "Recevoir vos données dans un format structuré et lisible par machine." },
  { icon: <IconBan size={14} />, title: "Droit d'opposition", desc: "Vous opposer au traitement de vos données, notamment pour la newsletter." },
];

type TocItem = { id: string; label: string };

const tocItems: TocItem[] = [
  { id: "collecte",     label: "Données collectées" },
  { id: "utilisation",  label: "Utilisation" },
  { id: "partage",      label: "Partage avec des tiers" },
  { id: "cookies",      label: "Cookies" },
  { id: "conservation", label: "Conservation" },
  { id: "droits",       label: "Vos droits" },
  { id: "contact",      label: "Contact" },
];

// ─── Component ────────────────────────────────────────────────────────────

export default function PageConfidentialite() {
  return (
    <div className={s.wrap}>

      {/* ── BREADCRUMB ── */}
      <nav className={`${s.breadcrumb} ${s.fadeUp} ${s.d1}`} aria-label="Fil d'Ariane">
        <Link href="/">Accueil</Link>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        <span>Aide &amp; Infos</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        <span>Confidentialité</span>
      </nav>

      {/* ── HERO ── */}
      <header className={s.hero}>
        <div className={`${s.fadeUp} ${s.d2}`}>
          <div className={s.heroEyebrow}>Aide &amp; Informations</div>
          <h1 className={s.heroTitle}>
            Politique de <em>Confidentialité</em>
          </h1>
          <p className={s.heroSub}>
            Votre vie privée nous importe. Cette politique explique comment Art Jatie collecte,
            utilise et protège vos données personnelles lors de vos visites et achats sur artjatie.mg.
          </p>
        </div>

        <div className={`${s.heroMeta} ${s.fadeUp} ${s.d3}`}>
          <div className={s.heroMetaItem}>
            <div className={`${s.heroMetaIcon} ${s.iconReveal}`} style={{ animationDelay: "0.35s" }}>
              <IconShield size={20} />
            </div>
            <div className={s.heroMetaText}>
              <strong>Données protégées</strong>
              <span>Jamais revendues à des tiers</span>
            </div>
          </div>
          <div className={s.heroMetaItem}>
            <div className={`${s.heroMetaIcon} ${s.iconReveal}`} style={{ animationDelay: "0.45s" }}>
              <IconEye size={20} />
            </div>
            <div className={s.heroMetaText}>
              <strong>Transparence totale</strong>
              <span>Ce que nous collectons et pourquoi</span>
            </div>
          </div>
          <div className={s.heroMetaItem}>
            <div className={`${s.heroMetaIcon} ${s.iconReveal}`} style={{ animationDelay: "0.55s" }}>
              <IconClock size={20} />
            </div>
            <div className={s.heroMetaText}>
              <strong>Mise à jour</strong>
              <span>Mai 2026</span>
            </div>
          </div>
        </div>
      </header>

      <div className={s.divider} />

      {/* ── BODY ── */}
      <div className={s.body}>
        <main>

          {/* 01 — Collecte */}
          <section id="collecte" className={`${s.section} ${s.fadeUp} ${s.d3}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>01</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Données collectées</span>
            </div>
            <h2 className={s.sectionTitle}>
              Quelles données <em>collectons-nous ?</em>
            </h2>
            <p className={s.sectionLead}>
              Lors de vos interactions avec Art Jatie, nous pouvons collecter les informations suivantes :
            </p>
            <div className={s.dataGrid}>
              {dataCards.map((card, i) => (
                <div key={i} className={s.dataCard}>
                  <div className={s.dataCardIcon}>{card.icon}</div>
                  <div className={s.dataCardTitle}>{card.title}</div>
                  <p className={s.dataCardDesc}>{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 02 — Utilisation */}
          <section id="utilisation" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>02</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Utilisation des données</span>
            </div>
            <h2 className={s.sectionTitle}>
              Comment utilisons-nous <em>vos données ?</em>
            </h2>
            <p className={s.sectionLead}>
              Les informations collectées sont utilisées exclusivement pour :
            </p>
            <ul className={s.bulletList}>
              <li>Traiter et confirmer votre commande</li>
              <li>Organiser et assurer la livraison de votre achat</li>
              <li>Vous contacter concernant l&rsquo;état de votre commande</li>
              <li>Répondre à vos questions et demandes de service client</li>
              <li>Gérer les retours et remboursements éventuels</li>
              <li>Vous envoyer notre newsletter (uniquement si vous y avez consenti)</li>
            </ul>
            <p className={s.sectionLead}>
              Vos données ne sont jamais revendues, louées ou partagées à des fins
              commerciales avec des tiers.
            </p>
          </section>

          {/* 03 — Partage */}
          <section id="partage" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>03</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Partage des données</span>
            </div>
            <h2 className={s.sectionTitle}>
              Partage avec <em>des tiers</em>
            </h2>
            <p className={s.sectionLead}>
              Art Jatie peut partager vos données uniquement dans les cas suivants :
            </p>
            <ul className={s.bulletList}>
              <li>
                <strong>Prestataires de livraison</strong> — votre nom et adresse sont communiqués
                aux coopératives ou livreurs partenaires (Service Rapide, Besady, Cotisse, etc.)
                pour assurer la livraison.
              </li>
              <li>
                <strong>Obligations légales</strong> — si la loi malgache l&rsquo;exige, vos données
                peuvent être communiquées aux autorités compétentes.
              </li>
            </ul>
            <div className={s.highlightBox}>
              <p className={s.highlightText}>
                <strong>Engagement Art Jatie :</strong> Vos données personnelles ne sont jamais
                vendues à des tiers, ni utilisées à des fins publicitaires par des partenaires extérieurs.
              </p>
            </div>
          </section>

          {/* 04 — Cookies */}
          <section id="cookies" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>04</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Cookies</span>
            </div>
            <h2 className={s.sectionTitle}>
              Cookies <em>&amp;</em> technologies similaires
            </h2>
            <p className={s.sectionLead}>
              Le site artjatie.com peut utiliser des cookies techniques nécessaires au bon
              fonctionnement du site (panier d&rsquo;achat, session utilisateur). Ces cookies
              ne collectent pas de données personnelles à des fins publicitaires.
            </p>
            <p className={s.sectionLead}>
              Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines
              fonctionnalités du site pourraient ne plus fonctionner correctement.
            </p>
          </section>

          {/* 05 — Conservation */}
          <section id="conservation" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>05</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Conservation</span>
            </div>
            <h2 className={s.sectionTitle}>
              Durée de <em>conservation</em>
            </h2>
            <p className={s.sectionLead}>
              Vos données personnelles sont conservées pendant la durée nécessaire à la finalité
              pour laquelle elles ont été collectées :
            </p>
            <div className={s.retentionList}>
              {[
                { label: "Données de commande", value: "3 ans à compter de la date de la commande" },
                { label: "Messages de contact", value: "1 an après la résolution de votre demande" },
                { label: "Données newsletter", value: "Jusqu'à désinscription de votre part" },
              ].map((item, i) => (
                <div key={i} className={s.retentionItem}>
                  <div className={s.retentionDot} />
                  <div className={s.retentionContent}>
                    <span className={s.retentionLabel}>{item.label}</span>
                    <span className={s.retentionValue}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className={s.sectionLead} style={{ marginTop: "16px" }}>
              À l&rsquo;expiration de ces délais, vos données sont supprimées de façon sécurisée.
            </p>
          </section>

          {/* 06 — Droits */}
          <section id="droits" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>06</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Vos droits</span>
            </div>
            <h2 className={s.sectionTitle}>
              Vos droits sur <em>vos données</em>
            </h2>
            <p className={s.sectionLead}>
              Conformément à la réglementation applicable, vous disposez des droits suivants :
            </p>
            <div className={s.rightsList}>
              {rightItems.map((item, i) => (
                <div key={i} className={s.rightItem}>
                  <div className={s.rightIcon}>{item.icon}</div>
                  <div className={s.rightContent}>
                    <div className={s.rightTitle}>{item.title}</div>
                    <p className={s.rightDesc}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className={s.sectionLead} style={{ marginTop: "16px" }}>
              Pour exercer l&rsquo;un de ces droits, contactez-nous à{" "}
              <a href="mailto:contact@artjatie.mg" className={s.textLink}>contact@artjatie.mg</a>.
              Nous répondons sous <strong>30 jours</strong>.
            </p>
          </section>

          {/* 07 — Contact */}
          <section id="contact" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>07</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Contact</span>
            </div>
            <h2 className={s.sectionTitle}>
              Nous <em>contacter</em>
            </h2>
            <p className={s.sectionLead}>
              Pour toute question relative à cette politique de confidentialité ou pour
              exercer vos droits :
            </p>
            <ul className={s.bulletList}>
              <li>Email : <a href="mailto:contact@artjatie.mg" className={s.textLink}>contact@artjatie.mg</a></li>
              <li>WhatsApp : <a href="https://wa.me/261320225170" target="_blank" rel="noopener noreferrer" className={s.textLink}>034 30 513 60</a></li>
              <li>Adresse : Seganinga, Nosy Be, Madagascar</li>
            </ul>
          </section>

        </main>

        {/* ── SIDEBAR ── */}
        <aside className={`${s.sidebar} ${s.fadeUp} ${s.d4}`}>

          {/* Table des matières */}
          <div className={s.tocCard}>
            <div className={s.tocCardTitle}>
              <IconList size={13} />
              Table des matières
            </div>
            <div className={s.tocLinks}>
              {tocItems.map((item) => (
                <a key={item.id} href={`#${item.id}`} className={s.tocLink}>
                  <div className={s.tocLinkLeft}>
                    <span className={s.tocArrow}><IconArrowRight size={10} /></span>
                    {item.label}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Résumé */}
          <div className={s.policyCard}>
            <div className={s.policyCardTitle}>
              <IconShield size={13} />
              En résumé
            </div>
            {[
              { icon: <IconBan size={12} />, label: "Revente", value: "Données jamais revendues" },
              { icon: <IconShield size={12} />, label: "Sécurité", value: "Paiement jamais stocké" },
              { icon: <IconClock size={12} />, label: "Commandes", value: "Conservées 3 ans" },
              { icon: <IconEdit size={12} />, label: "Droits", value: "Accès et rectification" },
              { icon: <IconTrash size={12} />, label: "Suppression", value: "Sur simple demande" },
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

          {/* Contact */}
          <div className={s.contactCard}>
            <p className={s.contactCardTitle}>Une question ?</p>
            <p className={s.contactCardSub}>
              Notre équipe répond à toutes vos questions, du lundi au samedi.
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

          {/* Pages utiles */}
          <div className={s.helpCard}>
            <div className={s.helpCardTitle}>Pages utiles</div>
            <div className={s.helpLinks}>
              <Link href="/livraison" className={s.helpLink}>
                <div className={s.helpLinkLeft}>
                  <IconShield size={14} />
                  Livraison &amp; Retours
                </div>
                <div className={s.helpLinkArrow}><IconArrowRight size={13} /></div>
              </Link>
              <Link href="/mentions-legales" className={s.helpLink}>
                <div className={s.helpLinkLeft}>
                  <IconList size={14} />
                  Mentions Légales
                </div>
                <div className={s.helpLinkArrow}><IconArrowRight size={13} /></div>
              </Link>
              <Link href="/contact" className={s.helpLink}>
                <div className={s.helpLinkLeft}>
                  <IconPhone size={14} />
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