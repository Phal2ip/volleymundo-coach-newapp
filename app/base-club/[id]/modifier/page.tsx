"use client";

import { useEffect, useState } from "react";
import CoachNav from "../../../../components/CoachNav";
import { createClient } from "../../../../lib/supabase/client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ModifierExerciceClubPage({ params }: PageProps) {
  const [drillId, setDrillId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [theme, setTheme] = useState("");
  const [duration, setDuration] = useState("");
  const [material, setMaterial] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDrill() {
      const resolved = await params;
      setDrillId(resolved.id);

      const supabase = createClient();

      const { data, error } = await supabase
        .from("club_drills")
        .select("*")
        .eq("id", resolved.id)
        .single();

      if (error || !data) {
        setError("Exercice introuvable.");
        setLoading(false);
        return;
      }

      setTitle(data.title || "");
      setDescription(data.description || "");
      setCategory(data.category || "");
      setLevel(data.level || "");
      setTheme(data.theme || "");
      setDuration(String(data.duration || ""));
      setMaterial(data.material || "");
      setLoading(false);
    }

    loadDrill();
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("club_drills")
      .update({
        title,
        description,
        category,
        level,
        theme,
        duration: Number(duration) || null,
        material
      })
      .eq("id", drillId);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Exercice de la base club modifié avec succès.");

    setTimeout(() => {
      window.location.href = "/base-club";
    }, 1500);
  }

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <CoachNav />
        <p>Chargement de l'exercice...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <CoachNav />

      <h1>Modifier un exercice de la base club</h1>

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
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Niveau</label>
          <br />
          <input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Thème</label>
          <br />
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
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
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "12px 20px",
            background: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Enregistrer les modifications
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