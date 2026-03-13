import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userDrillId, coachId } = body;

    if (!userDrillId || !coachId) {
      return NextResponse.json(
        { error: "userDrillId et coachId sont obligatoires." },
        { status: 400 }
      );
    }

    const { data: existingSubmission, error: existingError } = await supabase
      .from("drill_submissions")
      .select("id, status")
      .eq("user_drill_id", userDrillId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Cet exercice a déjà été proposé au club." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("drill_submissions").insert({
      user_drill_id: userDrillId,
      submitted_by: coachId,
      status: "pending"
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
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