import Image from "next/image";
import Link from "next/link";
import styles from "./FormationPage.module.css";
import ResultsCarousel from "./ResultsCarousel";

const WHATSAPP_LINK =
  "https://wa.me/261000000000?text=Bonjour%20Art%20Jatie%2C%20je%20suis%20intéressé(e)%20par%20la%20formation%20crochet";

const programme = [
  "Le point de base et la tenue du fil (pour les débutantes complètes)",
  "La technique du granny square, la base de nos pièces signature",
  "Le montage en rond et le dégradé de couleurs",
  "Les finitions propres : bordures, lacets, pompons",
  "Le choix et la réalisation de votre modèle : culotte, soutif, top, robe, short, sac ou chapeau",
];

const formules = [
  {
    nom: "Séance à la carte",
    prix: "5 000 Ar",
    unite: "/ séance",
    description:
      "Idéal pour découvrir le crochet ou continuer à votre rythme, séance après séance.",
    inclus: ["Encadrement personnalisé", "Prêt de matériel sur place"],
    accent: false,
  },
  {
    nom: "Forfait Weekend Complet",
    prix: "25 000 Ar",
    unite: "/ 2 jours",
    description:
      "Le programme complet du samedi au dimanche pour repartir avec une pièce terminée.",
    inclus: [
      "Matériel crochet complet fourni (aiguille, laine, ciseaux, marqueurs, ruban)",
      "Groupe limité à 10 personnes",
      "Suivi jusqu'à la finition de votre pièce",
    ],
    accent: true,
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

const faq = [
  {
    q: "Faut-il déjà savoir crocheter pour s'inscrire ?",
    r: "Non. La formation est ouverte aux débutantes complètes : nous commençons par le point de base et la tenue du fil avant d'aborder le granny square.",
  },
  {
    q: "Le matériel est-il fourni ?",
    r: "Oui, pour le forfait weekend complet, tout le matériel (aiguille, laine, ciseaux, marqueurs, ruban) est inclus. Pour une séance à la carte, le matériel de base est prêté sur place.",
  },
  {
    q: "Combien de personnes par session ?",
    r: "Les groupes sont volontairement limités à 10 personnes maximum, pour un encadrement individuel de qualité.",
  },
  {
    q: "Où se déroule la formation ?",
    r: "Les sessions ont lieu sur place à Nosy Be. L'adresse exacte est communiquée après réservation par WhatsApp ou Messenger.",
  },
  {
    q: "Puis-je choisir le modèle que je veux réaliser ?",
    r: "Oui, une fois les bases acquises, vous choisissez votre modèle : culotte, soutif, top, robe, short, sac ou chapeau.",
  },
];

export default function FormationPage() {
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
          <p className={styles.eyebrow}>Art Jatie — Nosy Be</p>
          <h1 className={styles.h1}>
            Apprenez le crochet, point par point, jusqu&apos;à{" "}
            <em>votre propre création</em>
          </h1>
          <p className={styles.heroLead}>
            Une formation en petit groupe à Nosy Be, pensée pour les
            débutantes : vous repartez avec une technique solide et une
            pièce faite de vos mains.
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
              {f.accent && (
                <span className={styles.badge}>La plus choisie</span>
              )}
              <h3 className={styles.h3}>{f.nom}</h3>
              <p className={styles.prix}>
                {f.prix}
                <span className={styles.prixUnite}>{f.unite}</span>
              </p>
              <p>{f.description}</p>
              <ul className={styles.inclusList}>
                {f.inclus.map((inc) => (
                  <li key={inc}>{inc}</li>
                ))}
              </ul>
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

      <ChainDivider />

      {/* TEMOIGNAGES */}
      <section className={styles.section}>
        <SectionHeader num="05" tag="Témoignages" />
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
        <SectionHeader num="06" tag="En images" />
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
        <SectionHeader num="07" tag="Questions fréquentes" />
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
          <span className={styles.sectionNum}>08</span>
          <span className={styles.sectionLine}></span>
          <span className={styles.sectionTag}>Réservation</span>
        </div>
        <h2 className={styles.sectionTitle}>
          Prête à créer votre première pièce ?
        </h2>
        <p>
          Les places sont limitées à 10 personnes par session, à Nosy Be.
          Réservez votre créneau dès maintenant.
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