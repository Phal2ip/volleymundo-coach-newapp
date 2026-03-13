"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import CoachNav from "../../components/CoachNav";

type Coach = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function DashboardPage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCoach() {
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
      setError("Coach introuvable dans la table coaches.");
      setLoading(false);
      return;
    }

    setCoach(coachData);
    setLoading(false);
  }

  useEffect(() => {
    loadCoach();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <CoachNav />
        <p>Chargement du profil...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <CoachNav />
        <h1>Dashboard</h1>
        <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <CoachNav />

      <h1>Tableau de bord entraîneur</h1>

      {coach?.role === "admin" ? (
        <p>
          Bienvenue <strong>{coach.name}</strong> dans l'espace administration du
          club.
          <br />
          Utilisez le menu <strong>Admin</strong> pour gérer les validations.
        </p>
      ) : (
        <p>
          Bienvenue <strong>{coach?.name}</strong> dans l'espace entraîneur du
          club.
        </p>
      )}

      <div
        style={{
          marginTop: "30px",
          display: "grid",
          gap: "20px",
          maxWidth: "520px"
        }}
      >
        <a href="/base-club" style={cardStyle}>
          Base club des exercices
        </a>

        <a href="/mes-exercices2" style={cardStyle}>
          Mes exercices
        </a>

        <a href="/entrainements" style={cardStyle}>
          Mes entraînements
        </a>
      </div>
    </main>
  );
}

const cardStyle = {
  display: "block",
  padding: "18px 20px",
  background: "#0a7a3d",
  color: "white",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: "bold"
};