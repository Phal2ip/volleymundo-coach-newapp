import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getMailer, getFromAddress } from "@/lib/mailer";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();
const { name, email } = await request.json();

if (!name || !email) {
return NextResponse.json(
{ error: "Nom ou email manquant." },
{ status: 400 }
);
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

Une nouvelle demande de création de compte entraîneur a été effectuée.

Nom : ${name}
Email : ${email}

Connectez-vous à l'application pour valider ou refuser cette demande.

Sportivement,
Volley Ball Club Mundolsheim`,
html: `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
<h2>Nouvelle demande de compte coach</h2>
<p>Une nouvelle demande de création de compte entraîneur a été effectuée.</p>
<p><strong>Nom :</strong> ${name}</p>
<p><strong>Email :</strong> ${email}</p>
<p>Connectez-vous à l'application pour valider ou refuser cette demande.</p>
<p>Sportivement,<br/>Volley Ball Club Mundolsheim</p>
</div>
`
});
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
