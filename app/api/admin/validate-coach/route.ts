import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import Mailjet from "node-mailjet";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();

const apiKey = process.env.MAILJET_API_KEY;
const secretKey = process.env.MAILJET_SECRET_KEY;

if (!apiKey || !secretKey) {
return NextResponse.json(
{ error: "Clés Mailjet manquantes." },
{ status: 500 }
);
}

const mailjet = Mailjet.apiConnect(apiKey, secretKey);

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

const mailPayload = {
Messages: [
{
From: {
Email: "no-reply@volleymundo.fr",
Name: "Les Administrateurs"
},
To: [
{
Email: coach.email,
Name: coach.name
}
],
Subject: "Compte coach validé",
TextPart: `Bonjour ${coach.name},

Bonne nouvelle !

Votre compte entraîneur a été validé par l'administrateur.

Vous pouvez maintenant vous connecter à l'application.

Sportivement,
VBCM`,
HTMLPart: `
<div style="font-family: Arial, sans-serif;">
<h2>Bonjour ${coach.name}</h2>
<p><strong>Bonne nouvelle !</strong></p>
<p>Votre compte entraîneur a été <strong>validé</strong>.</p>
<p>Vous pouvez maintenant vous connecter à l'application.</p>
<br />
<p>Sportivement,<br />VBCM</p>
</div>
`
}
]
};

const mailResult = await mailjet
.post("send", { version: "v3.1" })
.request(mailPayload as any);

if (!mailResult?.body) {
return NextResponse.json(
{ error: "Compte validé mais email non envoyé." },
{ status: 500 }
);
}

return NextResponse.json({
success: true,
message: "Compte validé + email envoyé"
});
} catch (error) {
return NextResponse.json(
{
error: error instanceof Error ? error.message : "Erreur serveur"
},
{ status: 500 }
);
}
}