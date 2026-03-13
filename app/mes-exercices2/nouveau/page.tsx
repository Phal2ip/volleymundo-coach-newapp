"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import CoachNav from "../../../components/CoachNav";

export default function NouveauExercicePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [theme, setTheme] = useState("");
  const [duration, setDuration] = useState("");
  const [material, setMaterial] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (redirectSeconds === null) return;

    if (redirectSeconds <= 0) {
      window.location.href = "/mes-exercices2";
      return;
    }

    const timer = setTimeout(() => {
      setRedirectSeconds((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectSeconds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setRedirectSeconds(null);

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

    const { error: insertError } = await supabase.from("user_drills").insert({
      coach_id: coach.id,
      title,
      description,
      category,
      level,
      theme,
      duration: Number(duration) || null,
      material
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage(
      "Exercice créé avec succès. Vous allez être redirigé automatiquement vers la page Mes exercices."
    );

    setTitle("");
    setDescription("");
    setCategory("");
    setLevel("");
    setTheme("");
    setDuration("");
    setMaterial("");
    setRedirectSeconds(5);
  }

  const progressPercent =
    redirectSeconds === null ? 0 : ((5 - redirectSeconds) / 5) * 100;

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <CoachNav />

      <h1>Créer un exercice</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: "700px", marginTop: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label>Titre</label>
          <br />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Description</label>
          <br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", padding: "10px", minHeight: "120px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Catégorie</label>
          <br />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="M13, M15, Seniors..."
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Niveau</label>
          <br />
          <input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Débutant, Intermédiaire..."
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Thème</label>
          <br />
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Service, réception..."
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Durée (minutes)</label>
          <br />
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Matériel</label>
          <br />
          <input
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Ballons, plots..."
            style={{ width: "100%", padding: "10px" }}
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
          Enregistrer l'exercice
        </button>
      </form>

      {message && (
        <div style={{ marginTop: "25px", maxWidth: "700px" }}>
          <p style={{ color: "green", fontWeight: "bold", marginBottom: "10px" }}>
            {message}
          </p>

          {redirectSeconds !== null && (
            <>
              <p style={{ marginBottom: "10px" }}>
                Redirection dans {redirectSeconds} seconde{redirectSeconds > 1 ? "s" : ""}...
              </p>

              <div
                style={{
                  width: "100%",
                  height: "16px",
                  background: "#e5e7eb",
                  borderRadius: "999px",
                  overflow: "hidden",
                  border: "1px solid #ccc"
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: "#0a7a3d",
                    transition: "width 1s linear"
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: "red", marginTop: "20px" }}>
          {error}
        </p>
      )}
    </main>
  );
}