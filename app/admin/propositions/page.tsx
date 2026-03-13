"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import CoachNav from "../../../components/CoachNav";

type Drill = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  theme: string;
  duration: number;
  material: string;
};

type Submission = {
  id: string;
  status: string;
  created_at: string;
  user_drills: Drill | Drill[] | null;
};

export default function AdminPropositions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  async function loadSubmissions() {
    setError("");

    const { data, error } = await supabase
      .from("drill_submissions")
      .select(`
        id,
        status,
        created_at,
        user_drills (
          id,
          title,
          description,
          category,
          level,
          theme,
          duration,
          material
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setSubmissions((data ?? []) as Submission[]);
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  function getDrill(sub: Submission): Drill | null {
    if (!sub.user_drills) return null;
    return Array.isArray(sub.user_drills) ? sub.user_drills[0] ?? null : sub.user_drills;
  }

  async function validateOnly(id: string) {
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("drill_submissions")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Exercice validé.");
    loadSubmissions();
  }

  async function publishToClub(sub: Submission) {
    setMessage("");
    setError("");

    const drill = getDrill(sub);

    if (!drill) {
      setError("Exercice introuvable dans la proposition.");
      return;
    }

    const { error: insertError } = await supabase.from("club_drills").insert({
      title: drill.title,
      description: drill.description,
      category: drill.category,
      level: drill.level,
      theme: drill.theme,
      duration: drill.duration,
      material: drill.material
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("drill_submissions")
      .update({ status: "approved" })
      .eq("id", sub.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Exercice publié dans la base club et validé.");
    loadSubmissions();
  }

  async function refuse(id: string) {
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("drill_submissions")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Exercice refusé.");
    loadSubmissions();
  }

  function renderStatusBadge(status: string) {
    if (status === "approved") {
      return (
        <span
          style={{
            display: "inline-block",
            padding: "6px 12px",
            background: "#0a7a3d",
            color: "white",
            borderRadius: "999px",
            fontWeight: "bold",
            fontSize: "0.9rem"
          }}
        >
          Validé
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span
          style={{
            display: "inline-block",
            padding: "6px 12px",
            background: "#b91c1c",
            color: "white",
            borderRadius: "999px",
            fontWeight: "bold",
            fontSize: "0.9rem"
          }}
        >
          Refusé
        </span>
      );
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "6px 12px",
          background: "#f59e0b",
          color: "white",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "0.9rem"
        }}
      >
        En attente
      </span>
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

      <h1>Validation admin</h1>

      {message && <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>}
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      {submissions.length === 0 && !error && (
        <p>Aucune proposition pour le moment.</p>
      )}

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        {submissions.map((sub) => {
          const drill = getDrill(sub);
          if (!drill) return null;

          const isPending = sub.status === "pending";

          return (
            <div
              key={sub.id}
              style={{
                border: "1px solid #ccc",
                padding: "20px",
                borderRadius: "8px"
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
                <h3 style={{ marginTop: 0 }}>{drill.title}</h3>
                {renderStatusBadge(sub.status)}
              </div>

              <p>{drill.description}</p>
              <p><b>Catégorie :</b> {drill.category}</p>
              <p><b>Niveau :</b> {drill.level}</p>
              <p><b>Thème :</b> {drill.theme}</p>
              <p><b>Durée :</b> {drill.duration} min</p>
              <p><b>Matériel :</b> {drill.material}</p>

              {isPending && (
                <div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => validateOnly(sub.id)}
                    style={{
                      background: "#0a7a3d",
                      color: "white",
                      padding: "8px 14px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Valider
                  </button>

                  <button
                    onClick={() => publishToClub(sub)}
                    style={{
                      background: "#1d4ed8",
                      color: "white",
                      padding: "8px 14px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Publier dans la base club
                  </button>

                  <button
                    onClick={() => refuse(sub.id)}
                    style={{
                      background: "#b91c1c",
                      color: "white",
                      padding: "8px 14px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Refuser
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}