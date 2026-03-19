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
message: "Aucune notification nécessaire."
});
}

if (coach.admin_notified) {
return NextResponse.json({
success: true,
message: "Admins déjà notifiés."
});
}

const { data: admins, error: adminsError } = await supabaseAdmin
.from("coaches")
.select("email")
.eq("role", "admin")
.eq("status", "active");

if (adminsError || !admins || admins.length === 0) {
return NextResponse.json(
{ error: "Aucun administrateur actif trouvé." },
{ status: 500 }
);
}

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
console.error("Notification admin non envoyée :", mailError);
}

const { error: updateError } = await supabaseAdmin
.from("coaches")
.update({
email_confirmed: true,
admin_notified: true
})
.eq("id", coach.id);

if (updateError) {
return NextResponse.json(
{ error: updateError.message },
{ status: 500 }
);
}

return NextResponse.json({
success: true,
message: "Les administrateurs ont été notifiés."
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