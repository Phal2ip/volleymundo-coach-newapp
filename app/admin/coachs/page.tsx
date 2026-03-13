"use client";

import { useEffect, useState } from "react";
import CoachNav from "../../../components/CoachNav";
import { createClient } from "../../../lib/supabase/client";

type Coach = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function AdminCoachsPage() {
  const [coachs, setCoachs] = useState<Coach[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCoachs() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("coaches")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setCoachs(data || []);
  }

  useEffect(() => {
    loadCoachs();
  }, []);

  async function disableCoach(id: string) {
    const supabase = createClient();

    const { error } = await supabase
      .from("coaches")
      .update({ status: "inactive" })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Entraîneur désactivé.");
    loadCoachs();
  }

  async function enableCoach(id: string) {
    const supabase = createClient();

    const { error } = await supabase
      .from("coaches")
      .update({ status: "active" })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Entraîneur réactivé.");
    loadCoachs();
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

      <h1>Gestion des entraîneurs</h1>

      {message && <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>}
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        {coachs.map((coach) => (
          <div
            key={coach.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px"
            }}
          >
            <h3 style={{ marginTop: 0 }}>{coach.name}</h3>
            <p><b>Email :</b> {coach.email}</p>
            <p><b>Rôle :</b> {coach.role}</p>
            <p><b>Statut :</b> {coach.status}</p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
              {coach.status === "active" ? (
                <button
                  onClick={() => disableCoach(coach.id)}
                  style={dangerButton}
                >
                  Désactiver
                </button>
              ) : (
                <button
                  onClick={() => enableCoach(coach.id)}
                  style={greenButton}
                >
                  Réactiver
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const greenButton = {
  background: "#0a7a3d",
  color: "white",
  padding: "10px 14px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};

const dangerButton = {
  background: "#b91c1c",
  color: "white",
  padding: "10px 14px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};