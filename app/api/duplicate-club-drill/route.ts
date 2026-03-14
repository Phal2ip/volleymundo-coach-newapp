import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clubDrillId, coachId } = body;

    if (!clubDrillId || !coachId) {
      return NextResponse.json(
        { error: "clubDrillId et coachId sont obligatoires." },
        { status: 400 }
      );
    }

    const { data: clubDrill, error: fetchError } = await supabase
      .from("club_drills")
      .select("*")
      .eq("id", clubDrillId)
      .single();

    if (fetchError || !clubDrill) {
      return NextResponse.json(
        { error: "Exercice club introuvable." },
        { status: 404 }
      );
    }

    const { error: insertError } = await supabase.from("user_drills").insert({
      coach_id: coachId,
      club_drill_id: clubDrill.id,
      title: clubDrill.title,
      description: clubDrill.description,
      category: clubDrill.category,
      level: clubDrill.level,
      theme: clubDrill.theme,
      duration: clubDrill.duration,
      material: clubDrill.material
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}