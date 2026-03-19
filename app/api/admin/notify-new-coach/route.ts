import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getMailer, getFromAddress } from "@/lib/mailer";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();
const { coachId, name, email } = await request.json();

if (!coachId || !name || !email) {
return NextResponse.json(
{ error: "Informations manquantes." },
{ status: 400 }
);
}

const { data: coach, error: coachError } = await supabaseAdmin
.from("coaches")
.select("id, email_confirmed, admin_notified")
.eq("id", coachId)
.single();

if (coachError || !coach) {
return NextResponse.json(
{ error: "Coach introuvable." },
{ status: 404 }
);
}

if (!coach.email_confirmed || coach.admin_notified) {
return NextResponse.json({
success: true,
message: "Aucune notification admin nécessaire."
});
}

const { data: admins, error } = await supabaseAdmin
.from("coaches")
.select("email")
.eq("role", "admin")
.eq("status", "active");

if (error || !admins || admins.length === 0) {
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

Nom : ${name}
Email : ${email}

Connectez-vous à l'application pour valider ou refuser cette demande.

Sportivement,
Volley Ball Club Mundolsheim`,
html: `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
<h2>Nouvelle demande de compte coach</h2>
<p>Une nouvelle demande de création de compte entraîneur a bien été <strong>confirmée par email</strong>.</p>
<p><strong>Nom :</strong> ${name}</p>
<p><strong>Email :</strong> ${email}</p>
<p>Connectez-vous à l'application pour valider ou refuser cette demande.</p>
<p>Sportivement,<br/>Volley Ball Club Mundolsheim</p>
</div>
`
});

await supabaseAdmin
.from("coaches")
.update({ admin_notified: true })
.eq("id", coachId);
} catch (mailError) {
console.error("Notification admin non envoyée :", mailError);
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