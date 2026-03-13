"use client";

import { useState } from "react";
import CoachNav from "../../../components/CoachNav";
import { createClient } from "../../../lib/supabase/client";

export default function AdminResetPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  async function runSteps(steps: PromiseLike<{ error: any }>[]) {
    for (const step of steps) {
      const { error } = await step;
      if (error) {
        setError(error.message);
        return false;
      }
    }
    return true;
  }

  async function handleResetDataOnly() {
    const ok = confirm(
      "Confirmez-vous le reset des données de test ?\n\nCela supprimera :\n- les exercices personnels\n- les séances\n- les éléments de séance\n- les propositions d'exercices\n\nLes coachs rattachés au club seront conservés."
    );

    if (!ok) return;

    setMessage("");
    setError("");
    setLoadingAction("data");

    const supabase = createClient();

    const steps = [
      supabase.from("session_items").delete().not("id", "is", null),
      supabase.from("training_sessions").delete().not("id", "is", null),
      supabase.from("drill_submissions").delete().not("id", "is", null),
      supabase.from("user_drills").delete().not("id", "is", null)
    ];

    const success = await runSteps(steps);

    if (success) {
      setMessage(
        "Reset des données de test effectué. Les coachs du club ont été conservés."
      );
    }

    setLoadingAction("");
  }

  async function handleResetDataAndCoaches() {
    const ok = confirm(
      "Confirmez-vous le reset complet des données de test et des coachs rattachés au club ?\n\nCela supprimera :\n- les exercices personnels\n- les séances\n- les éléments de séance\n- les propositions d'exercices\n- les coachs non-admin de la table coaches\n\nIMPORTANT : les comptes présents dans Authentication > Users ne seront PAS supprimés automatiquement."
    );

    if (!ok) return;

    setMessage("");
    setError("");
    setLoadingAction("full");

    const supabase = createClient();

    const steps = [
      supabase.from("session_items").delete().not("id", "is", null),
      supabase.from("training_sessions").delete().not("id", "is", null),
      supabase.from("drill_submissions").delete().not("id", "is", null),
      supabase.from("user_drills").delete().not("id", "is", null),
      supabase.from("coaches").delete().neq("role", "admin")
    ];

    const success = await runSteps(steps);

    if (success) {
      setMessage(
        "Reset complet effectué. Les données de test ont été supprimées et les coachs non-admin ont été retirés du club. Les comptes Authentication restent à supprimer manuellement si nécessaire."
      );
    }

    setLoadingAction("");
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

      <h1>Reset des données de test</h1>

      <div
        style={{
          marginTop: "20px",
          marginBottom: "25px",
          padding: "18px 20px",
          border: "1px solid #f59e0b",
          background: "#fffbeb",
          borderRadius: "10px",
          maxWidth: "900px"
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold" }}>
          Important
        </p>
        <p style={{ marginTop: "10px", marginBottom: 0 }}>
          Cette page supprime les données de l’application, mais ne supprime pas
          automatiquement les comptes présents dans <b>Authentication &gt; Users</b>.
          Si vous souhaitez repartir totalement de zéro, il faudra supprimer aussi
          ces comptes manuellement dans Supabase.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "20px",
          maxWidth: "900px"
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "20px",
            background: "#f9fafb"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Option 1 — Vider seulement les données de test</h2>
          <p>
            Supprime les exercices personnels, les séances, les éléments de séance
            et les propositions d’exercices.
          </p>
          <p>
            <b>Les coachs rattachés au club sont conservés.</b>
          </p>

          <button
            onClick={handleResetDataOnly}
            disabled={loadingAction !== ""}
            style={{
              marginTop: "10px",
              background: "#b45309",
              color: "white",
              padding: "14px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: loadingAction ? "default" : "pointer",
              fontWeight: "bold",
              opacity: loadingAction && loadingAction !== "data" ? 0.6 : 1
            }}
          >
            {loadingAction === "data"
              ? "Reset en cours..."
              : "Vider seulement les données de test"}
          </button>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "20px",
            background: "#fff7f7"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Option 2 — Vider aussi les coachs rattachés au club</h2>
          <p>
            Supprime les données de test <b>et</b> retire les coachs non-admin de la
            table <b>coaches</b>.
          </p>
          <p>
            <b>Les admins sont conservés.</b>
          </p>
          <p>
            <b>Les comptes présents dans Authentication ne sont pas supprimés automatiquement.</b>
          </p>

          <button
            onClick={handleResetDataAndCoaches}
            disabled={loadingAction !== ""}
            style={{
              marginTop: "10px",
              background: "#b91c1c",
              color: "white",
              padding: "14px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: loadingAction ? "default" : "pointer",
              fontWeight: "bold",
              opacity: loadingAction && loadingAction !== "full" ? 0.6 : 1
            }}
          >
            {loadingAction === "full"
              ? "Reset complet en cours..."
              : "Vider aussi les coachs rattachés au club"}
          </button>
        </div>
      </div>

      {message && (
        <p style={{ color: "green", fontWeight: "bold", marginTop: "25px" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "red", fontWeight: "bold", marginTop: "25px" }}>
          {error}
        </p>
      )}
    </main>
  );
}