"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Coach = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function CoachNav() {
  const [coach, setCoach] = useState<Coach | null>(null);

  useEffect(() => {
    async function loadCoach() {
      const supabase = createClient();

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user || !user.email) return;

      const { data: coachData } = await supabase
        .from("coaches")
        .select("*")
        .eq("email", user.email)
        .single();

      if (coachData) {
        setCoach(coachData);
      }
    }

    loadCoach();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header
      style={{
        marginBottom: "30px",
        border: "1px solid #ddd",
        borderRadius: "14px",
        background: "#f8fafc",
        overflow: "hidden",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
            Application Entraîneurs
          </div>
          <div style={{ color: "#555", marginTop: "4px" }}>
            {coach
              ? `Connecté : ${coach.name} (${coach.role})`
              : "Chargement du profil..."}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 16px",
            background: "#444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Déconnexion
        </button>
      </div>

      <nav
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          padding: "16px 20px",
          background: "white"
        }}
      >
        <a href="/dashboard" style={linkStyle}>
          Dashboard
        </a>

        <a href="/base-club" style={linkStyle}>
          Base club
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
			</a>

			<a href="/admin/coachs" style={linkStyle}>
			  Gérer les coachs
			</a>
		  </>
		)}
      </nav>
    </header>
  );
}

const linkStyle = {
  display: "inline-block",
  padding: "10px 14px",
  background: "#0a7a3d",
  color: "white",
  textDecoration: "none",
  borderRadius: "8px",
  fontWeight: "bold"
};