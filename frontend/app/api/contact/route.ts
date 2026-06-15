import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // false pour 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prenom, nom, email, telephone, sujet, message } = body;

    if (!prenom || !nom || !email || !sujet || !message) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const sujetLabels: Record<string, string> = {
      commande: "Commande sur mesure",
      collection: "Question sur une collection",
      livraison: "Livraison & tarifs",
      collaboration: "Collaboration / Partenariat",
      autre: "Autre",
    };

    await transporter.sendMail({
      from: `"Site Art Jatie" <${process.env.SMTP_USER}>`,
      to: "contact@artjatie.com",
      replyTo: email,
      subject: `[${sujetLabels[sujet] ?? sujet}] Message de ${prenom} ${nom}`,
      html: `
        <h2>Nouveau message depuis le site Art Jatie</h2>
        <p><strong>Nom :</strong> ${prenom} ${nom}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${telephone || "Non renseigné"}</p>
        <p><strong>Sujet :</strong> ${sujetLabels[sujet] ?? sujet}</p>
        <p><strong>Message :</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}