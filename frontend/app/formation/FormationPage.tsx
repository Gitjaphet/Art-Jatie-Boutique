import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./FormationPage.module.css";
import ResultsCarousel from "./ResultsCarousel";
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

const materiel: { titre: string; items: Article[] }[] = [
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
  {
    titre: "Outils",
    items: [
      { nom: "Ciseaux", prix: "3 000 Ar" },
      { nom: "Crochet en fer", detail: "/ pièce", prix: "5 000 Ar" },
      { nom: "Mètre ruban", detail: "grand modèle", prix: "3 000 Ar" },
      { nom: "Mètre ruban", detail: "petit modèle", prix: "2 000 Ar" },
      { nom: "Marqueurs à laine", detail: "sachet de 6", prix: "3 000 Ar" },
      { nom: "Aiguille", detail: "grande", prix: "1 500 Ar" },
      { nom: "Aiguille", detail: "moyenne", prix: "1 000 Ar" },
      { nom: "Aiguille", detail: "petite", prix: "500 Ar" },
    ],
  },
  {
    titre: "Kits & livre",
    items: [
      { nom: "Livre formation crochet", detail: "niveau 1", prix: "10 000 Ar" },
      { nom: "Kit crochet débutant", prix: "17 000 Ar", enAvant: true },
      { nom: "Kit crochet complet", prix: "55 000 Ar", enAvant: true },
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
      r: "Vous pouvez vous procurer votre matériel directement chez Art Jatie (voir les tarifs du matériel ci-dessus) : le kit crochet débutant revient à 17 000 Ar et le kit crochet complet à 55 000 Ar.",
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

export default function FormationPage() {
  const now = new Date();
  const formules = getFormules(now);
  const faq = getFaq(now);

  return (
    <main className={styles.page}>
      {/* BREADCRUMB */}
      <nav className={styles.breadcrumb} aria-label="Fil d'ariane">
        <Link href="/">Accueil</Link>
        <span aria-hidden="true">/</span>
        <span>Formation</span>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Art Jatie — Hell-Ville, Nosy Be</p>
          <h1 className={styles.h1}>
            Apprenez le crochet, point par point, jusqu&apos;à{" "}
            <em>votre propre création</em>
          </h1>
          <p className={styles.heroLead}>
            Une formation à Hell-Ville, quartier Senganinga (Nosy Be),
            pensée pour les débutantes : vous repartez avec une technique
            solide et des pièces faites de vos mains.
          </p>
          <div className={styles.heroActions}>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaPrimary}
            >
              Réserver sur WhatsApp
            </a>
            <a href="#formules" className={styles.ctaSecondary}>
              Voir les tarifs
            </a>
          </div>
        </div>

        <div className={styles.heroCollage} aria-hidden="true">
          <div className={styles.collageItem1}>
            <Image
              src="/images/formation/atelier-groupe-nosybe.jpg"
              alt="Groupe de participantes lors d'une session de formation crochet Art Jatie à Nosy Be"
              width={420}
              height={520}
              className={styles.collageImg}
              priority
            />
          </div>
          <div className={styles.collageItem2}>
            <Image
              src="/images/formation/piece-finie-granny-square.jpg"
              alt="Short en crochet motif granny square réalisé pendant une formation Art Jatie"
              width={320}
              height={320}
              className={styles.collageImg}
            />
          </div>
        </div>
      </section>

      <ChainDivider />

      {/* POURQUOI */}
      <section className={styles.section}>
        <SectionHeader num="01" tag="Pourquoi Art Jatie" />
        <h2 className={styles.sectionTitle}>Pourquoi apprendre avec nous</h2>
        <div className={styles.reasonsGrid}>
          <div className={styles.reasonCard}>
            <h3 className={styles.h3}>Une méthode pas à pas</h3>
            <p>
              Du point de base à la finition, chaque étape est expliquée et
              pratiquée en direct, même si vous n&apos;avez jamais tenu un
              crochet.
            </p>
          </div>
          <div className={styles.reasonCard}>
            <h3 className={styles.h3}>Des groupes à taille humaine</h3>
            <p>
              10 personnes maximum par session, pour que chacune reçoive un
              accompagnement réellement individuel.
            </p>
          </div>
          <div className={styles.reasonCard}>
            <h3 className={styles.h3}>Des résultats concrets</h3>
            <p>
              Nos élèves repartent avec une pièce portable, réalisée de
              leurs mains — pas seulement des exercices.
            </p>
          </div>
        </div>
      </section>

      {/* PROGRAMME */}
      <section className={styles.section}>
        <SectionHeader num="02" tag="Le programme" />
        <h2 className={styles.sectionTitle}>Ce que vous allez apprendre</h2>
        <ul className={styles.programmeList}>
          {programme.map((item) => (
            <li key={item} className={styles.programmeItem}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <ChainDivider />

      {/* DEROULEMENT */}
      <section className={styles.section}>
        <SectionHeader num="03" tag="Déroulement" />
        <h2 className={styles.sectionTitle}>
          Comment se déroule une formation
        </h2>
        <ol className={styles.stepsList}>
          {etapes.map((etape, i) => (
            <li key={etape.titre} className={styles.stepItem}>
              <span className={styles.stepNumber}>{i + 1}</span>
              <div>
                <h3 className={styles.h3}>{etape.titre}</h3>
                <p>{etape.texte}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FORMULES */}
      <section id="formules" className={styles.section}>
        <SectionHeader num="04" tag="Formules & tarifs" />
        <h2 className={styles.sectionTitle}>Choisissez votre formule</h2>
        <div className={styles.formulesGrid}>
          {formules.map((f) => (
            <div
              key={f.nom}
              className={`${styles.formuleCard} ${
                f.accent ? styles.formuleCardAccent : ""
              }`}
            >
              {f.badge && <span className={styles.badge}>{f.badge}</span>}
              <h3 className={styles.h3}>{f.nom}</h3>
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

              {f.paiement && (
                <p className={styles.paymentNote}>{f.paiement}</p>
              )}

              <div className={styles.formulePieces}>
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
                className={f.accent ? styles.ctaPrimary : styles.ctaSecondary}
              >
                Réserver cette formule
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* MATERIEL */}
      <section className={styles.section}>
        <SectionHeader num="05" tag="Matériel" />
        <h2 className={styles.sectionTitle}>Tarifs du matériel</h2>
        <p className={styles.sectionLead}>
          Pas encore équipée ? Procurez-vous vos fils, accessoires et kits
          directement chez Art Jatie.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.tableThead}>
              <tr>
                <th>Article</th>
                <th>Prix</th>
              </tr>
            </thead>
            <tbody className={styles.tableTbody}>
              {materiel.map((groupe) => (
                <Fragment key={groupe.titre}>
                  <tr>
                    <th
                      colSpan={2}
                      scope="colgroup"
                      className={styles.tableCell}
                      style={{ textAlign: "left", paddingTop: "1.25rem" }}
                    >
                      <span className={styles.itemName}>{groupe.titre}</span>
                    </th>
                  </tr>
                  {groupe.items.map((a) => (
                    <tr
                      key={`${groupe.titre}-${a.nom}-${a.detail ?? ""}`}
                      className={a.enAvant ? styles.totalRow : undefined}
                    >
                      <td className={styles.tableCell}>
                        <span className={styles.itemName}>{a.nom}</span>
                        {a.detail && (
                          <span className={styles.itemDetail}>{a.detail}</span>
                        )}
                      </td>
                      <td className={styles.tableCell}>
                        <span
                          className={
                            a.enAvant ? styles.itemPriceTotal : styles.itemPrice
                          }
                        >
                          {a.prix}
                        </span>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.heroActions} style={{ marginTop: "1.75rem" }}>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaSecondary}
          >
            Commander mon matériel
          </a>
        </div>
      </section>

      <ChainDivider />

      {/* TEMOIGNAGES */}
      <section className={styles.section}>
        <SectionHeader num="06" tag="Témoignages" />
        <h2 className={styles.sectionTitle}>Ce qu&apos;en disent nos élèves</h2>
        <div className={styles.temoignagesGrid}>
          {temoignages.map((t) => (
            <figure key={t.nom} className={styles.temoignageCard}>
              <blockquote>&laquo;&nbsp;{t.texte}&nbsp;&raquo;</blockquote>
              <figcaption>{t.nom}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <ChainDivider />

      {/* EN IMAGES : vidéo + défilement photos résultats */}
      <section className={styles.section}>
        <SectionHeader num="07" tag="En images" />
        <h2 className={styles.sectionTitle}>Voyez la formation en action</h2>
        <p className={styles.sectionLead}>
          Une session filmée pour comprendre l&apos;ambiance, et un aperçu de
          ce que nos élèves repartent avec.
        </p>
        <div className={styles.mediaGrid}>
          <div className={styles.mediaCard}>
            <span className={styles.mediaLabel}>Immersion</span>
            <video
              className={styles.mediaVideo}
              poster="/images/formation/video-poster.jpg"
              controls
              muted
              loop
              playsInline
              preload="metadata"
            >
              <source
                src="/videos/formation/session-apercu.mp4"
                type="video/mp4"
              />
            </video>
          </div>

          <div className={styles.mediaCard}>
            <ResultsCarousel images={resultats} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section}>
        <SectionHeader num="08" tag="Questions fréquentes" />
        <h2 className={styles.sectionTitle}>Vous vous demandez peut-être</h2>
        <div className={styles.faqList}>
          {faq.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{item.q}</summary>
              <p className={styles.faqAnswer}>{item.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className={styles.finalCta}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>09</span>
          <span className={styles.sectionLine}></span>
          <span className={styles.sectionTag}>Réservation</span>
        </div>
        <h2 className={styles.sectionTitle}>
          Prête à créer votre première pièce ?
        </h2>
        <p>
          Places limitées, à Hell-Ville (Senganinga), Nosy Be. Réservez
          votre créneau dès maintenant.
        </p>
        <div className={styles.heroActions}>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaPrimary}
          >
            Réserver sur WhatsApp
          </a>
          <Link href="/contact" className={styles.ctaSecondary}>
            Nous contacter
          </Link>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ num, tag }: { num: string; tag: string }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionNum}>{num}</span>
      <span className={styles.sectionLine}></span>
      <span className={styles.sectionTag}>{tag}</span>
    </div>
  );
}

function ChainDivider() {
  return (
    <div className={styles.divider} role="presentation" aria-hidden="true">
      <svg
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
        className={styles.dividerSvg}
      >
        <path
          d="M0 10 C 10 0, 20 20, 30 10 C 40 0, 50 20, 60 10 C 70 0, 80 20, 90 10 C 100 0, 110 20, 120 10 C 130 0, 140 20, 150 10 C 160 0, 170 20, 180 10 C 190 0, 200 20, 200 10"
          fill="none"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}
