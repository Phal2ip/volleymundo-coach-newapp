import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const itemId = formData.get("itemId") as string;
    const sessionId = formData.get("sessionId") as string;

    if (!itemId || !sessionId) {
      return NextResponse.json(
        { error: "L'élément et la séance sont obligatoires." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("session_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      new URL(`/entrainements/${sessionId}?message=deleted`, request.url)
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}