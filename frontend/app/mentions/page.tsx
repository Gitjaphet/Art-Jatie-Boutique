"use client";

import Link from "next/link";
import s from "./PageMentionsLegales.module.css";

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

const IconList = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const IconCalendar = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconLink = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconGavel = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 13l-8 8a2 2 0 0 1-3-3l8-8" />
    <path d="M20 8l-5-5" />
    <path d="M12 8l4-4 4 4-4 4z" />
  </svg>
);

const IconServer = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────

type InfoRow = { label: string; value: React.ReactNode };

const editorInfo: InfoRow[] = [
  { label: "Nom commercial", value: "Art Jatie" },
  { label: "Responsable", value: "Noeline (Art Jatie)" },
  { label: "Adresse", value: "Seganinga, Nosy Be, Madagascar" },
  { label: "Téléphone", value: "+261 34 30 513 60" },
  { label: "WhatsApp", value: "032 022 5170" },
  { label: "Email", value: <a href="mailto:contact@artjatie.mg" className={s.infoLink}>contact@artjatie.mg</a> },
];

const hostingInfo: InfoRow[] = [
  { label: "Hébergeur", value: "Vercel Inc." },
  { label: "Adresse", value: "340 Pine Street, Suite 900, San Francisco, CA 94104, USA" },
  { label: "Site web", value: <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className={s.infoLink}>vercel.com</a> },
];

type TocItem = { id: string; label: string; icon: React.ReactNode };

const tocItems: TocItem[] = [
  { id: "editeur",       label: "Éditeur du site",              icon: <IconList size={12} /> },
  { id: "hebergement",   label: "Hébergement",                  icon: <IconServer size={12} /> },
  { id: "propriete",     label: "Propriété intellectuelle",     icon: <IconShield size={12} /> },
  { id: "responsabilite",label: "Limitation de responsabilité", icon: <IconCalendar size={12} /> },
  { id: "liens",         label: "Liens hypertextes",            icon: <IconLink size={12} /> },
  { id: "droit",         label: "Droit applicable",             icon: <IconGavel size={12} /> },
];

// ─── Component ────────────────────────────────────────────────────────────

