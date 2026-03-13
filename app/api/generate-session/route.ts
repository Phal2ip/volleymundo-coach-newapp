import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, coachId, category, theme, targetDuration } = body;

    if (!sessionId || !coachId || !targetDuration) {
      return NextResponse.json(
        { error: "sessionId, coachId et targetDuration sont obligatoires." },
        { status: 400 }
      );
    }

    const { data: drills, error: drillsError } = await supabase
      .from("user_drills")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });

    if (drillsError) {
      return NextResponse.json(
        { error: drillsError.message },
        { status: 500 }
      );
    }

    const allDrills = drills || [];

    const filtered = allDrills.filter((drill) => {
      const categoryMatch = category
        ? (drill.category || "").toLowerCase().includes(category.toLowerCase())
        : true;

      const themeMatch = theme
        ? (drill.theme || "").toLowerCase().includes(theme.toLowerCase())
        : true;

      return categoryMatch || themeMatch;
    });

    const source = filtered.length ? filtered : allDrills;

    if (!source.length) {
      return NextResponse.json(
        { error: "Aucun exercice disponible pour générer la séance." },
        { status: 400 }
      );
    }

    let total = 0;
    let position = 1;
    const selectedItems: any[] = [];

    for (const drill of source) {
      const duration = drill.duration || 10;

      if (total >= targetDuration) break;

      selectedItems.push({
        session_id: sessionId,
        user_drill_id: drill.id,
        position,
        planned_duration: duration,
        notes: `Ajout automatique (${theme || "séance générale"})`
      });

      total += duration;
      position += 1;
    }

    if (!selectedItems.length) {
      return NextResponse.json(
        { error: "Impossible de générer la séance." },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase
      .from("session_items")
      .insert(selectedItems);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted: selectedItems.length,
      totalDuration: total
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}