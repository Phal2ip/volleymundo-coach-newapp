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
is_protected?: boolean;
};

export default function AdminCoachsPage() {
const [currentUser, setCurrentUser] = useState<Coach | null>(null);
const [coachs, setCoachs] = useState<Coach[]>([]);
const [loading, setLoading] = useState(true);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function loadData() {
setLoading(true);
setMessage("");
setError("");

const supabaseClient = createClient();

const {
data: { user },
error: userError
} = await supabaseClient.auth.getUser();

if (userError || !user || !user.email) {
setError("Utilisateur non connecté.");
setLoading(false);
return;
}

const { data: currentCoach, error: currentCoachError } = await supabaseClient
.from("coaches")
.select("*")
.eq("email", user.email)
.single();

if (currentCoachError || !currentCoach) {
setError("Compte coach introuvable.");
setLoading(false);
return;
}

if (currentCoach.role !== "admin") {
setError("Accès réservé aux administrateurs.");
setLoading(false);
return;
}

setCurrentUser(currentCoach);

const { data, error } = await supabaseClient
.from("coaches")
.select("*")
.order("created_at", { ascending: false });

if (error) {
setError(error.message);
setLoading(false);
return;
}

setCoachs(data || []);
setLoading(false);
}

useEffect(() => {
loadData();
}, []);

async function handleRoleChange(coach: Coach, newRole: "coach" | "admin") {
if (!currentUser) return;

const confirmText =
newRole === "admin"
? `Passer ${coach.name} en administrateur ?`
: `Retirer le rôle administrateur à ${coach.name} ?`;

const ok = window.confirm(confirmText);
if (!ok) return;

setMessage("");
setError("");

const response = await fetch("/api/admin/set-role", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
coachId: coach.id,
newRole,
currentUserId: currentUser.id,
currentUserEmail: currentUser.email
})
});

const result = await response.json();

if (!response.ok) {
setError(result.error || "Erreur lors du changement de rôle.");
return;
}

setMessage(result.message || "Rôle mis à jour.");
await loadData();
}

async function handleStatusChange(coach: Coach, newStatus: "active" | "disabled") {
if (!currentUser) return;

const ok = window.confirm(
newStatus === "active"
? `Réactiver ${coach.name} ?`
: `Désactiver ${coach.name} ?`
);

if (!ok) return;

setMessage("");
setError("");

const response = await fetch("/api/admin/set-status", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
coachId: coach.id,
newStatus,
currentUserId: currentUser.id
})
});

const result = await response.json();

if (!response.ok) {
setError(result.error || "Erreur lors du changement de statut.");
return;
}

setMessage(result.message || "Statut mis à jour.");
await loadData();
}

async function handleDeleteCoach(coach: Coach) {
if (!currentUser) return;

const ok = window.confirm(
`Supprimer définitivement ${coach.name} ? Cette action est irréversible.`
);

if (!ok) return;

setMessage("");
setError("");

const response = await fetch("/api/admin/delete-coach", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
coachId: coach.id,
currentUserId: currentUser.id
})
});

const result = await response.json();

if (!response.ok) {
setError(result.error || "Erreur lors de la suppression.");
return;
}

setMessage(result.message || "Compte supprimé.");
await loadData();
}

function roleBadge(role: string) {
return (
<span
style={{
display: "inline-block",
padding: "5px 10px",
borderRadius: "999px",
background: role === "admin" ? "#1d4ed8" : "#6b7280",
color: "white",
fontWeight: "bold",
fontSize: "0.85rem"
}}
>
{role === "admin" ? "Admin" : "Coach"}
</span>
);
}

function statusBadge(status: string) {
return (
<span
style={{
display: "inline-block",
padding: "5px 10px",
borderRadius: "999px",
background: status === "active" ? "#0a7a3d" : "#b91c1c",
color: "white",
fontWeight: "bold",
fontSize: "0.85rem"
}}
>
{status === "active" ? "Actif" : "Désactivé"}
</span>
);
}

if (loading) {
return (
<main style={{ padding: "40px", fontFamily: "Arial" }}>
<CoachNav />
<p>Chargement des coachs...</p>
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

<h1>Gestion des coachs</h1>
<p>Depuis cette page, un administrateur peut gérer les rôles, le statut et la suppression des comptes.</p>

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
{coachs.map((coach) => (
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

<div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
{roleBadge(coach.role)}
{statusBadge(coach.status)}
{coach.is_protected && (
<span
style={{
display: "inline-block",
padding: "5px 10px",
borderRadius: "999px",
background: "#7c3aed",
color: "white",
fontWeight: "bold",
fontSize: "0.85rem"
}}
>
Protégé
</span>
)}
</div>

<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
{coach.role === "admin" ? (
<button
onClick={() => handleRoleChange(coach, "coach")}
disabled={currentUser?.id === coach.id || coach.is_protected}
style={{
padding: "10px 16px",
background:
currentUser?.id === coach.id || coach.is_protected
? "#9ca3af"
: "#b91c1c",
color: "white",
border: "none",
borderRadius: "6px",
cursor:
currentUser?.id === coach.id || coach.is_protected
? "default"
: "pointer"
}}
>
Retirer admin
</button>
) : (
<button
onClick={() => handleRoleChange(coach, "admin")}
style={{
padding: "10px 16px",
background: "#1d4ed8",
color: "white",
border: "none",
borderRadius: "6px",
cursor: "pointer"
}}
>
Passer en admin
</button>
)}

{coach.status === "active" ? (
<button
onClick={() => handleStatusChange(coach, "disabled")}
disabled={currentUser?.id === coach.id || coach.is_protected}
style={{
padding: "10px 16px",
background:
currentUser?.id === coach.id || coach.is_protected
? "#9ca3af"
: "#b91c1c",
color: "white",
border: "none",
borderRadius: "6px",
cursor:
currentUser?.id === coach.id || coach.is_protected
? "default"
: "pointer"
}}
>
Désactiver
</button>
) : (
<>
<button
onClick={() => handleStatusChange(coach, "active")}
style={{
padding: "10px 16px",
background: "#0a7a3d",
color: "white",
border: "none",
borderRadius: "6px",
cursor: "pointer"
}}
>
Réactiver
</button>

<button
onClick={() => handleDeleteCoach(coach)}
disabled={coach.is_protected}
style={{
padding: "10px 16px",
background: coach.is_protected ? "#9ca3af" : "#7f1d1d",
color: "white",
border: "none",
borderRadius: "6px",
cursor: coach.is_protected ? "default" : "pointer"
}}
>
Supprimer
</button>
</>
)}
</div>
</div>
))}
</div>
</main>
);
}