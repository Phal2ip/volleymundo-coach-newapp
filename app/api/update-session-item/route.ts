import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const itemId = formData.get("itemId") as string;
    const sessionId = formData.get("sessionId") as string;
    const position = Number(formData.get("position"));
    const plannedDuration = Number(formData.get("plannedDuration"));
    const notes = formData.get("notes") as string;

    if (!itemId || !sessionId) {
      return NextResponse.json(
        { error: "L'élément et la séance sont obligatoires." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("session_items")
      .update({
        position: position || 1,
        planned_duration: plannedDuration || null,
        notes: notes || null
      })
      .eq("id", itemId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      new URL(`/entrainements/${sessionId}?message=updated`, request.url)
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}