"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import CoachNav from "../../components/CoachNav";

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

type Coach = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type DrillSubmission = {
  id: string;
  user_drill_id: string;
  status: string;
};

export default function MesExercicesPage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [submissions, setSubmissions] = useState<DrillSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
      .from("user_drills")
      .select("*")
      .eq("coach_id", coachData.id)
      .order("created_at", { ascending: false });

    if (drillsError) {
      setError(drillsError.message);
      setLoading(false);
      return;
    }

    const { data: submissionsData, error: submissionsError } = await supabase
      .from("drill_submissions")
      .select("id, user_drill_id, status");

    if (submissionsError) {
      setError(submissionsError.message);
      setLoading(false);
      return;
    }

    setDrills(drillsData || []);
    setSubmissions((submissionsData as DrillSubmission[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function getSubmissionForDrill(drillId: string) {
    return submissions.find((submission) => submission.user_drill_id === drillId);
  }

  async function handlePropose(drillId: string) {
    if (!coach) return;

    setError("");
    setMessage("");

    const supabase = createClient();

    const { data: existingSubmission, error: existingError } = await supabase
      .from("drill_submissions")
      .select("id, status")
      .eq("user_drill_id", drillId)
      .maybeSingle();

    if (existingError) {
      setError(existingError.message);
      return;
    }

    if (existingSubmission) {
      setError("Cet exercice a déjà été proposé au club.");
      return;
    }

    const { error: insertError } = await supabase
      .from("drill_submissions")
      .insert({
        user_drill_id: drillId,
        submitted_by: coach.id,
        status: "pending"
      });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage("L'exercice a bien été proposé au club.");
    await loadData();
  }

  async function handleCancelSubmission(drillId: string) {
    setError("");
    setMessage("");

    const ok = confirm("Annuler la demande de proposition au club ?");

    if (!ok) return;

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("drill_submissions")
      .delete()
      .eq("user_drill_id", drillId)
      .eq("status", "pending");

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage("La demande de proposition au club a été annulée.");
    await loadData();
  }

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <CoachNav />
        <p>Chargement de mes exercices...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <CoachNav />

      <h1>Mes exercices</h1>
      <p>Retrouve ici tous tes exercices personnels.</p>

      <div
        style={{
          marginTop: "25px",
          marginBottom: "30px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          background: "#f9fafb",
          maxWidth: "700px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Vous souhaitez créer un exercice ?</h2>
        <p>Clique sur le bouton ci-dessous pour accéder au formulaire de création.</p>

        <a
          href="/mes-exercices2/nouveau"
          style={{
            display: "inline-block",
            padding: "12px 20px",
            background: "#0a7a3d",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold"
          }}
        >
          Créer un exercice
        </a>
      </div>

      {message && (
        <p style={{ color: "green", marginBottom: "20px", fontWeight: "bold" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "red", marginTop: "20px", fontWeight: "bold" }}>
          {error}
        </p>
      )}

      <div style={{ display: "grid", gap: "20px" }}>
        {drills.map((drill) => {
          const submission = getSubmissionForDrill(drill.id);
          const isPending = submission?.status === "pending";
          const isApproved = submission?.status === "approved";
          const isRejected = submission?.status === "rejected";

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
              <h2 style={{ marginTop: 0 }}>{drill.title}</h2>
              <p>{drill.description}</p>
              <p><strong>Catégorie :</strong> {drill.category}</p>
              <p><strong>Niveau :</strong> {drill.level}</p>
              <p><strong>Thème :</strong> {drill.theme}</p>
              <p><strong>Durée :</strong> {drill.duration} min</p>
              <p><strong>Matériel :</strong> {drill.material}</p>

              {isPending && (
                <p style={{ color: "#b45309", fontWeight: "bold" }}>
                  Proposition au club en attente.
                </p>
              )}

              {isApproved && (
                <p style={{ color: "#0a7a3d", fontWeight: "bold" }}>
                  Exercice validé par le club.
                </p>
              )}

              {isRejected && (
                <p style={{ color: "#b91c1c", fontWeight: "bold" }}>
                  Proposition refusée par le club.
                </p>
              )}

              <div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a
                  href={`/mes-exercices2/${drill.id}/modifier`}
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

                {isPending ? (
                  <button
                    onClick={() => handleCancelSubmission(drill.id)}
                    style={{
                      padding: "10px 16px",
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Annuler la demande
                  </button>
                ) : (
                  <button
                    onClick={() => handlePropose(drill.id)}
                    style={{
                      padding: "10px 16px",
                      background: "#1d4ed8",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Proposer au club
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {!drills.length && !error && (
          <p>Aucun exercice personnel pour le moment.</p>
        )}
      </div>
    </main>
  );
}