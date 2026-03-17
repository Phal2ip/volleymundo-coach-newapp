import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();
const body = await request.json();

const coachId = body.coachId as string | undefined;
const currentUserId = body.currentUserId as string | undefined;

if (!coachId || !currentUserId) {
return NextResponse.json(
{ error: "Paramètres manquants." },
{ status: 400 }
);
}

const { data: currentUser, error: currentUserError } = await supabaseAdmin
.from("coaches")
.select("id, role")
.eq("id", currentUserId)
.single();

if (currentUserError || !currentUser || currentUser.role !== "admin") {
return NextResponse.json(
{ error: "Action réservée aux administrateurs." },
{ status: 403 }
);
}

const { data: targetCoach, error: targetError } = await supabaseAdmin
.from("coaches")
.select("id, email, role, status, is_protected")
.eq("id", coachId)
.single();

if (targetError || !targetCoach) {
return NextResponse.json(
{ error: "Compte introuvable." },
{ status: 404 }
);
}

if (targetCoach.is_protected) {
return NextResponse.json(
{ error: "Ce compte protégé ne peut pas être supprimé." },
{ status: 400 }
);
}

if (targetCoach.status !== "disabled") {
return NextResponse.json(
{ error: "Le compte doit être désactivé avant suppression." },
{ status: 400 }
);
}

if (targetCoach.id === currentUserId) {
return NextResponse.json(
{ error: "Vous ne pouvez pas supprimer votre propre compte." },
{ status: 400 }
);
}

if (targetCoach.role === "admin") {
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

if ((count ?? 0) <= 1) {
return NextResponse.json(
{ error: "Impossible de supprimer le dernier administrateur actif." },
{ status: 400 }
);
}
}

const coachEmail = targetCoach.email;

const { error: deleteCoachError } = await supabaseAdmin
.from("coaches")
.delete()
.eq("id", coachId);

if (deleteCoachError) {
return NextResponse.json(
{ error: deleteCoachError.message },
{ status: 500 }
);
}

const { data: authUsers, error: listUsersError } =
await supabaseAdmin.auth.admin.listUsers();

if (listUsersError) {
return NextResponse.json(
{ error: listUsersError.message },
{ status: 500 }
);
}

const authUser = authUsers.users.find((user) => user.email === coachEmail);

if (authUser) {
const { error: deleteAuthError } =
await supabaseAdmin.auth.admin.deleteUser(authUser.id);

if (deleteAuthError) {
return NextResponse.json(
{ error: deleteAuthError.message },
{ status: 500 }
);
}
}

return NextResponse.json({
success: true,
message: "Le compte a été supprimé définitivement."
});
} catch (error) {
return NextResponse.json(
{ error: error instanceof Error ? error.message : "Erreur serveur." },
{ status: 500 }
);
}
}
