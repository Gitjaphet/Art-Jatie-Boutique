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
            <a href="mailto:contact@artjatie.com" className={styles.contactBlock}>
                <div className={styles.contactBlockBg} aria-hidden="true" />
                <div className={styles.contactIcon}>
                <IconMail className={styles.contactIconSvg} />
                </div>
                <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Email</span>
                <span className={styles.contactValue}>contact@artjatie.com</span>
                </div>
            </a>

            <a href="tel:+261320251270" className={styles.contactBlock}>
                <div className={styles.contactBlockBg} aria-hidden="true" />
                <div className={styles.contactIcon}>
                <IconPhone className={styles.contactIconSvg} />
                </div>
                <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Téléphone</span>
                <span className={styles.contactValue}>+261 32 02 251 70</span>
                </div>
            </a>

            
                <a href="https://wa.me/261343051360"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactBlock}
            >
                <div className={styles.contactBlockBg} aria-hidden="true" />
                <div className={styles.contactIcon}>
                <svg
                    className={styles.contactIconSvg}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.121 1.535 5.856L.057 23.882a.5.5 0 00.606.61l6.208-1.625A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.003-1.368l-.36-.214-3.706.972.988-3.613-.235-.372A9.789 9.789 0 012.182 12C2.182 6.575 6.575 2.182 12 2.182c5.424 0 9.818 4.393 9.818 9.818 0 5.424-4.394 9.818-9.818 9.818z" />
                </svg>
                </div>
                <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>WhatsApp</span>
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
              href="https://www.facebook.com/profile.php?id=61588409926655"
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
              href="https://www.tiktok.com/@jatieart"
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
            contact@artjatie.com
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
