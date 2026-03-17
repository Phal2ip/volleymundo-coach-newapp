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
.select("id, name, email, status")
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

const emailResult = await resend.emails.send({
from: "VBCM <onboarding@resend.dev>",
to: coach.email,
subject: "Votre compte coach a été validé",
html: `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
<h2>Bonjour ${coach.name},</h2>
<p>Votre demande de compte entraîneur a été <strong>acceptée</strong>.</p>
<p>Vous pouvez maintenant vous connecter à l'application.</p>
<p>Sportivement,<br/>Volley Ball Club Mundolsheim</p>
</div>
`
});

if (emailResult.error) {
return NextResponse.json(
{
error: "Le compte a été validé, mais l'email n'a pas pu être envoyé.",
details: emailResult.error.message
},
{ status: 500 }
);
}

return NextResponse.json({
success: true,
message: "Le compte a été validé et l'email a été envoyé."
});
} catch (error) {
return NextResponse.json(
{ error: error instanceof Error ? error.message : "Erreur serveur." },
{ status: 500 }
);
}
}