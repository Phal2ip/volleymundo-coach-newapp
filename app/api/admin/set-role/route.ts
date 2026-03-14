import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const coachId = body.coachId as string | undefined;
    const newRole = body.newRole as string | undefined;
    const currentUserEmail = body.currentUserEmail as string | undefined;

    if (!coachId || !newRole || !currentUserEmail) {
      return NextResponse.json(
        { error: "Paramètres manquants." },
        { status: 400 }
      );
    }

    if (!["coach", "admin"].includes(newRole)) {
      return NextResponse.json(
        { error: "Rôle invalide." },
        { status: 400 }
      );
    }

    const { data: currentUser, error: currentUserError } = await supabase
      .from("coaches")
      .select("id, email, role")
      .eq("email", currentUserEmail)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: "Utilisateur admin introuvable." },
        { status: 403 }
      );
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Action réservée aux administrateurs." },
        { status: 403 }
      );
    }

    if (currentUser.id === coachId && newRole !== "admin") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas retirer votre propre rôle admin." },
        { status: 400 }
      );
    }

    if (newRole !== "admin") {
      const { count, error: countError } = await supabase
        .from("coaches")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("status", "active");

      if (countError) {
        return NextResponse.json(
          { error: countError.message },
          { status: 500 }
        );
      }

      if ((count ?? 0) <= 1) {
        const { data: targetCoach } = await supabase
          .from("coaches")
          .select("id")
          .eq("id", coachId)
          .single();

        if (targetCoach) {
          return NextResponse.json(
            { error: "Impossible de retirer le dernier administrateur actif." },
            { status: 400 }
          );
        }
      }
    }

    const { error: updateError } = await supabase
      .from("coaches")
      .update({ role: newRole })
      .eq("id", coachId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        newRole === "admin"
          ? "Le compte est maintenant administrateur."
          : "Le compte est repassé en coach."
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}