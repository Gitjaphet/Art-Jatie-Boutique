import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  // Redirige automatiquement tout visiteur de /admin vers /admin/login
  redirect("/admin/login");
}
