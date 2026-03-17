"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import CoachNav from "../../components/CoachNav";

type ClubDrill = {
id: string;
title: string;
description: string;
category: string;
level: string;
theme: string;
duration: number;
material: string;
};

type Coach = {
id: string;
name: string;
email: string;
role: string;
status: string;
};

type DeleteRequest = {
id: string;
club_drill_id: string;
requested_by: string;
status: string;
admin_reason: string | null;
coaches:
| {
name: string;
email: string;
}
| {
name: string;
email: string;
}[]
| null;
};

export default function BaseClubPage() {
const [coach, setCoach] = useState<Coach | null>(null);
const [drills, setDrills] = useState<ClubDrill[]>([]);
const [deleteRequests, setDeleteRequests] = useState<DeleteRequest[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [message, setMessage] = useState("");
const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

const [searchTerm, setSearchTerm] = useState("");
const [selectedCategory, setSelectedCategory] = useState("");
const [selectedLevel, setSelectedLevel] = useState("");
const [selectedTheme, setSelectedTheme] = useState("");

const categoryOptions = [
"",
"M11",
"M13",
"M15",
"M18",
"Féminine",
"Régional",
"Séniors",
"Séniors compétition",
"Toutes catégories"
];

const levelOptions = ["", "Débutant", "Intermédiaire", "Confirmé"];

const themeOptions = [
"",
"échauffement",
"service",
"réception",
"passe",
"attaque",
"défense",
"jeu",
"retour_calme"
];

async function loadData() {
const supabase = createClient();

const {
data: { user },
error: userError
} = await supabase.auth.getUser();

if (userError || !user || !user.email) {
setError("Aucune session utilisateur active.");
setLoading(false);
return;
}

const { data: coachData, error: coachError } = await supabase
.from("coaches")
.select("*")
.eq("email", user.email)
.single();

if (coachError || !coachData) {
setError("Coach introuvable.");
setLoading(false);
return;
}

setCoach(coachData);

const { data: drillsData, error: drillsError } = await supabase
.from("club_drills")
.select("*")
.order("created_at", { ascending: false });

if (drillsError) {
setError(drillsError.message);
setLoading(false);
return;
}

const { data: requestsData, error: requestsError } = await supabase
.from("club_drill_delete_requests")
.select(`
id,
club_drill_id,
requested_by,
status,
admin_reason,
coaches (
name,
email
)
`)
.in("status", ["pending", "rejected"]);

if (requestsError) {
setError(requestsError.message);
setLoading(false);
return;
}

setDrills(drillsData || []);
setDeleteRequests((requestsData as DeleteRequest[]) || []);
setLoading(false);
}

useEffect(() => {
loadData();
}, []);

async function handleDuplicate(clubDrillId: string) {
if (!coach) return;

setError("");
setMessage("");

const response = await fetch("/api/duplicate-club-drill", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
clubDrillId,
coachId: coach.id
})
});

const result = await response.json();

if (!response.ok) {
setError(result.error || "Erreur lors de la duplication.");
return;
}

setMessage("Exercice dupliqué dans Mes exercices.");
}

async function handleDelete(clubDrillId: string) {
const ok = confirm("Supprimer cet exercice de la base club ?");

if (!ok) return;

setError("");
setMessage("");

const supabase = createClient();

const { error: deleteError } = await supabase
.from("club_drills")
.delete()
.eq("id", clubDrillId);

if (deleteError) {
setError(deleteError.message);
return;
}

setMessage("Exercice supprimé de la base club.");
await loadData();
}

async function handleRequestDelete(clubDrillId: string) {
if (!coach) return;

setError("");
setMessage("");

const supabase = createClient();

const { data: existing, error: existingError } = await supabase
.from("club_drill_delete_requests")
.select("id")
.eq("club_drill_id", clubDrillId)
.eq("status", "pending")
.maybeSingle();

if (existingError) {
setError(existingError.message);
return;
}

if (existing) {
setError("Une demande de suppression est déjà en attente pour cet exercice.");
return;
}

const { error: insertError } = await supabase
.from("club_drill_delete_requests")
.insert({
club_drill_id: clubDrillId,
requested_by: coach.id,
status: "pending"
});

if (insertError) {
setError(insertError.message);
return;
}

setMessage("La demande de suppression a bien été envoyée à l'administration.");
await loadData();
}

function getPendingDeleteRequest(clubDrillId: string) {
return deleteRequests.find(
(request) =>
request.club_drill_id === clubDrillId && request.status === "pending"
);
}

function getRejectedDeleteRequestForCurrentCoach(clubDrillId: string) {
if (!coach) return undefined;

return deleteRequests.find(
(request) =>
request.club_drill_id === clubDrillId &&
request.status === "rejected" &&
request.requested_by === coach.id &&
!!request.admin_reason
);
}

function getRequesterInfo(request: DeleteRequest | undefined) {
if (!request || !request.coaches) return null;
return Array.isArray(request.coaches) ? request.coaches[0] : request.coaches;
}

