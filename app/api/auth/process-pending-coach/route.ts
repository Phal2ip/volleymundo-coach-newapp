import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getMailer, getFromAddress } from "@/lib/mailer";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();
const { coachId } = await request.json();

if (!coachId) {
return NextResponse.json(
{ error: "coachId manquant." },
{ status: 400 }
);
}

const { data: coach, error: coachError } = await supabaseAdmin
.from("coaches")
.select("*")
.eq("id", coachId)
.single();

if (coachError || !coach) {
return NextResponse.json(
{ error: "Coach introuvable." },
{ status: 404 }
);
}

if (coach.status !== "pending") {
return NextResponse.json({
success: true,
message: "Aucune action nécessaire."
});
}

const { data: authUsers, error: listUsersError } =
await supabaseAdmin.auth.admin.listUsers();

if (listUsersError) {
return NextResponse.json(
{ error: listUsersError.message },
{ status: 500 }
);
}

const authUser = authUsers.users.find(
(user) => user.email?.toLowerCase() === coach.email?.toLowerCase()
);

if (!authUser) {
return NextResponse.json(
{ error: "Utilisateur Auth introuvable." },
{ status: 404 }
);
}

const isEmailConfirmed = Boolean(authUser.email_confirmed_at);

if (!isEmailConfirmed) {
return NextResponse.json({
success: true,
message: "Email non encore confirmé."
});
}

const { error: updateConfirmedError } = await supabaseAdmin
.from("coaches")
.update({ email_confirmed: true })
.eq("id", coach.id);

if (updateConfirmedError) {
return NextResponse.json(
{ error: updateConfirmedError.message },
{ status: 500 }
);
}

if (!coach.admin_notified) {
const { data: admins, error: adminsError } = await supabaseAdmin
.from("coaches")
.select("email")
.eq("role", "admin")
.eq("status", "active");

if (!adminsError && admins && admins.length > 0) {
const adminEmails = admins
.map((admin) => admin.email)
.filter(Boolean)
.join(",");

try {
const mailer = getMailer();

await mailer.sendMail({
from: getFromAddress(),
to: adminEmails,
subject: "Nouvelle demande de compte coach",
text: `Bonjour,

Une nouvelle demande de création de compte entraîneur a été confirmée par email.

Nom : ${coach.name}
Email : ${coach.email}

Connectez-vous à l'application pour valider ou refuser cette demande.

Sportivement,
Volley Ball Club Mundolsheim`,
html: `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
<h2>Nouvelle demande de compte coach</h2>
<p>Une nouvelle demande de création de compte entraîneur a bien été <strong>confirmée par email</strong>.</p>
<p><strong>Nom :</strong> ${coach.name}</p>
<p><strong>Email :</strong> ${coach.email}</p>
<p>Connectez-vous à l'application pour valider ou refuser cette demande.</p>
<p>Sportivement,<br/>Volley Ball Club Mundolsheim</p>
</div>
`
});
} catch (mailError) {
console.error("Email admin non envoyé :", mailError);
}
}

const { error: updateNotifiedError } = await supabaseAdmin
.from("coaches")
.update({ admin_notified: true })
.eq("id", coach.id);

if (updateNotifiedError) {
return NextResponse.json(
{ error: updateNotifiedError.message },
{ status: 500 }
);
}
}

return NextResponse.json({
success: true,
message: "Demande transmise aux administrateurs."
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