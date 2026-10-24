import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import styles from "./FormationPage.module.css";
import {
  DEBUT_SESSION,
  PRIX_FORMATION_COMPLETE,
  PRIX_MODULE,
  PRIX_MODULE_PROMO,
  PRIX_SEANCE,
  formatAr,
  prixModule,
  promoModuleActive,
} from "./tarifs";

const WHATSAPP_LINK =
  "https://wa.me/261000000000?text=Bonjour%20Art%20Jatie%2C%20je%20suis%20intéressé(e)%20par%20la%20formation%20crochet";

const PHOTO_ATELIER = "/images/formation/atelier-groupe-nosybe.jpg";
const PHOTO_PIECE = "/images/formation/piece-finie-granny-square.jpg";

/* ─── DONNÉES ─────────────────────────────────────────────────────────── */

const chiffres = [
  { valeur: "10", label: "élèves max par groupe" },
  { valeur: "2 mois", label: "ou 1 mois intensif" },
  { valeur: "1 pièce", label: "faite de vos mains" },
];

const raisons: { icon: IconName; titre: string; texte: string }[] = [
  {
    icon: "steps",
    titre: "Une méthode pas à pas",
    texte:
      "Du point de base à la finition, chaque étape est expliquée et pratiquée en direct, même si vous n'avez jamais tenu un crochet.",
  },
  {
    icon: "group",
    titre: "Des groupes à taille humaine",
    texte:
      "10 personnes maximum par session, pour que chacune reçoive un accompagnement réellement individuel.",
  },
  {
    icon: "heart",
    titre: "Des résultats concrets",
    texte:
      "Nos élèves repartent avec une pièce portable, réalisée de leurs mains — pas seulement des exercices.",
  },
];

const programme = [
  "Le point de base et la tenue du fil (pour les débutantes complètes)",
  "La technique du granny square, la base de nos pièces signature",
  "Le montage en rond et le dégradé de couleurs",
  "Les finitions propres : bordures, lacets, pompons",
  "La confection de vos propres pièces : shorts, pantalons, robes, jupes, tops, bikinis, soutiens-gorge, jupes et robes de plage, sacs",
];

type Formule = {
  nom: string;
  tagline: string;
  prix: string;
  unite: string;
  meta: string[];
  paiement: string | null;
  piecesLabel: string;
  pieces: string[];
  accent: boolean;
  badge: string | null;
};

function getFormules(now: Date): Formule[] {
  const promo = promoModuleActive(now);
  return [
    {
      nom: "Formation Complète",
      tagline: "Le programme entier, du débutant à l'autonomie",
      prix: formatAr(PRIX_FORMATION_COMPLETE),
      unite: "au total",
      meta: [
        "2 mois · 3 séances / semaine",
        "ou 1 mois · 5 séances / semaine",
        ...(promo ? [`Session du ${DEBUT_SESSION}`] : []),
      ],
      paiement:
        "Payable en 2 fois : 40 000 Ar à l'inscription, puis 40 000 Ar une semaine après le début des cours.",
      piecesLabel: "Vous apprendrez à confectionner :",
      pieces: [
        "Shorts & pantalons",
        "Robes & jupes",
        "Tops, bikinis & soutiens-gorge",
        "Jupes et robes de plage",
        "Sacs",
      ],
      accent: true,
      badge: "La plus complète",
    },
    {
      nom: "Module au choix",
      tagline: "Un modèle précis, appris de A à Z",
      prix: formatAr(prixModule(now)),
      unite: "/ module",
      meta: ["Sans engagement", "Vous choisissez le modèle"],
      paiement: promo
        ? `Tarif promo pour toute inscription avant le ${DEBUT_SESSION}, puis ${formatAr(PRIX_MODULE)} le module.`
        : null,
      piecesLabel: "Exemples de modules :",
      pieces: ["Un short", "Un sac", "Un top ou un bikini"],
      accent: false,
      badge: promo ? "Promo" : null,
    },
    {
      nom: "Paiement par séance",
      tagline: "Vous ne payez que les séances suivies",
      prix: formatAr(PRIX_SEANCE),
      unite: "/ séance",
      meta: ["Sans engagement", "Flexible"],
      paiement: null,
      piecesLabel: "Idéal pour :",
      pieces: ["Venir quand vous êtes disponible", "Avancer à votre rythme"],
      accent: false,
      badge: null,
    },
  ];
}

