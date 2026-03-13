"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import CoachNav from "../../../components/CoachNav";

export default function NouveauEntrainementPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      setError("Utilisateur non connecté.");
      return;
    }

    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select("*")
      .eq("email", user.email)
      .single();

    if (coachError || !coach) {
      setError("Coach introuvable.");
      return;
    }

    const { error: insertError } = await supabase.from("training_sessions").insert({
      coach_id: coach.id,
      title,
      category,
      session_date: sessionDate || null,
      notes: notes || null
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage(
      "Entraînement créé avec succès. Vous allez être redirigé automatiquement vers Mes entraînements."
    );

    setTimeout(() => {
      window.location.href = "/entrainements";
    }, 3000);
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <CoachNav />

      <h1>Créer un entraînement</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: "700px", marginTop: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label>Titre</label>
          <br />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
            placeholder="Ex : Entraînement réception M15"
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Catégorie</label>
          <br />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
            placeholder="M13, M15, M18, Seniors..."
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Date</label>
          <br />
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Notes</label>
          <br />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", padding: "10px", minHeight: "120px" }}
            placeholder="Objectifs, points à travailler, consignes..."
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "12px 20px",
            background: "#0a7a3d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Enregistrer l'entraînement
        </button>
      </form>

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
    </main>
  );
}