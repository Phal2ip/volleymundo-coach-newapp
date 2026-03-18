import { NextResponse } from "next/server";
import Mailjet from "node-mailjet";

export async function GET() {
try {
const apiKey = process.env.MAILJET_API_KEY;
const secretKey = process.env.MAILJET_SECRET_KEY;

if (!apiKey || !secretKey) {
return NextResponse.json(
{ error: "MAILJET_API_KEY ou MAILJET_SECRET_KEY manquante." },
{ status: 500 }
);
}

const mailjet = Mailjet.apiConnect(apiKey, secretKey);

const result = await mailjet.post("send", { version: "v3.1" }).request({
Messages: [
{
From: {
Email: "no-reply@volleymundo.fr",
Name: "VBCM"
},
To: [
{
Email: "phal2ip@gmail.com",
Name: "Test"
}
],
Subject: "Test Mailjet VBCM",
TextPart: "Ceci est un email de test envoyé depuis Mailjet.",
HTMLPart: "<h3>Ceci est un email de test envoyé depuis Mailjet.</h3>"
}
]
} as any);

return NextResponse.json({
success: true,
result
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