type Article = { nom: string; detail?: string; prix: string; enAvant?: boolean };
type GroupeMateriel = { titre: string; vedette?: boolean; items: Article[] };

// Les kits passent en premier : c'est l'achat le plus simple pour une débutante
const materiel: GroupeMateriel[] = [
  {
    titre: "Kits & livre",
    vedette: true,
    items: [
      { nom: "Kit crochet débutant", prix: "21 000 Ar", enAvant: true },
      { nom: "Kit crochet complet", prix: "55 000 Ar", enAvant: true },
      { nom: "Livre formation crochet", detail: "niveau 1", prix: "10 000 Ar" },
    ],
  },
  {
    titre: "Outils",
    items: [
      { nom: "Ciseaux", prix: "3 000 Ar" },
      { nom: "Crochet en fer", detail: "la pièce", prix: "5 000 Ar" },
      { nom: "Mètre ruban", detail: "grand modèle", prix: "3 000 Ar" },
      { nom: "Mètre ruban", detail: "petit modèle", prix: "2 000 Ar" },
      { nom: "Marqueurs à laine", detail: "sachet de 6", prix: "3 000 Ar" },
      { nom: "Aiguille", detail: "grande", prix: "1 500 Ar" },
      { nom: "Aiguille", detail: "moyenne", prix: "1 000 Ar" },
      { nom: "Aiguille", detail: "petite", prix: "500 Ar" },
    ],
  },
  {
    titre: "Fils",
    items: [
      { nom: "Pelote de fil à coton", detail: "coloré ou blanc", prix: "4 000 Ar" },
      { nom: "Milk cotton 4 brins", detail: "50 g", prix: "5 000 Ar" },
      { nom: "Milk cotton 5 brins", detail: "200 g", prix: "20 000 Ar" },
      { nom: "Trapilho", detail: "100 g", prix: "5 000 Ar" },
      { nom: "Trapilho", detail: "150 g", prix: "8 000 Ar" },
      { nom: "Trapilho", detail: "200 g", prix: "10 000 Ar" },
      { nom: "Trapilho", detail: "250 g", prix: "13 000 Ar" },
      { nom: "Trapilho", detail: "300 g", prix: "15 000 Ar" },
      { nom: "Trapilho", detail: "350 g", prix: "18 000 Ar" },
      { nom: "Trapilho", detail: "400 g", prix: "20 000 Ar" },
      { nom: "Trapilho", detail: "450 g", prix: "23 000 Ar" },
      { nom: "Trapilho", detail: "500 g", prix: "25 000 Ar" },
      { nom: "Trapilho", detail: "600 g", prix: "30 000 Ar" },
    ],
  },
  {
    titre: "Montage de sacs",
    items: [
      { nom: "Fermoir clic-clac", detail: "30 cm", prix: "19 000 Ar" },
      { nom: "Fermoir clic-clac", detail: "16 cm", prix: "10 000 Ar" },
      { nom: "Canevas", prix: "10 000 Ar" },
      { nom: "Fond de sac", detail: "rond ovale", prix: "10 000 Ar" },
      { nom: "Fond de sac", detail: "ovale", prix: "13 000 Ar" },
    ],
  },
];

const etapes = [
  {
    titre: "Réservez votre place",
    texte:
      "Contactez-nous par WhatsApp ou Messenger pour choisir votre créneau. Les groupes sont limités à 10 personnes.",
  },
  {
    titre: "Apprenez pas à pas",
    texte:
      "En petit groupe, à Nosy Be, vous apprenez le point de base puis la technique du granny square utilisée dans toutes nos pièces.",
  },
  {
    titre: "Repartez avec votre pièce",
    texte:
      "Vous choisissez votre modèle et terminez la formation avec une réalisation faite de vos mains, prête à porter.",
  },
];

