"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Coach = {
id: string;
name: string;
email: string;
role: string;
status: string;
};

export default function CoachNav() {
const [coach, setCoach] = useState<Coach | null>(null);
const [pendingCount, setPendingCount] = useState<number>(0);

useEffect(() => {
async function loadCoach() {
const supabase = createClient();

const {
data: { user }
} = await supabase.auth.getUser();

if (!user?.email) return;

const { data: coachData } = await supabase
.from("coaches")
.select("*")
.eq("email", user.email)
.single();

if (!coachData) return;

setCoach(coachData);

if (coachData.role === "admin") {
const { count } = await supabase
.from("coaches")
.select("*", { count: "exact", head: true })
.eq("status", "pending");

setPendingCount(count || 0);
}
}

loadCoach();
}, []);

async function handleLogout() {
const supabase = createClient();
await supabase.auth.signOut();
window.location.href = "/login";
}

const linkStyle: React.CSSProperties = {
color: "white",
textDecoration: "none",
fontWeight: "bold",
padding: "10px 14px",
borderRadius: "8px",
background: "rgba(255,255,255,0.12)",
display: "inline-flex",
alignItems: "center",
gap: "8px"
};

const badgeStyle: React.CSSProperties = {
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
minWidth: "20px",
height: "20px",
padding: "0 6px",
borderRadius: "999px",
background: "#dc2626",
color: "white",
fontSize: "0.75rem",
fontWeight: "bold",
lineHeight: 1
};

return (
<nav
style={{
display: "flex",
gap: "10px",
flexWrap: "wrap",
alignItems: "center",
padding: "14px 18px",
background: "#0a7a3d",
borderRadius: "10px",
marginBottom: "30px"
}}
>
<a href="/dashboard" style={linkStyle}>
Dashboard
</a>

<a href="/base-club" style={linkStyle}>
Base Club
</a>

<a href="/mes-exercices2" style={linkStyle}>
Mes exercices
</a>

<a href="/entrainements" style={linkStyle}>
Mes entraînements
</a>

{coach?.role === "admin" && (
<>
<a href="/admin" style={linkStyle}>
Admin
{pendingCount >= 0 && <span style={badgeStyle}>{pendingCount}</span>}
</a>

<a href="/admin/coachs" style={linkStyle}>
Gérer les coachs
</a>
</>
)}

<button
onClick={handleLogout}
style={{
marginLeft: "auto",
padding: "10px 14px",
borderRadius: "8px",
border: "none",
background: "#b91c1c",
color: "white",
fontWeight: "bold",
cursor: "pointer"
}}
>
Déconnexion
</button>
</nav>
);
}