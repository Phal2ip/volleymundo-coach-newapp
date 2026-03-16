import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();

const body = await request.json();

const coachId = body.coachId as string | undefined;
const newRole = body.newRole as string | undefined;
const currentUserId = body.currentUserId as string | undefined;
const currentUserEmail = body.currentUserEmail as string | undefined;

if (!coachId || !newRole) {
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

let currentUser: {
id: string;
email: string;
role: string;
status: string;
} | null = null;

if (currentUserId) {
const { data } = await supabaseAdmin
.from("coaches")
.select("id, email, role, status")
.eq("id", currentUserId)
.maybeSingle();

if (data) currentUser = data;
}

if (!currentUser && currentUserEmail) {
const { data } = await supabaseAdmin
.from("coaches")
.select("id, email, role, status")
.eq("email", currentUserEmail)
.maybeSingle();

if (data) currentUser = data;
}

if (!currentUser) {
return NextResponse.json(
{
error: "Utilisateur admin introuvable.",
debug: {
receivedCurrentUserId: currentUserId ?? null,
receivedCurrentUserEmail: currentUserEmail ?? null
}
},
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
const { count, error: countError } = await supabaseAdmin
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

const { data: targetCoach } = await supabaseAdmin
.from("coaches")
.select("id")
.eq("id", coachId)
.maybeSingle();

if ((count ?? 0) <= 1 && targetCoach) {
return NextResponse.json(
{ error: "Impossible de retirer le dernier administrateur actif." },
{ status: 400 }
);
}
}

const { error: updateError } = await supabaseAdmin
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
} catch (error) {
return NextResponse.json(
{
error:
error instanceof Error ? error.message : "Erreur serveur."
},
{ status: 500 }
);
}
}
