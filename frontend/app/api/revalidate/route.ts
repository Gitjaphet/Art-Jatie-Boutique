import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Secret invalide" }, { status: 401 });
  }

  if (!body.path) {
    return NextResponse.json({ message: "Le paramètre path est requis" }, { status: 400 });
  }

  revalidatePath(body.path);
  return NextResponse.json({ revalidated: true, path: body.path });
}