function getSimpleExplanation(drill: ClubDrill) {
const theme = (drill.theme || "").toLowerCase();
const category = drill.category || "catégorie non précisée";
const duration = drill.duration || 0;

if (theme.includes("échauffement")) {
return `Exercice de mise en route pour préparer les joueurs physiquement et techniquement avant la séance. Idéal en début d'entraînement pour ${category}, pendant environ ${duration} minutes.`;
}
if (theme.includes("service")) {
return `Exercice pour travailler la qualité du service : régularité, précision ou puissance. Le coach regarde surtout si les joueurs envoient le ballon dans la bonne zone et avec moins de fautes.`;
}
if (theme.includes("réception")) {
return `Exercice pour apprendre à bien contrôler un service ou une balle adverse et l'envoyer vers le passeur. Pour un coach débutant, il faut observer la posture, l'orientation des bras et la précision de la balle.`;
}
if (theme.includes("passe")) {
return `Exercice centré sur la qualité de passe. L'objectif est de donner un ballon exploitable au partenaire ou à l'attaquant. Le coach peut surtout vérifier la précision et le placement sous le ballon.`;
}
if (theme.includes("attaque")) {
return `Exercice pour améliorer la frappe, l'élan ou le placement offensif. Un coach débutant peut se concentrer sur le timing, la course d'élan et la direction de la balle.`;
}
if (theme.includes("défense")) {
return `Exercice de protection du terrain contre l'attaque adverse. L'idée est d'apprendre à lire la trajectoire, se placer vite et remonter un ballon jouable.`;
}
if (theme.includes("jeu")) {
return `Exercice proche de la situation de match. Il sert à appliquer les apprentissages dans le jeu réel avec opposition, prise d'information et enchaînement d'actions.`;
}
if (theme.includes("retour_calme")) {
return `Exercice de fin de séance pour faire redescendre l'intensité, retrouver du calme et terminer proprement.`;
}

return `Version simple : cet exercice sert à travailler le thème "${drill.theme}" avec des joueurs de ${category}. Le coach peut surtout vérifier la compréhension de la consigne, la qualité des gestes et le rythme pendant ${duration} minutes.`;
}

const filteredDrills = useMemo(() => {
return drills.filter((drill) => {
const text = searchTerm.trim().toLowerCase();

const matchesSearch =
!text ||
drill.title.toLowerCase().includes(text) ||
drill.description.toLowerCase().includes(text) ||
(drill.category || "").toLowerCase().includes(text) ||
(drill.level || "").toLowerCase().includes(text) ||
(drill.theme || "").toLowerCase().includes(text) ||
(drill.material || "").toLowerCase().includes(text);

const matchesCategory =
!selectedCategory || drill.category === selectedCategory;

const matchesLevel =
!selectedLevel || drill.level === selectedLevel;

const matchesTheme =
!selectedTheme || drill.theme === selectedTheme;

return matchesSearch && matchesCategory && matchesLevel && matchesTheme;
});
}, [drills, searchTerm, selectedCategory, selectedLevel, selectedTheme]);

function resetFilters() {
setSearchTerm("");
setSelectedCategory("");
setSelectedLevel("");
setSelectedTheme("");
}

if (loading) {
return (
<main style={{ padding: "40px", fontFamily: "Arial" }}>
<CoachNav />
<p>Chargement de la base club...</p>
</main>
);
}

return (
<main style={{ padding: "40px", fontFamily: "Arial" }}>
<CoachNav />

<h1>Base club des exercices</h1>
<p>Bibliothèque officielle des exercices validés du club.</p>

<div
style={{
position: "sticky",
top: "165px",
zIndex: 900,
marginTop: "25px",
marginBottom: "30px",
padding: "20px",
border: "1px solid #ddd",
borderRadius: "10px",
background: "#f9fafb",
boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
}}
>
<h2 style={{ marginTop: 0 }}>Recherche et filtres</h2>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
gap: "15px",
alignItems: "end"
}}
>
<div>
<label>Recherche</label>
<br />
<input
type="text"
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
placeholder="Titre, description, matériel..."
style={{ width: "100%", padding: "10px" }}
/>
</div>

<div>
<label>Catégorie</label>
<br />
<select
value={selectedCategory}
onChange={(e) => setSelectedCategory(e.target.value)}
style={{ width: "100%", padding: "10px" }}
>
{categoryOptions.map((option) => (
<option key={option || "all-categories"} value={option}>
{option || "Toutes les catégories"}
</option>
))}
</select>
</div>

<div>
<label>Niveau</label>
<br />
<select
value={selectedLevel}
onChange={(e) => setSelectedLevel(e.target.value)}
style={{ width: "100%", padding: "10px" }}
>
{levelOptions.map((option) => (
<option key={option || "all-levels"} value={option}>
{option || "Tous les niveaux"}
</option>
))}
</select>
</div>

<div>
<label>Thème</label>
<br />
<select
value={selectedTheme}
onChange={(e) => setSelectedTheme(e.target.value)}
style={{ width: "100%", padding: "10px" }}
>
{themeOptions.map((option) => (
<option key={option || "all-themes"} value={option}>
{option || "Tous les thèmes"}
</option>
))}
</select>
</div>

