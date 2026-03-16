"use client";

import { useEffect, useState } from "react";
import CoachNav from "@/components/CoachNav";
import { createClient } from "@/lib/supabase/client";

export default function AdminPage() {
const [pendingCount, setPendingCount] = useState<number>(0);
const [loading, setLoading] = useState(true);

async function loadPendingCount() {
const supabase = createClient();

const { count } = await supabase
.from("coaches")
.select("*", { count: "exact", head: true })
.eq("status", "pending");

setPendingCount(count || 0);
setLoading(false);
}

useEffect(() => {
loadPendingCount();
}, []);

return (
<main style={{ padding: "40px", fontFamily: "Arial" }}>
<CoachNav />

<h1>Administration</h1>

{!loading && (
<div
style={{
marginTop: "20px",
padding: "12px 16px",
background: pendingCount > 0 ? "#fff7ed" : "#f1f5f9",
borderRadius: "8px",
border: "1px solid #e2e8f0",
fontWeight: "bold"
}}
>
🔔 Inscriptions en attente : {pendingCount}
</div>
)}

<div
style={{
display: "flex",
gap: "12px",
flexWrap: "wrap",
marginTop: "30px"
}}
>
<a
href="/admin/inscriptions"
style={{
padding: "12px 20px",
background: "#1d4ed8",
color: "white",
borderRadius: "8px",
textDecoration: "none",
fontWeight: "bold"
}}
>
Validation des inscriptions
</a>

<a
href="/admin/propositions"
style={{
padding: "12px 20px",
background: "#0a7a3d",
color: "white",
borderRadius: "8px",
textDecoration: "none",
fontWeight: "bold"
}}
>
Validation exercices club
</a>

<a
href="/admin/delete-requests"
style={{
padding: "12px 20px",
background: "#b91c1c",
color: "white",
borderRadius: "8px",
textDecoration: "none",
fontWeight: "bold"
}}
>
Demandes de suppression
</a>

<a
href="/admin/coachs"
style={{
padding: "12px 20px",
background: "#6b7280",
color: "white",
borderRadius: "8px",
textDecoration: "none",
fontWeight: "bold"
}}
>
Gestion des entraîneurs
</a>
</div>
</main>
);
}
