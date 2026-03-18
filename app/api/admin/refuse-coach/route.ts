import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import Mailjet from "node-mailjet";

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

const { data: coach } = await supabaseAdmin
.from("coaches")
.select("*")
.eq("id", coachId)
.single();

if (!coach) {
return NextResponse.json(
{ error: "Coach introuvable." },
{ status: 404 }
);
}

// ✅ 1. SUPPRESSION (prioritaire)
await supabaseAdmin
.from("coaches")
.delete()
.eq("id", coachId);

// suppression auth
const { data: users } = await supabaseAdmin.auth.admin.listUsers();
const authUser = users.users.find(u => u.email === coach.email);

if (authUser) {
await supabaseAdmin.auth.admin.deleteUser(authUser.id);
}

// ✅ 2. EMAIL (non bloquant)
try {
const mailjet = Mailjet.apiConnect(
process.env.MAILJET_API_KEY!,
process.env.MAILJET_SECRET_KEY!
);

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
Subject: "Compte refusé",
TextPart: `Bonjour ${coach.name}, votre demande a été refusée.`,
}
]
};

await mailjet
.post("send", { version: "v3.1" })
.request(mailPayload as any);

} catch (mailError) {
console.log("❌ Mail refus non envoyé (Mailjet bloqué)");
}

return NextResponse.json({
success: true,
message: "Compte supprimé (email optionnel)"
});

} catch (error) {
return NextResponse.json(
{ error: "Erreur serveur" },
{ status: 500 }
);
}
}
