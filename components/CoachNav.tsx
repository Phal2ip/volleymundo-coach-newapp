"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
Home,
Library,
Folder,
ClipboardList,
Settings,
Users,
LogOut
} from "lucide-react";

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
background: "#b91c1c",
display: "inline-flex",
alignItems: "center",
gap: "8px",
transition: "0.2s"
};

const iconStyle = { color: "#1e3a8a" };

function handleHover(e: any, color: string) {
e.currentTarget.style.background = color;
}

return (
<div
style={{
position: "sticky",
top: 0,
zIndex: 1000,
background: "#ffffff",
paddingTop: "12px",
paddingBottom: "12px",
marginBottom: "30px",
boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
}}
>
{/* NOM DU CLUB */}
<div
style={{
textAlign: "center",
fontSize: "1.9rem",
fontWeight: "bold",
marginBottom: "14px",
color: "#111827"
}}
>
Volley Ball Club Mundolsheim
</div>

<nav
style={{
display: "flex",
gap: "10px",
flexWrap: "wrap",
alignItems: "center",
padding: "14px 18px",
background: "#ffffff",
border: "1px solid #e5e7eb",
borderRadius: "10px"
}}
>
<img
src="/Logo VBCM.png"
alt="Logo club"
style={{ height: "45px", marginRight: "10px" }}
/>

<a
href="/dashboard"
style={linkStyle}
onMouseOver={(e) => handleHover(e, "#38bdf8")}
onMouseOut={(e) => handleHover(e, "#b91c1c")}
>
<Home size={18} style={iconStyle} /> Dashboard
</a>

<a
href="/base-club"
style={linkStyle}
onMouseOver={(e) => handleHover(e, "#38bdf8")}
onMouseOut={(e) => handleHover(e, "#b91c1c")}
>
<Library size={18} style={iconStyle} /> Base Club
</a>

<a
href="/mes-exercices2"
style={linkStyle}
onMouseOver={(e) => handleHover(e, "#38bdf8")}
onMouseOut={(e) => handleHover(e, "#b91c1c")}
>
<Folder size={18} style={iconStyle} /> Mes exercices
</a>

<a
href="/entrainements"
style={linkStyle}
onMouseOver={(e) => handleHover(e, "#38bdf8")}
onMouseOut={(e) => handleHover(e, "#b91c1c")}
>
<ClipboardList size={18} style={iconStyle} /> Mes entraînements
</a>

{coach?.role === "admin" && (
<>
<a
href="/admin"
style={linkStyle}
onMouseOver={(e) => handleHover(e, "#38bdf8")}
onMouseOut={(e) => handleHover(e, "#b91c1c")}
>
<Settings size={18} style={iconStyle} /> Admin{" "}
{pendingCount > 0 && `(${pendingCount})`}
</a>

<a
href="/admin/coachs"
style={linkStyle}
onMouseOver={(e) => handleHover(e, "#38bdf8")}
onMouseOut={(e) => handleHover(e, "#b91c1c")}
>
<Users size={18} style={iconStyle} /> Coachs
</a>
</>
)}

<button
onClick={handleLogout}
onMouseOver={(e) => handleHover(e, "#374151")}
onMouseOut={(e) => handleHover(e, "#111827")}
style={{
marginLeft: "auto",
padding: "10px 14px",
borderRadius: "8px",
border: "none",
background: "#111827",
color: "white",
fontWeight: "bold",
cursor: "pointer",
display: "flex",
alignItems: "center",
gap: "6px"
}}
>
<LogOut size={18} style={iconStyle} /> Déconnexion
</button>
</nav>
</div>
);
}