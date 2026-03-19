import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getMailer, getFromAddress } from "@/lib/mailer";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();
const { authUserId } = await request.json();

if (!authUserId) {
return NextResponse.json(
{ error: "authUserId manquant." },
{ status: 400 }
);
}

const { data: authData, error: authError } =
await supabaseAdmin.auth.admin.getUserById(authUserId);

if (authError || !authData?.user) {
return NextResponse.json(
{ error: "Utilisateur Auth introuvable." },
{ status: 404 }
);
}

const authUser = authData.user;
const email = authUser.email;

if (!email) {
return NextResponse.json(
{ error: "Email introuvable." },
{ status: 400 }
);
}

const emailConfirmed = Boolean(authUser.email_confirmed_at);

if (!emailConfirmed) {
return NextResponse.json({
success: true,
status: "unconfirmed"
});
}

const name =
typeof authUser.user_metadata?.name === "string" &&
authUser.user_metadata.name.trim() !== ""
? authUser.user_metadata.name.trim()
: email;

const { data: existingCoach, error: existingCoachError } =
await supabaseAdmin
.from("coaches")
.select("*")
.eq("email", email)
.maybeSingle();

if (existingCoachError) {
return NextResponse.json(
{ error: existingCoachError.message },
{ status: 500 }
);
}

let coach = existingCoach;

if (!coach) {
const { data: insertedCoach, error: insertError } = await supabaseAdmin
.from("coaches")
.insert({
name,
email,
role: "coach",
status: "pending",
email_confirmed: true,
admin_notified: false
})
.select("*")
.single();

if (insertError || !insertedCoach) {
return NextResponse.json(
{ error: insertError?.message || "Impossible de créer le coach." },
{ status: 500 }
);
}

coach = insertedCoach;
} else {
const { data: updatedCoach, error: updateError } = await supabaseAdmin
.from("coaches")
.update({
name,
email_confirmed: true
})
.eq("id", coach.id)
.select("*")
.single();

if (updateError || !updatedCoach) {
return NextResponse.json(
{ error: updateError?.message || "Impossible de mettre à jour le coach." },
{ status: 500 }
);
}

coach = updatedCoach;
}

if (coach.status === "pending" && !coach.admin_notified) {
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

const { data: notifiedCoach, error: notifyUpdateError } =
await supabaseAdmin
.from("coaches")
.update({ admin_notified: true })
.eq("id", coach.id)
.select("*")
.single();

if (!notifyUpdateError && notifiedCoach) {
coach = notifiedCoach;
}
}
}

return NextResponse.json({
success: true,
status: coach.status
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