<div>
<button
onClick={resetFilters}
style={{
padding: "10px 16px",
background: "#6b7280",
color: "white",
border: "none",
borderRadius: "6px",
cursor: "pointer",
fontWeight: "bold"
}}
>
Réinitialiser les filtres
</button>
</div>
</div>

<p style={{ marginTop: "15px", marginBottom: 0, fontWeight: "bold" }}>
{filteredDrills.length} exercice(s) trouvé(s)
</p>
</div>

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

<div style={{ marginTop: "30px", display: "grid", gap: "20px" }}>
{filteredDrills.map((drill) => {
const pendingDeleteRequest = getPendingDeleteRequest(drill.id);
const rejectedDeleteRequest = getRejectedDeleteRequestForCurrentCoach(drill.id);
const requester = getRequesterInfo(pendingDeleteRequest);
const pendingDelete = Boolean(pendingDeleteRequest);

return (
<div
key={drill.id}
style={{
border: "1px solid #ddd",
borderRadius: "10px",
padding: "20px",
boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
}}
>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "flex-start",
gap: "12px",
flexWrap: "wrap"
}}
>
<h2 style={{ marginTop: 0, marginBottom: "10px" }}>{drill.title}</h2>

{pendingDelete && (
<span
style={{
display: "inline-block",
padding: "6px 10px",
background: "#f59e0b",
color: "white",
borderRadius: "999px",
fontSize: "0.9rem",
fontWeight: "bold"
}}
>
Demande de suppression en attente
</span>
)}
</div>

{pendingDelete && requester && (
<p
style={{
marginTop: 0,
marginBottom: "12px",
fontSize: "0.95rem",
color: "#92400e",
fontWeight: "bold"
}}
>
Demandée par : {requester.name} ({requester.email})
</p>
)}

{rejectedDeleteRequest?.admin_reason && (
<div
style={{
marginBottom: "12px",
padding: "12px",
borderRadius: "8px",
background: "#eff6ff",
border: "1px solid #93c5fd"
}}
>
<p style={{ margin: 0, fontWeight: "bold", color: "#1d4ed8" }}>
Motif du refus de suppression :
</p>
<p style={{ marginTop: "8px", marginBottom: 0 }}>
{rejectedDeleteRequest.admin_reason}
</p>
</div>
)}

<div style={{ marginBottom: "14px", lineHeight: 1.5 }}>
<span>{drill.description}</span>

<span
style={{
position: "relative",
display: "inline-block",
marginLeft: "8px",
verticalAlign: "middle"
}}
onMouseEnter={() => setOpenTooltipId(drill.id)}
onMouseLeave={() => setOpenTooltipId(null)}
>
<span
style={{
display: "inline-block",
padding: "4px 8px",
background: "#eef2ff",
color: "#3730a3",
borderRadius: "999px",
fontSize: "0.85rem",
fontWeight: "bold",
cursor: "default"
}}
>
ⓘ
</span>

{openTooltipId === drill.id && (
<div
style={{
position: "absolute",
top: "120%",
left: 0,
width: "360px",
maxWidth: "90vw",
background: "#111827",
color: "white",
padding: "12px",
borderRadius: "8px",
boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
zIndex: 20,
fontSize: "0.92rem",
lineHeight: 1.45
}}
>
{getSimpleExplanation(drill)}
</div>
)}
</span>
</div>

<p><strong>Catégorie :</strong> {drill.category}</p>
<p><strong>Niveau :</strong> {drill.level}</p>
<p><strong>Thème :</strong> {drill.theme}</p>
<p><strong>Durée :</strong> {drill.duration} min</p>
<p><strong>Matériel :</strong> {drill.material}</p>

<div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
<a
href={`/base-club/${drill.id}/modifier`}
style={{
display: "inline-block",
padding: "10px 16px",
background: "#1d4ed8",
color: "white",
textDecoration: "none",
borderRadius: "6px",
fontWeight: "bold"
}}
>
Modifier
</a>

<button
onClick={() => handleDuplicate(drill.id)}
style={{
padding: "10px 16px",
background: "#0a7a3d",
color: "white",
border: "none",
borderRadius: "6px",
cursor: "pointer"
}}
>
Dupliquer dans Mes exercices
</button>

{coach?.role === "admin" ? (
<button
onClick={() => handleDelete(drill.id)}
style={{
padding: "10px 16px",
background: "#b91c1c",
color: "white",
border: "none",
borderRadius: "6px",
cursor: "pointer"
}}
>
Supprimer cet exercice
</button>
) : (
<button
onClick={() => handleRequestDelete(drill.id)}
disabled={pendingDelete}
style={{
padding: "10px 16px",
background: pendingDelete ? "#9ca3af" : "#f59e0b",
color: "white",
border: "none",
borderRadius: "6px",
cursor: pendingDelete ? "default" : "pointer"
}}
>
{pendingDelete
? "Suppression déjà demandée"
: "Proposer la suppression"}
</button>
)}
</div>
</div>
);
})}

{!filteredDrills.length && !error && (
<p>Aucun exercice ne correspond aux critères sélectionnés.</p>
)}
</div>
</main>
);
}