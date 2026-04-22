"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./ContactPage.module.css";

/* ============================================================
   TYPES
   ============================================================ */
type Category =
  | ""
  | "commande"
  | "collection"
  | "livraison"
  | "collaboration"
  | "autre";

interface FormState {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  sujet: Category;
  message: string;
  rgpd: boolean;
}

const INITIAL_FORM: FormState = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  sujet: "",
  message: "",
  rgpd: false,
};

/* ============================================================
   ICÔNES
   ============================================================ */
function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconLocation({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */
export default function ContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rgpd) return;
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1400));

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroOrb1} aria-hidden="true" />
        <div className={styles.heroOrb2} aria-hidden="true" />

        <p className={styles.heroEyebrow}>
          <span className={styles.eyebrowLine} aria-hidden="true" />
          Art Jatie · Madagascar
          <span className={styles.eyebrowLine} aria-hidden="true" />
        </p>

        <div className={styles.heroTitleWrap}>
          <h1 className={styles.heroTitle}>Contactez-nous</h1>
          <span className={styles.heroUnderline} aria-hidden="true" />
        </div>

        <p className={styles.heroSub}>
          Une question, une commande sur mesure ou simplement envie d&apos;en
          savoir plus ? Nous vous répondons avec plaisir.
        </p>
      </header>

      <div className={styles.separator} aria-hidden="true">
        <span className={styles.separatorLine} />
        <span className={styles.separatorDot} />
        <span className={styles.separatorDot} />
        <span className={styles.separatorDot} />
        <span className={styles.separatorLine} />
      </div>

      <main className={styles.main}>
        <div className={styles.infoCol}>
          <p className={styles.infoHeading}>Nous trouver</p>
          <h2 className={styles.infoTitle}>Toujours à votre écoute</h2>
          <div className={styles.infoDivider} aria-hidden="true" />
          <p className={styles.infoDesc}>
            Atelier artisanal basé à Nosy Be, Madagascar. Chaque création est
            réalisée à la main avec soin et passion. N&apos;hésitez pas à nous
            contacter pour une commande sur mesure, des informations sur nos
            collections ou toute autre demande.
          </p>

          <div className={styles.contactBlocks}>
            <a
              href="mailto:contact@artjatie.mg"
              className={styles.contactBlock}
            >
              <div className={styles.contactBlockBg} aria-hidden="true" />
              <div className={styles.contactIcon}>
                <IconMail className={styles.contactIconSvg} />
              </div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Email</span>
                <span className={styles.contactValue}>contact@artjatie.mg</span>
              </div>
            </a>

            <a href="tel:+261343051360" className={styles.contactBlock}>
              <div className={styles.contactBlockBg} aria-hidden="true" />
              <div className={styles.contactIcon}>
                <IconPhone className={styles.contactIconSvg} />
              </div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>
                  Téléphone & WhatsApp
                </span>
                <span className={styles.contactValue}>+261 34 30 513 60</span>
              </div>
            </a>

            <div className={styles.contactBlock} style={{ cursor: "default" }}>
              <div className={styles.contactBlockBg} aria-hidden="true" />
              <div className={styles.contactIcon}>
                <IconLocation className={styles.contactIconSvg} />
              </div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Adresse</span>
                <span className={styles.contactValue}>
                  Seganinga, Nosy Be
                  <br />
                  Madagascar
                </span>
              </div>
            </div>
          </div>

          <div className={styles.socialRow}>
            <a
              href="https://facebook.com/artjatie"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="Facebook Art Jatie"
            >
              <div className={styles.socialBtnFill} aria-hidden="true" />
              <span className={styles.socialBtnInner}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                Facebook
              </span>
            </a>

            <a
              href="https://tiktok.com/@artjatie"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="TikTok Art Jatie"
            >
              <div className={styles.socialBtnFill} aria-hidden="true" />
              <span className={styles.socialBtnInner}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
                TikTok
              </span>
            </a>

            <a
              href="https://wa.me/261343051360"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="WhatsApp Art Jatie"
            >
              <div className={styles.socialBtnFill} aria-hidden="true" />
              <span className={styles.socialBtnInner}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                WhatsApp
              </span>
            </a>
          </div>

          <div className={styles.horaireCard}>
            <div className={styles.horaireCardBar} aria-hidden="true" />
            <p className={styles.horaireTitle}>Disponibilité</p>
            <div className={styles.horaireRow}>
              <span className={styles.horaireDay}>Lundi – Vendredi</span>
              <span className={styles.horaireTime}>08h00 – 18h00</span>
            </div>
            <div className={styles.horaireRow}>
              <span className={styles.horaireDay}>Samedi</span>
              <span className={styles.horaireTime}>09h00 – 15h00</span>
            </div>
            <div className={styles.horaireRow}>
              <span className={styles.horaireDay}>Dimanche</span>
              <span className={styles.horaireClosed}>Sur rendez-vous</span>
            </div>
          </div>
        </div>

        <div className={styles.formCol}>
          <div className={styles.formTopBar} aria-hidden="true" />
          <div className={styles.formOrb} aria-hidden="true" />

          {submitted ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <IconCheck />
              </div>
              <h3 className={styles.successTitle}>Message envoyé !</h3>
              <p className={styles.successText}>
                Merci pour votre message. Nous vous répondrons dans les plus
                brefs délais, généralement sous 24 heures.
              </p>
              <button
                className={styles.successBack}
                onClick={() => {
                  setSubmitted(false);
                  setForm(INITIAL_FORM);
                }}
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className={styles.formHeading}>Envoyez-nous un message</h2>
              <p className={styles.formSubheading}>
                Réponse sous 24 heures ouvrées
              </p>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="prenom">
                    Prénom *
                  </label>
                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    className={styles.formInput}
                    placeholder="Marie"
                    value={form.prenom}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="nom">
                    Nom *
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    className={styles.formInput}
                    placeholder="Dupont"
                    value={form.nom}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="email">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={styles.formInput}
                    placeholder="marie@exemple.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="telephone">
                    Téléphone
                  </label>
                  <input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    className={styles.formInput}
                    placeholder="+261 34 00 000 00"
                    value={form.telephone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="sujet">
                  Sujet *
                </label>
                <select
                  id="sujet"
                  name="sujet"
                  className={styles.formSelect}
                  value={form.sujet}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Choisissez un sujet...
                  </option>
                  <option value="commande">Commande sur mesure</option>
                  <option value="collection">
                    Question sur une collection
                  </option>
                  <option value="livraison">Livraison & tarifs</option>
                  <option value="collaboration">
                    Collaboration / Partenariat
                  </option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="message">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  className={styles.formTextarea}
                  placeholder="Décrivez votre demande, vos mensurations pour une commande sur mesure, ou toute information utile..."
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  id="rgpd"
                  name="rgpd"
                  type="checkbox"
                  checked={form.rgpd}
                  onChange={handleChange}
                  required
                />
                <label className={styles.checkboxLabel} htmlFor="rgpd">
                  J&apos;accepte que mes données soient utilisées pour traiter
                  ma demande conformément à la{" "}
                  <Link href="/confidentialite">
                    politique de confidentialité
                  </Link>{" "}
                  d&apos;Art Jatie.
                </label>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || !form.rgpd}
              >
                <div className={styles.submitBtnFill} aria-hidden="true" />
                <span className={styles.submitBtnContent}>
                  {loading ? (
                    <>
                      <span className={styles.loader} aria-hidden="true" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Envoyer le message
                      <svg
                        className={styles.submitArrow}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>
          )}
        </div>
      </main>

      <div className={styles.mapStrip}>
        <div className={styles.mapInfo}>
          <p className={styles.mapEyebrow}>Notre localisation</p>
          <h3 className={styles.mapTitle}>Nosy Be, Madagascar</h3>
          <p className={styles.mapAddress}>
            Seganinga, Nosy Be
            <br />
            Madagascar
            <br />
            <br />
            contact@artjatie.mg
            <br />
            +261 34 30 513 60
          </p>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapLink}
          >
            <div className={styles.mapLinkFill} aria-hidden="true" />
            <span className={styles.mapLinkText}>Voir sur Google Maps →</span>
          </a>
        </div>

        <div className={styles.mapVisual} aria-hidden="true">
          <div className={styles.mapGrid} />
          <div className={styles.mapPinWrap}>
            <div className={styles.mapPinRing}>
              <div className={styles.mapRing1} />
              <div className={styles.mapRing2} />
              <svg className={styles.mapPinSvg} viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className={styles.mapPinLabel}>Nosy Be · Madagascar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
