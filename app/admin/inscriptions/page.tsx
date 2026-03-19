"use client";

import { useEffect, useState } from "react";
import CoachNav from "@/components/CoachNav";
import { createClient } from "@/lib/supabase/client";

type Coach = {
id: string;
name: string;
email: string;
role: string;
status: string;
email_confirmed?: boolean;
};

export default function AdminInscriptionsPage() {
const [pendingCoaches, setPendingCoaches] = useState<Coach[]>([]);
const [loading, setLoading] = useState(true);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function loadPendingCoaches() {
setLoading(true);
setMessage("");
setError("");

const supabase = createClient();

const {
data: { user },
error: userError
} = await supabase.auth.getUser();

if (userError || !user || !user.email) {
setError("Utilisateur non connecté.");
setLoading(false);
return;
}

const { data: currentCoach, error: currentCoachError } = await supabase
.from("coaches")
.select("*")
.eq("email", user.email)
.single();

if (currentCoachError || !currentCoach) {
setError("Compte admin introuvable.");
setLoading(false);
return;
}

if (currentCoach.role !== "admin") {
setError("Accès réservé aux administrateurs.");
setLoading(false);
return;
}

const { data, error } = await supabase
.from("coaches")
.select("*")
.eq("status", "pending")
.eq("email_confirmed", true)
.order("created_at", { ascending: false });

if (error) {
setError(error.message);
setLoading(false);
return;
}

setPendingCoaches(data || []);
setLoading(false);
}

useEffect(() => {
loadPendingCoaches();
}, []);

async function handleAction(coachId: string, action: "validate" | "refuse") {
const confirmText =
action === "validate"
? "Autoriser cette inscription ?"
: "Refuser cette inscription ?";

const ok = window.confirm(confirmText);
if (!ok) return;

setMessage("");
setError("");

const endpoint =
action === "validate"
? "/api/admin/validate-coach"
: "/api/admin/refuse-coach";

const response = await fetch(endpoint, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ coachId })
});

const result = await response.json();

if (!response.ok) {
setError(result.error || "Erreur.");
return;
}

setMessage(result.message || "Action effectuée.");
await loadPendingCoaches();
}

if (loading) {
return (
<main style={{ padding: "40px", fontFamily: "Arial" }}>
<CoachNav />
<p>Chargement des inscriptions en attente...</p>
</main>
);
}

return (
<main style={{ padding: "40px", fontFamily: "Arial" }}>
<CoachNav />

<div style={{ marginBottom: "20px" }}>
<button
type="button"
onClick={() => window.history.back()}
style={{
padding: "10px 16px",
background: "#6b7280",
color: "white",
border: "none",
borderRadius: "8px",
cursor: "pointer",
fontWeight: "bold"
}}
>
← Page précédente
</button>
</div>

<h1>Validation des inscriptions</h1>
<p>Liste des comptes entraîneurs ayant validé leur email.</p>

{message && (
<p style={{ color: "green", fontWeight: "bold", marginTop: "20px" }}>
{message}
</p>
)}

{error && (
<p style={{ color: "red", fontWeight: "bold", marginTop: "20px" }}>
{error}
</p>
)}

<div style={{ display: "grid", gap: "20px", marginTop: "25px" }}>
{pendingCoaches.map((coach) => (
<div
key={coach.id}
style={{
border: "1px solid #ddd",
borderRadius: "10px",
padding: "20px",
boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
}}
>
<h2 style={{ marginTop: 0 }}>{coach.name}</h2>
<p><strong>Email :</strong> {coach.email}</p>
<p><strong>Rôle :</strong> {coach.role}</p>
<p><strong>Statut :</strong> {coach.status}</p>

<div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "15px" }}>
<button
onClick={() => handleAction(coach.id, "validate")}
style={{
padding: "10px 16px",
background: "#0a7a3d",
color: "white",
border: "none",
borderRadius: "6px",
cursor: "pointer"
}}
>
Autoriser
</button>

<button
onClick={() => handleAction(coach.id, "refuse")}
style={{
padding: "10px 16px",
background: "#b91c1c",
color: "white",
border: "none",
borderRadius: "6px",
cursor: "pointer"
}}
>
Refuser
</button>
</div>
</div>
))}

{!pendingCoaches.length && !error && (
<p>Aucune inscription validée par email en attente.</p>
)}
</div>
</main>
);
}
