import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const sessionId = formData.get("sessionId") as string;
    const userDrillId = formData.get("userDrillId") as string;
    const position = Number(formData.get("position"));
    const plannedDuration = Number(formData.get("plannedDuration"));
    const notes = formData.get("notes") as string;

    if (!sessionId || !userDrillId) {
      return NextResponse.json(
        { error: "La séance et l'exercice sont obligatoires." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("session_items").insert({
      session_id: sessionId,
      user_drill_id: userDrillId,
      position: position || 1,
      planned_duration: plannedDuration || null,
      notes: notes || null
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      new URL(`/entrainements/${sessionId}`, request.url)
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}