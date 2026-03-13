import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      coachId,
      title,
      description,
      category,
      level,
      theme,
      duration,
      material
    } = body;

    if (!coachId || !title) {
      return NextResponse.json(
        { error: "Le coach et le titre sont obligatoires." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("user_drills").insert({
      coach_id: coachId,
      title,
      description,
      category,
      level,
      theme,
      duration,
      material
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}