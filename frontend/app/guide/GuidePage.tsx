import Link from "next/link";
import Image from "next/image";
import styles from "./GuidePage.module.css";

export default function GuideDesTailles() {
  return (
    <div className={styles.pageWrap}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/">Accueil</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Guide des Tailles</span>
      </nav>

      <div className={styles.container}>
        {/* HERO SECTION */}
        <header className={styles.hero}>
          <span className={styles.heroEyebrow}>Aide & Conseils</span>
          <h1 className={styles.heroTitle}>
            Trouver votre <em>taille idéale</em>
          </h1>
          <p className={styles.heroSub}>
            Parce que chaque corps est une œuvre d&apos;art unique, nous vous
            aidons à choisir la coupe qui sublimera votre silhouette avec élégance
            et confort.
          </p>
        </header>

        {/* HOW TO MEASURE SECTION */}
        <section className={styles.measureGrid}>
          <div className={styles.measureImageWrap}>
            <img
                src="/images/guide/guide-taille.png"
                alt="Guide de mesure silhouette"
                className={styles.measureImage}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            </div>
          <div className={styles.measureContent}>
            <h2>Comment se mesurer ?</h2>
            
            <div className={styles.measureStep}>
              <div className={styles.stepNum}>1</div>
              <div className={styles.stepText}>
                <strong>Tour de Poitrine</strong>
                <p>Mesurez horizontalement au point le plus large de la poitrine, en gardant le ruban bien droit dans le dos.</p>
              </div>
            </div>
            
            <div className={styles.measureStep}>
              <div className={styles.stepNum}>2</div>
              <div className={styles.stepText}>
                <strong>Tour de Taille</strong>
                <p>Mesurez au creux de votre taille (la partie la plus mince), généralement juste au-dessus du nombril.</p>
              </div>
            </div>
            
            <div className={styles.measureStep}>
              <div className={styles.stepNum}>3</div>
              <div className={styles.stepText}>
                <strong>Tour de Bassin</strong>
                <p>Mesurez au point le plus large de vos hanches, en passant par le sommet de vos fessiers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TABLE: VÊTEMENTS */}
        <section>
          <div className={styles.sectionHeader}>
            <h2>Prêt-à-porter <em>(Tenues & Robes)</em></h2>
            <p>Ces mesures correspondent aux dimensions du corps en centimètres.</p>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Taille</th>
                  <th>Standard (FR)</th>
                  <th>Poitrine (cm)</th>
                  <th>Taille (cm)</th>
                  <th>Bassin (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.sizeTag}>XS</td>
                  <td>34</td>
                  <td>80-84</td>
                  <td>62-66</td>
                  <td>86-90</td>
                </tr>
                <tr>
                  <td className={styles.sizeTag}>S</td>
                  <td>36</td>
                  <td>84-88</td>
                  <td>66-70</td>
                  <td>90-94</td>
                </tr>
                <tr>
                  <td className={styles.sizeTag}>M</td>
                  <td>38-40</td>
                  <td>88-92</td>
                  <td>70-74</td>
                  <td>94-98</td>
                </tr>
                <tr>
                  <td className={styles.sizeTag}>L</td>
                  <td>42</td>
                  <td>92-96</td>
                  <td>74-78</td>
                  <td>98-102</td>
                </tr>
                <tr>
                  <td className={styles.sizeTag}>XL</td>
                  <td>44</td>
                  <td>96-100</td>
                  <td>78-82</td>
                  <td>102-106</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* TABLE: MAILLOTS */}
        <section>
          <div className={styles.sectionHeader}>
            <h2>Maillots de Bain</h2>
            <p>Nos maillots en crochet sont extensibles pour s&apos;adapter à vos courbes.</p>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Taille</th>
                  <th>Bonnet Suggéré</th>
                  <th>Tour de Dos</th>
                  <th>Hanches</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.sizeTag}>S</td>
                  <td>A / B</td>
                  <td>80-85</td>
                  <td>85-92 cm</td>
                </tr>
                <tr>
                  <td className={styles.sizeTag}>M</td>
                  <td>B / C</td>
                  <td>85-90</td>
                  <td>92-98 cm</td>
                </tr>
                <tr>
                  <td className={styles.sizeTag}>L</td>
                  <td>C / D</td>
                  <td>90-95</td>
                  <td>98-105 cm</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FOOTER ADVICE */}
        <footer className={styles.adviceBox}>
          <div className={styles.adviceContent}>
            <h3>Un doute entre deux tailles ?</h3>
            <p>
              Si vous êtes entre deux tailles, nous vous conseillons de choisir la 
              taille supérieure pour les tenues ajustées, ou de nous contacter pour 
              un conseil entièrement personnalisé.
            </p>
          </div>
          <a 
            href="https://wa.me/261343051380" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.btnWa}
          >
            Conseil Personnalisé
          </a>
        </footer>
      </div>
    </div>
  );
}