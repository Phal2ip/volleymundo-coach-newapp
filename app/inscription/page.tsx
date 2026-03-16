"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function InscriptionPage() {
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function handleSignup(e: React.FormEvent) {
e.preventDefault();
setMessage("");
setError("");

const supabase = createClient();

const { data, error: authError } = await supabase.auth.signUp({
email,
password
});

if (authError) {
if (authError.message.toLowerCase().includes("already registered")) {
setError(
"Ce compte existe déjà. Merci de contacter l'administrateur."
);
} else {
setError(authError.message);
}
return;
}

const user = data.user;

if (!user) {
setError("Utilisateur non créé.");
return;
}

const { error: coachError } = await supabase.from("coaches").insert({
name,
email,
role: "coach",
status: "pending"
});

if (coachError) {
setError(coachError.message);
return;
}

await supabase.auth.signOut();

setMessage(
"Compte créé. Votre demande est en attente de validation par un administrateur."
);
setName("");
setEmail("");
setPassword("");
}

return (
<main style={{ padding: "40px", fontFamily: "Arial", maxWidth: "600px" }}>
<h1>Créer un compte coach</h1>
<p>Complète le formulaire pour créer ton accès entraîneur.</p>

<form onSubmit={handleSignup} style={{ marginTop: "20px" }}>
<div style={{ marginBottom: "15px" }}>
<label>Nom / prénom</label>
<br />
<input
type="text"
value={name}
onChange={(e) => setName(e.target.value)}
style={{ width: "100%", padding: "10px" }}
required
/>
</div>

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
padding: "12px 20px",
background: "#0a7a3d",
color: "white",
border: "none",
borderRadius: "8px",
cursor: "pointer",
fontWeight: "bold"
}}
>
Créer le compte
</button>
</form>

{message && (
<p style={{ color: "green", marginTop: "20px", fontWeight: "bold" }}>
{message}
</p>
)}

{error && (
<p style={{ color: "red", marginTop: "20px", fontWeight: "bold" }}>
{error}
</p>
)}

<div style={{ marginTop: "25px" }}>
<a
href="/login"
style={{
color: "#1d4ed8",
textDecoration: "none",
fontWeight: "bold"
}}
>
← Retour à la connexion
</a>
</div>
</main>
);
}
