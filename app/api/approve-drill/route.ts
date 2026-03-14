import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Drill = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  theme: string;
  duration: number;
  material: string;
};

type SubmissionRow = {
  id: string;
  status: string;
  user_drills: Drill | Drill[] | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submissionId = body.submissionId as string | undefined;

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId manquant." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("drill_submissions")
      .select(`
        id,
        status,
        user_drills (
          id,
          title,
          description,
          category,
          level,
          theme,
          duration,
          material
        )
      `)
      .eq("id", submissionId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Proposition introuvable." },
        { status: 404 }
      );
    }

    const submission = data as SubmissionRow;
    const drill = Array.isArray(submission.user_drills)
      ? submission.user_drills[0] ?? null
      : submission.user_drills;

    if (!drill) {
      return NextResponse.json(
        { error: "Exercice lié introuvable." },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase.from("club_drills").insert({
      title: drill.title,
      description: drill.description,
      category: drill.category,
      level: drill.level,
      theme: drill.theme,
      duration: drill.duration,
      material: drill.material
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("drill_submissions")
      .update({ status: "approved" })
      .eq("id", submissionId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Exercice approuvé et ajouté à la base club."
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}