const temoignages = [
  {
    nom: "Esmeraldah T.",
    texte:
      "Débutante il y a encore peu, j'ai réussi à créer cette pièce moi-même grâce à la formation.",
  },
  {
    nom: "Ornica C.",
    texte:
      "Volontaire du crochet à la base, mais pas encore la finition. J'ai bien mérité mon avancée avec Art Jatie.",
  },
  {
    nom: "Lania B.",
    texte:
      "J'ai suivi la formation et j'ai réussi mon premier ensemble toute seule. Franchement, je suis fière de moi.",
  },
  {
    nom: "Maman'i Anyah",
    texte:
      "Retour en tant que débutante niveau marigny, j'ai continué à apprendre et j'ai enfin de bons résultats.",
  },
];

const resultats = [
  {
    src: "/images/formation/resultats/piece-1.png",
    alt: "Short en crochet motif granny square réalisé en formation",
  },
  {
    src: "/images/formation/resultats/piece-2.png",
    alt: "Haut de bikini en crochet réalisé par une élève débutante",
  },
  {
    src: "/images/formation/resultats/piece-3.png",
    alt: "Sac bandoulière en crochet réalisé pendant une formation Art Jatie",
  },
  {
    src: "/images/formation/resultats/piece-4.png",
    alt: "Ensemble crochet deux pièces terminé par une élève",
  },
];

function getFaq(now: Date) {
  const promo = promoModuleActive(now);
  return [
    {
      q: "Faut-il déjà savoir crocheter pour s'inscrire ?",
      r: "Non. La formation est ouverte aux débutantes complètes : nous commençons par le point de base et la tenue du fil avant d'aborder le granny square.",
    },
    ...(promo
      ? [
          {
            q: "Quand commence la prochaine session ?",
            r: `La prochaine session démarre le ${DEBUT_SESSION}. Inscrivez-vous avant cette date pour profiter du module au choix à ${formatAr(PRIX_MODULE_PROMO)} au lieu de ${formatAr(PRIX_MODULE)}.`,
          },
        ]
      : []),
    {
      q: "Combien de temps dure la formation complète ?",
      r: "Deux rythmes au choix : 2 mois à raison de 3 séances par semaine, ou 1 mois en intensif à raison de 5 séances par semaine. Dans les deux cas, vous allez du point de base jusqu'à la confection autonome de vos pièces.",
    },
    {
      q: "Puis-je payer en plusieurs fois ?",
      r: `Oui, pour la formation complète (${formatAr(PRIX_FORMATION_COMPLETE)}) : 40 000 Ar à l'inscription, puis 40 000 Ar une semaine après le début des cours.`,
    },
    {
      q: "Quelle est la différence entre le module au choix et le paiement par séance ?",
      r: `Le module au choix (${formatAr(prixModule(now))}${promo ? `, puis ${formatAr(PRIX_MODULE)} après la promo` : ""}) vous fait apprendre un modèle précis de A à Z. Le paiement par séance (${formatAr(PRIX_SEANCE)}) vous permet de venir quand vous le souhaitez et de ne payer que les séances suivies. Les deux sont sans engagement.`,
    },
    {
      q: "Dois-je acheter mon propre matériel ?",
      r: "Vous pouvez vous procurer votre matériel directement chez Art Jatie (voir les tarifs du matériel ci-dessus) : le kit crochet débutant revient à 21 000 Ar et le kit crochet complet à 55 000 Ar.",
    },
    {
      q: "Où se déroule la formation ?",
      r: "À Hell-Ville, quartier Senganinga, à Nosy Be. L'adresse précise est communiquée après réservation par WhatsApp ou Messenger.",
    },
    {
      q: "Puis-je choisir le modèle que je veux réaliser ?",
      r: "Oui. Au fil de la formation, vous choisissez parmi shorts, pantalons, robes, jupes, tops, bikinis, soutiens-gorge, jupes et robes de plage, ou sacs.",
    },
  ];
}

/* ─── PAGE ────────────────────────────────────────────────────────────── */

