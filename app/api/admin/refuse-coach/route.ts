import { NextResponse } from "next/server";
import Mailjet from "node-mailjet";

export async function POST(request: Request) {
try {
const { email, name } = await request.json();

const mailjet = Mailjet.apiConnect(
process.env.MAILJET_API_KEY!,
process.env.MAILJET_SECRET_KEY!
);

const result = await mailjet.post("send", { version: "v3.1" }).request({
Messages: [
{
From: {
Email: "no-reply@volleymundo.fr",
Name: "Administrateurs"
},
To: [
{
Email: email,
Name: name
}
],
Subject: "Demande de compte refusée",
TextPart: `Bonjour ${name},

Votre demande de création de compte a été refusée par l'administrateur.

Merci de contacter le club pour plus d'informations.

Sportivement,
VBCM`,
}
]
});

return NextResponse.json({ message: "Email envoyé avec succès" });

} catch (error: any) {
return NextResponse.json(
{ error: error.message },
{ status: 500 }
);
}
}