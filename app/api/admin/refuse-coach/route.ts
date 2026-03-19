import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getMailer, getFromAddress } from "@/lib/mailer";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();

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

try {
const mailer = getMailer();

await mailer.sendMail({
from: getFromAddress(),
to: coachEmail,
subject: "Votre demande de compte entraîneur a été refusée",
text: `Bonjour ${coachName},

Votre demande de création de compte entraîneur a été refusée.

Si vous pensez qu'il s'agit d'une erreur, merci de contacter le club.

Sportivement,
Volley Ball Club Mundolsheim`,
html: `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
<h2>Bonjour ${coachName},</h2>
<p>Votre demande de création de compte entraîneur a été <strong>refusée</strong>.</p>
<p>Si vous pensez qu'il s'agit d'une erreur, merci de contacter le club.</p>
<p>Sportivement,<br/>Volley Ball Club Mundolsheim</p>
</div>
`
});
} catch (mailError) {
console.error("Email de refus non envoyé :", mailError);
}

return NextResponse.json({
success: true,
message: "La demande a été refusée et le compte a été supprimé."
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
