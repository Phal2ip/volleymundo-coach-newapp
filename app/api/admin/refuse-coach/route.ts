import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
return NextResponse.json(
{ error: "RESEND_API_KEY manquante." },
{ status: 500 }
);
}

const resend = new Resend(resendApiKey);

const body = await request.json();
const coachId = body.coachId as string | undefined;

if (!coachId) {
return NextResponse.json(
{ error: "coachId manquant." },
{ status: 400 }
);
}

const { data: coach, error: coachError } = await supabaseAdmin
.from("coaches")
.select("id, name, email")
.eq("id", coachId)
.single();

if (coachError || !coach) {
return NextResponse.json(
{ error: "Coach introuvable." },
{ status: 404 }
);
}

const coachEmail = coach.email;
const coachName = coach.name;

const emailResult = await resend.emails.send({
from: "onboarding@resend.dev",
to: coachEmail,
subject: "Votre demande de compte coach a été refusée",
html: `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
<h2>Bonjour ${coachName},</h2>
<p>Votre demande de création de compte entraîneur a été <strong>refusée</strong>.</p>
<p>Si vous pensez qu'il s'agit d'une erreur, merci de contacter le club.</p>
<p>Sportivement,<br/>Volley Ball Club Mundolsheim</p>
</div>
`
});

if (emailResult.error) {
return NextResponse.json(
{
error: "Impossible d'envoyer l'email de refus.",
details: emailResult.error.message
},
{ status: 500 }
);
}

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
message: "La demande a été refusée, l'email envoyé et le compte supprimé."
});
} catch (error) {
return NextResponse.json(
{ error: error instanceof Error ? error.message : "Erreur serveur." },
{ status: 500 }
);
}
}