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

const { error: updateError } = await supabaseAdmin
.from("coaches")
.update({ status: "active" })
.eq("id", coachId);

if (updateError) {
return NextResponse.json(
{ error: updateError.message },
{ status: 500 }
);
}

try {
const mailer = getMailer();

await mailer.sendMail({
from: getFromAddress(),
to: coach.email,
subject: "Compte coach validé",
text: `Bonjour ${coach.name},

Bonne nouvelle !

Votre compte entraîneur a été validé par l'administrateur.

Vous pouvez maintenant vous connecter à l'application.

Sportivement,
Volley Ball Club Mundolsheim`,
html: `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
<h2>Bonjour ${coach.name},</h2>
<p><strong>Bonne nouvelle !</strong></p>
<p>Votre compte entraîneur a été <strong>validé</strong>.</p>
<p>Vous pouvez maintenant vous connecter à l'application.</p>
<p>Sportivement,<br/>Volley Ball Club Mundolsheim</p>
</div>
`
});
} catch (mailError) {
console.error("Email validation non envoyé :", mailError);
}

return NextResponse.json({
success: true,
message: "Compte validé."
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