export default function PageMentionsLegales() {
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
        <span>Mentions Légales</span>
      </nav>

      {/* ── HERO ── */}
      <header className={s.hero}>
        <div className={`${s.fadeUp} ${s.d2}`}>
          <div className={s.heroEyebrow}>Aide &amp; Informations</div>
          <h1 className={s.heroTitle}>
            Mentions <em>Légales</em>
          </h1>
          <p className={s.heroSub}>
            Conformément aux dispositions légales en vigueur à Madagascar, vous trouverez
            ci-dessous toutes les informations relatives à l&rsquo;éditeur et à
            l&rsquo;exploitation du site artjatie.mg.
          </p>
        </div>

        <div className={`${s.heroMeta} ${s.fadeUp} ${s.d3}`}>
          <div className={s.heroMetaItem}>
            <div className={`${s.heroMetaIcon} ${s.iconReveal}`} style={{ animationDelay: "0.35s" }}>
              <IconCalendar size={20} />
            </div>
            <div className={s.heroMetaText}>
              <strong>Mise à jour</strong>
              <span>Mai 2026</span>
            </div>
          </div>
          <div className={s.heroMetaItem}>
            <div className={`${s.heroMetaIcon} ${s.iconReveal}`} style={{ animationDelay: "0.45s" }}>
              <IconShield size={20} />
            </div>
            <div className={s.heroMetaText}>
              <strong>Conformité</strong>
              <span>Droit malgache applicable</span>
            </div>
          </div>
          <div className={s.heroMetaItem}>
            <div className={`${s.heroMetaIcon} ${s.iconReveal}`} style={{ animationDelay: "0.55s" }}>
              <IconMapPin size={20} />
            </div>
            <div className={s.heroMetaText}>
              <strong>Siège</strong>
              <span>Nosy Be, Madagascar</span>
            </div>
          </div>
        </div>
      </header>

      <div className={s.divider} />

      {/* ── BODY ── */}
      <div className={s.body}>
        <main>

          {/* 01 — Éditeur */}
          <section id="editeur" className={`${s.section} ${s.fadeUp} ${s.d3}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>01</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Éditeur du site</span>
            </div>
            <h2 className={s.sectionTitle}>
              Éditeur <em>&amp;</em> responsable de publication
            </h2>
            <p className={s.sectionLead}>
              Le site <strong>artjatie.mg</strong> est édité et exploité par :
            </p>
            <div className={s.infoCard}>
              {editorInfo.map((row, i) => (
                <div key={i} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 02 — Hébergement */}
          <section id="hebergement" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>02</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Hébergement</span>
            </div>
            <h2 className={s.sectionTitle}>
              Hébergement <em>du site</em>
            </h2>
            <p className={s.sectionLead}>Le site artjatie.mg est hébergé par :</p>
            <div className={s.infoCard}>
              {hostingInfo.map((row, i) => (
                <div key={i} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 03 — Propriété intellectuelle */}
          <section id="propriete" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>03</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Propriété intellectuelle</span>
            </div>
            <h2 className={s.sectionTitle}>
              Propriété <em>intellectuelle</em>
            </h2>
            <p className={s.sectionLead}>
              L&rsquo;ensemble des contenus présents sur le site artjatie.mg — textes,
              photographies, visuels, illustrations, logo, nom commercial — est la propriété
              exclusive d&rsquo;<strong>Art Jatie</strong> et est protégé par les lois applicables
              relatives à la propriété intellectuelle et aux droits d&rsquo;auteur.
            </p>
            <p className={s.sectionLead}>
              Toute reproduction, représentation, modification, publication ou adaptation de tout
              ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est
              interdite sans l&rsquo;autorisation écrite préalable de Art Jatie. Toute exploitation
              non autorisée sera considérée comme constitutive d&rsquo;une contrefaçon.
            </p>
          </section>

          {/* 04 — Responsabilité */}
          <section id="responsabilite" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>04</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Limitation de responsabilité</span>
            </div>
            <h2 className={s.sectionTitle}>
              Limitation de <em>responsabilité</em>
            </h2>
            <p className={s.sectionLead}>
              Art Jatie s&rsquo;efforce d&rsquo;assurer l&rsquo;exactitude et la mise à jour des
              informations diffusées sur le site. Cependant, Art Jatie ne peut garantir
              l&rsquo;exhaustivité ou l&rsquo;absence d&rsquo;erreur des informations présentes.
            </p>
            <p className={s.sectionLead}>
              Art Jatie décline toute responsabilité en cas d&rsquo;interruption du site,
              de survenance de bugs, d&rsquo;inexactitude des informations, ou pour tout dommage
              résultant d&rsquo;une utilisation frauduleuse ou abusive du site par un tiers.
            </p>
            <div className={s.highlightBox}>
              <p className={s.highlightText}>
                Les photographies des produits sont à titre indicatif. De légères variations
                de couleurs peuvent apparaître en raison de votre écran. Chaque pièce étant
                fabriquée à la main, de légères variations artisanales font partie de
                l&rsquo;authenticité de nos créations.
              </p>
            </div>
          </section>

          {/* 05 — Liens */}
          <section id="liens" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>05</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Liens hypertextes</span>
            </div>
            <h2 className={s.sectionTitle}>
              Liens <em>hypertextes</em>
            </h2>
            <p className={s.sectionLead}>
              Le site artjatie.mg peut contenir des liens hypertextes vers d&rsquo;autres sites
              internet. Art Jatie n&rsquo;exerce aucun contrôle sur ces sites et décline toute
              responsabilité quant à leur contenu ou pratiques.
            </p>
            <p className={s.sectionLead}>
              La création de liens hypertextes pointant vers le site artjatie.mg est autorisée
              sous réserve qu&rsquo;elle ne porte pas atteinte à l&rsquo;image de la marque et
              que le lien s&rsquo;ouvre dans une nouvelle fenêtre.
            </p>
          </section>

          {/* 06 — Droit */}
          <section id="droit" className={`${s.section} ${s.fadeUp} ${s.d4}`}>
            <div className={s.sectionHeader}>
              <span className={s.sectionNum}>06</span>
              <div className={s.sectionLine} />
              <span className={s.sectionTag}>Droit applicable</span>
            </div>
            <h2 className={s.sectionTitle}>
              Droit <em>applicable</em>
            </h2>
            <p className={s.sectionLead}>
              Les présentes mentions légales sont soumises au droit malgache. En cas de litige,
              et à défaut de résolution amiable, les tribunaux compétents de{" "}
              <strong>Nosy Be, Madagascar</strong> seront seuls compétents.
            </p>
            <p className={s.sectionLead}>
              Pour toute question, contactez-nous à{" "}
              <a href="mailto:contact@artjatie.mg" className={s.textLink}>contact@artjatie.mg</a>.
            </p>
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
                    <span className={s.tocLinkIcon}>{item.icon}</span>
                    {item.label}
                  </div>
                  <div className={s.tocLinkArrow}><IconArrowRight size={11} /></div>
                </a>
              ))}
            </div>
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
              <Link href="/confidentialite" className={s.helpLink}>
                <div className={s.helpLinkLeft}>
                  <IconMail size={14} />
                  Confidentialité
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