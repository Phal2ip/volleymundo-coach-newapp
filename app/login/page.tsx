"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [message, setMessage] = useState("");
const [error, setError] = useState("");
const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null);

useEffect(() => {
if (redirectSeconds === null) return;

if (redirectSeconds <= 0) {
window.location.href = "/dashboard";
return;
}

const timer = setTimeout(() => {
setRedirectSeconds((prev) => (prev === null ? null : prev - 1));
}, 1000);

return () => clearTimeout(timer);
}, [redirectSeconds]);

async function handleLogin(e: React.FormEvent) {
e.preventDefault();

setMessage("");
setError("");
setRedirectSeconds(null);

const supabase = createClient();

const { error: loginError } = await supabase.auth.signInWithPassword({
email,
password
});

if (loginError) {
setError(loginError.message);
return;
}

const {
data: { user },
error: userError
} = await supabase.auth.getUser();

if (userError || !user || !user.email) {
setError("Connexion impossible.");
return;
}

const { data: coach, error: coachError } = await supabase
.from("coaches")
.select("*")
.eq("email", user.email)
.single();

if (coachError || !coach) {
await supabase.auth.signOut();
setError(
"Ce compte existe mais n'est plus rattaché au club. Merci de contacter l'administrateur."
);
return;
}

if (coach.status === "pending") {
try {
const emailConfirmed = Boolean(user.email_confirmed_at);

if (emailConfirmed) {
await fetch("/api/admin/notify-new-coach", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
coachId: coach.id
})
});
}
} catch (notifyError) {
console.error("Erreur notification admin :", notifyError);
}

await supabase.auth.signOut();
setError(
"Votre compte est en attente de validation par un administrateur."
);
return;
}

if (coach.status === "disabled") {
await supabase.auth.signOut();
setError("Ce compte est désactivé. Merci de contacter l'administrateur.");
return;
}

if (coach.status !== "active") {
await supabase.auth.signOut();
setError("Statut du compte invalide. Merci de contacter l'administrateur.");
return;
}

setMessage("Connexion réussie. Chargement de votre dashboard en cours...");
setRedirectSeconds(5);
}

const progressPercent =
redirectSeconds === null ? 0 : ((5 - redirectSeconds) / 5) * 100;

return (
<main
style={{
padding: "40px",
fontFamily: "Arial",
maxWidth: "500px",
margin: "0 auto",
textAlign: "center"
}}
>
<h1
style={{
fontSize: "2rem",
fontWeight: "bold",
marginBottom: "10px"
}}
>
Volley Ball Club Mundolsheim
</h1>

<img
src="/Logo VBCM.png"
alt="Logo club"
style={{
width: "180px",
marginBottom: "25px"
}}
/>

<h2>Connexion entraîneur</h2>
<p>Connecte-toi ou crée ton compte coach.</p>

<form onSubmit={handleLogin} style={{ marginTop: "20px", textAlign: "left" }}>
<div style={{ marginBottom: "15px" }}>
<label>Email</label>
<br />
<input
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
style={{ width: "100%", padding: "10px" }}
required
/>
</div>

<div style={{ marginBottom: "15px" }}>
<label>Mot de passe</label>
<br />
<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
style={{ width: "100%", padding: "10px" }}
required
/>
</div>

<button
type="submit"
style={{
width: "100%",
padding: "12px",
background: "#b91c1c",
color: "white",
border: "none",
borderRadius: "8px",
cursor: "pointer",
fontWeight: "bold"
}}
>
Se connecter
</button>
</form>

{message && (
<div style={{ marginTop: "20px" }}>
<p style={{ color: "green", fontWeight: "bold", marginBottom: "10px" }}>
{message}
</p>

{redirectSeconds !== null && (
<>
<p style={{ marginBottom: "10px" }}>
Redirection dans {redirectSeconds} seconde{redirectSeconds > 1 ? "s" : ""}...
</p>

<div
style={{
width: "100%",
height: "16px",
background: "#e5e7eb",
borderRadius: "999px",
overflow: "hidden",
border: "1px solid #ccc"
}}
>
<div
style={{
width: `${progressPercent}%`,
height: "100%",
background: "#b91c1c",
transition: "width 1s linear"
}}
/>
</div>
</>
)}
</div>
)}

{error && (
<p style={{ color: "red", marginTop: "20px", fontWeight: "bold" }}>
{error}
</p>
)}

<div
style={{
marginTop: "35px",
paddingTop: "25px",
borderTop: "1px solid #ddd"
}}
>
<h3 style={{ fontSize: "1.2rem" }}>Nouveau coach ?</h3>
<p>Crée ton compte pour accéder à l’application.</p>

<a
href="/inscription"
style={{
display: "inline-block",
padding: "12px 20px",
background: "#111827",
color: "white",
textDecoration: "none",
borderRadius: "8px",
fontWeight: "bold"
}}
>
Créer un compte coach
</a>
</div>
</main>
);
}