import nodemailer from "nodemailer";

export function getMailer() {
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const secure = process.env.SMTP_SECURE === "true";
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

if (!host || !user || !pass) {
throw new Error("Configuration SMTP incomplète.");
}

return nodemailer.createTransport({
host,
port,
secure,
auth: {
user,
pass
}
});
}

export function getFromAddress() {
const fromEmail = process.env.SMTP_FROM_EMAIL;
const fromName = process.env.SMTP_FROM_NAME || "VBCM";

if (!fromEmail) {
throw new Error("SMTP_FROM_EMAIL manquante.");
}

return `"${fromName}" <${fromEmail}>`;
}