export default function FormationPage() {
  const now = new Date();
  const formules = getFormules(now);
  const faq = getFaq(now);

  return (
    <div className={styles.page}>
      {/* HERO — jamais dans un Reveal : il doit s'afficher tout de suite (LCP) */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <nav className={styles.breadcrumb} aria-label="Fil d'ariane">
              <Link href="/">Accueil</Link>
              <span aria-hidden="true">/</span>
              <span>Formation</span>
            </nav>

            <p className={styles.eyebrow}>Formation crochet · Hell-Ville, Nosy Be</p>
            <h1 className={styles.h1}>
              <span className={styles.h1Line}>Apprenez le crochet,</span>
              <span className={styles.h1Accent}>point par point</span>
            </h1>
            <BrushUnderline className={styles.heroBrush} />
            <p className={styles.heroSubtitle}>jusqu&apos;à votre propre création.</p>
            <p className={styles.heroLead}>
              Une formation à Hell-Ville, quartier Senganinga (Nosy Be), pensée
              pour les débutantes : vous repartez avec une technique solide et
              des pièces faites de vos mains.
            </p>

            <div className={styles.actions}>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaPrimary}
              >
                Réserver sur WhatsApp
              </a>
              <a href="#formules" className={styles.ctaGhost}>
                Voir les tarifs
              </a>
            </div>

            <dl className={styles.chiffres}>
              {chiffres.map((c) => (
                <div key={c.label} className={styles.chiffre}>
                  <dt className={styles.chiffreValeur}>{c.valeur}</dt>
                  <dd className={styles.chiffreLabel}>{c.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={styles.heroVisual}>
            <span className={styles.heroFrame} aria-hidden="true" />
            <div className={styles.heroPhoto}>
              <Image
                src={PHOTO_ATELIER}
                alt="Groupe de participantes lors d'une session de formation crochet Art Jatie à Nosy Be"
                fill
                priority
                sizes="(max-width: 968px) 90vw, 40vw"
                className={styles.cover}
              />
            </div>
            <div className={styles.heroMedallion}>
              <Image
                src={PHOTO_PIECE}
                alt="Short en crochet motif granny square réalisé pendant une formation Art Jatie"
                fill
                sizes="200px"
                className={styles.cover}
              />
            </div>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className={styles.intro}>
        <Reveal>
          <span className={styles.introRule} aria-hidden="true" />
          <p className={styles.introText}>
            Chez Art Jatie, le crochet s&apos;apprend comme il se pratique à
            l&apos;atelier : en petit groupe, les mains dans le fil, avec un
            accompagnement du tout premier point jusqu&apos;à la dernière
            finition.
          </p>
          <p className={styles.introQuote}>Un savoir-faire qui se transmet, de main en main.</p>
        </Reveal>
      </section>

      {/* POURQUOI */}
      <section className={styles.band}>
        <div className={styles.container}>
          <SectionHeading kicker="Pourquoi Art Jatie" title="Apprendre" accent="avec nous" />
          <div className={styles.raisonsGrid}>
            {raisons.map((r, i) => (
              <Reveal key={r.titre} delay={i * 120}>
                <article className={styles.raisonCard}>
                  <span className={styles.raisonIcon}>
                    <Icon name={r.icon} />
                  </span>
                  <h3 className={styles.cardTitle}>{r.titre}</h3>
                  <p className={styles.cardText}>{r.texte}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMME — texte + photo côte à côte */}
      <section className={styles.bandTinted}>
        <div className={`${styles.container} ${styles.split}`}>
          <div>
            <SectionHeading
              kicker="Le programme"
              title="Ce que vous"
              accent="allez apprendre"
              align="left"
            />
            <ol className={styles.programmeList}>
              {programme.map((item, i) => (
                <li key={item}>
                  <Reveal delay={i * 80} className={styles.programmeRow}>
                    <span className={styles.programmeNum}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.programmeText}>{item}</span>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>

          <Reveal delay={150} className={styles.splitVisual}>
            <span className={styles.splitFrame} aria-hidden="true" />
            <div className={styles.splitPhoto}>
              <Image
                src={resultats[0].src}
                alt={resultats[0].alt}
                fill
                sizes="(max-width: 968px) 90vw, 40vw"
                className={styles.cover}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* DÉROULEMENT — frise en 3 étapes */}
      <section className={styles.band}>
        <div className={styles.container}>
          <SectionHeading kicker="Déroulement" title="Comment" accent="ça se passe" />
          <ol className={styles.steps}>
            {etapes.map((e, i) => (
              <li key={e.titre} className={styles.step}>
                <Reveal delay={i * 150}>
                  <span className={styles.stepNumber}>{i + 1}</span>
                  <h3 className={styles.cardTitle}>{e.titre}</h3>
                  <p className={styles.cardText}>{e.texte}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FORMULES */}
      <section id="formules" className={styles.bandTinted}>
        <div className={styles.container}>
          <SectionHeading kicker="Formules & tarifs" title="Choisissez" accent="votre formule" />
          <div className={styles.formulesGrid}>
            {formules.map((f, i) => (
              <Reveal key={f.nom} delay={i * 120}>
                <article
                  className={`${styles.formuleCard} ${f.accent ? styles.formuleCardAccent : ""}`}
                >
                  {f.badge && <span className={styles.badge}>{f.badge}</span>}
                  <h3 className={styles.formuleNom}>{f.nom}</h3>
                  <p className={styles.formuleTagline}>{f.tagline}</p>
                  <p className={styles.prix}>
                    {f.prix}
                    <span className={styles.prixUnite}>{f.unite}</span>
                  </p>

                  <div className={styles.formuleMeta}>
                    {f.meta.map((m) => (
                      <span key={m} className={styles.metaPill}>
                        {m}
                      </span>
                    ))}
                  </div>

                  {f.paiement && <p className={styles.paymentNote}>{f.paiement}</p>}

                  <div>
                    <span className={styles.piecesLabel}>{f.piecesLabel}</span>
                    <ul className={styles.inclusList}>
                      {f.pieces.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={f.accent ? styles.ctaPrimary : styles.ctaGhost}
                  >
                    Réserver cette formule
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* EN IMAGES — galerie décalée + vidéo */}
      <section className={styles.band}>
        <div className={styles.container}>
          <SectionHeading kicker="Nos élèves" title="La formation" accent="en images" />
          <div className={styles.gallery}>
            {resultats.map((img, i) => (
              <Reveal key={img.src} delay={i * 120} className={styles.galleryItem}>
                <div className={styles.galleryFrame}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 700px) 75vw, (max-width: 968px) 45vw, 25vw"
                    className={styles.galleryImg}
                  />
                </div>
              </Reveal>
            ))}
          </div>

          <div className={styles.immersion}>
            <Reveal className={styles.immersionText}>
              <p className={styles.kicker}>Immersion</p>
              <h3 className={styles.immersionTitle}>
                Une session, <em>comme si vous y étiez</em>
              </h3>
              <p className={styles.cardText}>
                Une session filmée en atelier pour sentir l&apos;ambiance : le
                rythme, l&apos;entraide, et les premières pièces qui prennent
                forme.
              </p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaGhost}
              >
                Réserver ma place
              </a>
            </Reveal>
            <Reveal delay={150} className={styles.immersionMedia}>
              <video
                className={styles.video}
                poster="/images/formation/video-poster.jpg"
                controls
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source src="/videos/formation/session-apercu.mp4" type="video/mp4" />
              </video>
            </Reveal>
          </div>
        </div>
      </section>

      <ChainDivider />

      {/* TÉMOIGNAGES */}
      <section className={styles.band}>
        <div className={styles.container}>
          <SectionHeading kicker="Témoignages" title="Elles en" accent="parlent" />
          <div className={styles.temoignagesGrid}>
            {temoignages.map((t, i) => (
              <Reveal key={t.nom} delay={(i % 2) * 120}>
                <figure className={styles.temoignageCard}>
                  <span className={styles.quoteMark} aria-hidden="true">
                    &ldquo;
                  </span>
                  <blockquote className={styles.quoteText}>{t.texte}</blockquote>
                  <figcaption className={styles.quoteAuthor}>{t.nom}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MATÉRIEL — cartes façon menu, prix alignés par des pointillés */}
      <section className={styles.bandTinted}>
        <div className={styles.container}>
          <SectionHeading kicker="Matériel" title="Votre" accent="matériel" />
          <p className={styles.sectionLead}>
            Pas encore équipée ? Procurez-vous vos fils, accessoires et kits
            directement chez Art Jatie.
          </p>
          <div className={styles.materielGrid}>
            {materiel.map((g, i) => (
              <Reveal key={g.titre} delay={(i % 2) * 120}>
                <div
                  className={`${styles.materielCard} ${g.vedette ? styles.materielCardVedette : ""}`}
                >
                  <h3 className={styles.materielTitre}>{g.titre}</h3>
                  <ul className={styles.materielList}>
                    {g.items.map((a) => (
                      <li
                        key={`${g.titre}-${a.nom}-${a.detail ?? ""}`}
                        className={`${styles.materielItem} ${a.enAvant ? styles.materielItemEnAvant : ""}`}
                      >
                        <span className={styles.itemName}>
                          {a.nom}
                          {a.detail && <span className={styles.itemDetail}>{a.detail}</span>}
                        </span>
                        <span className={styles.itemDots} aria-hidden="true" />
                        <span className={styles.itemPrice}>{a.prix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <div className={styles.actionsCenter}>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaGhost}
            >
              Commander mon matériel
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.band}>
        <div className={styles.containerNarrow}>
          <SectionHeading kicker="Questions fréquentes" title="Vos" accent="questions" />
          <Reveal>
            <div className={styles.faqList}>
              {faq.map((item) => (
                <details key={item.q} className={styles.faqItem}>
                  <summary className={styles.faqQuestion}>{item.q}</summary>
                  <p className={styles.faqAnswer}>{item.r}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL — bandeau photo pleine largeur */}
      <section className={styles.finalCta}>
        <Image src={PHOTO_ATELIER} alt="" fill sizes="100vw" className={styles.finalCtaBg} />
        <span className={styles.finalCtaOverlay} aria-hidden="true" />
        <Reveal className={styles.finalCtaContent}>
          <p className={styles.kickerLight}>Réservation</p>
          <h2 className={styles.finalCtaTitle}>
            Prête à créer <span>votre première pièce ?</span>
          </h2>
          <p className={styles.finalCtaText}>
            Places limitées, à Hell-Ville (Senganinga), Nosy Be. Réservez votre
            créneau dès maintenant.
          </p>
          <div className={styles.actionsCenter}>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaPrimary}
            >
              Réserver sur WhatsApp
            </a>
            <Link href="/contact" className={styles.ctaLight}>
              Nous contacter
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/* ─── COMPOSANTS ──────────────────────────────────────────────────────── */

function SectionHeading({
  kicker,
  title,
  accent,
  align = "center",
}: {
  kicker: string;
  title: string;
  accent: string;
  align?: "center" | "left";
}) {
  return (
    <Reveal className={`${styles.heading} ${align === "left" ? styles.headingLeft : ""}`}>
      <p className={styles.kicker}>{kicker}</p>
      <h2 className={styles.title}>
        {title} <span className={styles.titleAccent}>{accent}</span>
      </h2>
      <BrushUnderline className={styles.headingBrush} />
    </Reveal>
  );
}

// Trait de pinceau effilé sous les titres (forme pleine, plus fine aux extrémités)
function BrushUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 12"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 8 C 70 3, 180 1, 298 4 C 190 5, 90 7, 2 11 Z" />
    </svg>
  );
}

function ChainDivider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <svg viewBox="0 0 200 20" preserveAspectRatio="none" className={styles.dividerSvg}>
        <path
          d="M0 10 C 10 0, 20 20, 30 10 C 40 0, 50 20, 60 10 C 70 0, 80 20, 90 10 C 100 0, 110 20, 120 10 C 130 0, 140 20, 150 10 C 160 0, 170 20, 180 10 C 190 0, 200 20, 200 10"
          fill="none"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}

type IconName = "steps" | "group" | "heart";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    steps: (
      <>
        <path d="m3 17 2 2 4-4" />
        <path d="m3 7 2 2 4-4" />
        <path d="M13 6h8M13 12h8M13 18h8" />
      </>
    ),
    group: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    heart: (
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
