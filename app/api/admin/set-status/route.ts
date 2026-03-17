import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();
const body = await request.json();

const coachId = body.coachId as string | undefined;
const newStatus = body.newStatus as string | undefined;
const currentUserId = body.currentUserId as string | undefined;

if (!coachId || !newStatus || !currentUserId) {
return NextResponse.json(
{ error: "Paramètres manquants." },
{ status: 400 }
);
}

if (!["active", "disabled"].includes(newStatus)) {
return NextResponse.json(
{ error: "Statut invalide." },
{ status: 400 }
);
}

const { data: currentUser, error: currentUserError } = await supabaseAdmin
.from("coaches")
.select("id, role")
.eq("id", currentUserId)
.single();

if (currentUserError || !currentUser) {
return NextResponse.json(
{ error: "Administrateur introuvable." },
{ status: 403 }
);
}

if (currentUser.role !== "admin") {
return NextResponse.json(
{ error: "Action réservée aux administrateurs." },
{ status: 403 }
);
}

const { data: targetCoach, error: targetError } = await supabaseAdmin
.from("coaches")
.select("id, name, email, status, is_protected")
.eq("id", coachId)
.single();

if (targetError || !targetCoach) {
return NextResponse.json(
{ error: "Compte introuvable." },
{ status: 404 }
);
}

if (targetCoach.is_protected && newStatus === "disabled") {
return NextResponse.json(
{ error: "Ce compte protégé ne peut pas être désactivé." },
{ status: 400 }
);
}

if (targetCoach.id === currentUserId && newStatus === "disabled") {
return NextResponse.json(
{ error: "Vous ne pouvez pas désactiver votre propre compte." },
{ status: 400 }
);
}

const { error: updateError } = await supabaseAdmin
.from("coaches")
.update({ status: newStatus })
.eq("id", coachId);

if (updateError) {
return NextResponse.json(
{ error: updateError.message },
{ status: 500 }
);
}

return NextResponse.json({
success: true,
message: newStatus === "active" ? "Compte réactivé." : "Compte désactivé."
});
} catch (error) {
return NextResponse.json(
{
error: error instanceof Error ? error.message : "Erreur serveur."
},
{ status: 500 }
);
}
}