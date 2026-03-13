"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import CoachNav from "../../components/CoachNav";

type TrainingSession = {
  id: string;
  title: string;
  category: string | null;
  session_date: string | null;
  notes: string | null;
};

type Coach = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type UserDrill = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  theme: string | null;
  duration: number | null;
  material: string | null;
};

type ClubDrill = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  theme: string | null;
  duration: number | null;
  material: string | null;
};

type GeneratorSource = "user" | "club" | "mixed";

export default function EntrainementsPage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [generatorTitle, setGeneratorTitle] = useState("");
  const [generatorCategory, setGeneratorCategory] = useState("");
  const [generatorTheme, setGeneratorTheme] = useState("");
  const [generatorDuration, setGeneratorDuration] = useState("90");
  const [generatorDate, setGeneratorDate] = useState("");
  const [generatorNotes, setGeneratorNotes] = useState("");
  const [generatorSource, setGeneratorSource] = useState<GeneratorSource>("mixed");
  const [isGenerating, setIsGenerating] = useState(false);

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

    const { data: sessionsData, error: sessionsError } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("coach_id", coachData.id)
      .order("created_at", { ascending: false });

    if (sessionsError) {
      setError(sessionsError.message);
      setLoading(false);
      return;
    }

    setSessions(sessionsData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function normalize(s: string | null | undefined) {
    return (s || "").trim().toLowerCase();
  }

  function drillMatches(
    drill: {
      category: string | null;
      theme: string | null;
    },
    category: string,
    theme: string
  ) {
    const categoryOk = !category || normalize(drill.category) === normalize(category);
    const themeOk = !theme || normalize(drill.theme).includes(normalize(theme));
    return categoryOk && themeOk;
  }

  async function handleGenerateTraining() {
    if (!coach) return;

    setError("");
    setMessage("");

    const cleanTitle = generatorTitle.trim();
    const cleanTheme = generatorTheme.trim();
    const cleanCategory = generatorCategory.trim();
    const targetDuration = Number(generatorDuration);

    if (!cleanTitle) {
      setError("Merci de renseigner un titre pour l'entraînement.");
      return;
    }

    if (!cleanTheme) {
      setError("Merci de renseigner un thème principal.");
      return;
    }

    if (!targetDuration || targetDuration <= 0) {
      setError("Merci de renseigner une durée valide.");
      return;
    }

    setIsGenerating(true);

    const supabase = createClient();

    const { data: userDrillsData, error: userDrillsError } = await supabase
      .from("user_drills")
      .select("*")
      .eq("coach_id", coach.id)
      .order("created_at", { ascending: false });

    if (userDrillsError) {
      setError(userDrillsError.message);
      setIsGenerating(false);
      return;
    }

    const { data: clubDrillsData, error: clubDrillsError } = await supabase
      .from("club_drills")
      .select("*")
      .order("created_at", { ascending: false });

    if (clubDrillsError) {
      setError(clubDrillsError.message);
      setIsGenerating(false);
      return;
    }

    const userDrills = ((userDrillsData as UserDrill[]) || []).filter((drill) =>
      drillMatches(drill, cleanCategory, cleanTheme)
    );

    const clubDrills = ((clubDrillsData as ClubDrill[]) || []).filter((drill) =>
      drillMatches(drill, cleanCategory, cleanTheme)
    );

    let selectedUserDrills: UserDrill[] = [];
    let selectedClubDrills: ClubDrill[] = [];

    if (generatorSource === "user") {
      selectedUserDrills = userDrills;
    } else if (generatorSource === "club") {
      selectedClubDrills = clubDrills;
    } else {
      selectedUserDrills = userDrills;
      selectedClubDrills = clubDrills;
    }

    if (
      generatorSource === "user" &&
      selectedUserDrills.length === 0
    ) {
      setError("Aucun exercice personnel ne correspond à cette catégorie et ce thème.");
      setIsGenerating(false);
      return;
    }

    if (
      generatorSource === "club" &&
      selectedClubDrills.length === 0
    ) {
      setError("Aucun exercice de la base club ne correspond à cette catégorie et ce thème.");
      setIsGenerating(false);
      return;
    }

    if (
      generatorSource === "mixed" &&
      selectedUserDrills.length === 0 &&
      selectedClubDrills.length === 0
    ) {
      setError("Aucun exercice disponible dans tes exercices ou dans la base club pour cette catégorie et ce thème.");
      setIsGenerating(false);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from("training_sessions")
      .insert({
        coach_id: coach.id,
        title: cleanTitle,
        category: cleanCategory || null,
        session_date: generatorDate || null,
        notes: generatorNotes || null
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      setError(sessionError?.message || "Impossible de créer l'entraînement.");
      setIsGenerating(false);
      return;
    }

    let total = 0;
    let position = 1;

    const sessionItems: Array<{
      session_id: string;
      user_drill_id: string | null;
      club_drill_id: string | null;
      position: number;
      planned_duration: number;
      notes: string;
    }> = [];

    function tryAddUserDrills(list: UserDrill[]) {
      for (const drill of list) {
        const duration = drill.duration || 10;
        if (total >= targetDuration) break;

        sessionItems.push({
          session_id: sessionData.id,
          user_drill_id: drill.id,
          club_drill_id: null,
          position,
          planned_duration: duration,
          notes: `Ajout automatique - source : exercices personnels - thème : ${cleanTheme}`
        });

        total += duration;
        position += 1;
      }
    }

    function tryAddClubDrills(list: ClubDrill[]) {
      for (const drill of list) {
        const duration = drill.duration || 10;
        if (total >= targetDuration) break;

        sessionItems.push({
          session_id: sessionData.id,
          user_drill_id: null,
          club_drill_id: drill.id,
          position,
          planned_duration: duration,
          notes: `Ajout automatique - source : base club - thème : ${cleanTheme}`
        });

        total += duration;
        position += 1;
      }
    }

    if (generatorSource === "user") {
      tryAddUserDrills(selectedUserDrills);
    } else if (generatorSource === "club") {
      tryAddClubDrills(selectedClubDrills);
    } else {
      tryAddUserDrills(selectedUserDrills);
      if (total < targetDuration) {
        tryAddClubDrills(selectedClubDrills);
      }
    }

    if (!sessionItems.length) {
      setError("Impossible de générer les éléments de séance.");
      setIsGenerating(false);
      return;
    }

    const { error: itemsError } = await supabase
      .from("session_items")
      .insert(sessionItems);

    if (itemsError) {
      setError(itemsError.message);
      setIsGenerating(false);
      return;
    }

    setMessage(
      `Entraînement généré avec succès : ${sessionItems.length} exercice(s), ${total} min au total. Redirection en cours...`
    );

    setGeneratorTitle("");
    setGeneratorCategory("");
    setGeneratorTheme("");
    setGeneratorDuration("90");
    setGeneratorDate("");
    setGeneratorNotes("");
    setGeneratorSource("mixed");

    await loadData();

    setTimeout(() => {
      window.location.href = `/entrainements/${sessionData.id}`;
    }, 2500);

    setIsGenerating(false);
  }

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <CoachNav />
        <p>Chargement de mes entraînements...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <CoachNav />

      <h1>Mes entraînements</h1>
      <p>Retrouve ici toutes tes séances d'entraînement.</p>

      <div
        style={{
          marginTop: "25px",
          marginBottom: "30px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          background: "#f9fafb",
          maxWidth: "900px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Générateur automatique d'entraînement</h2>
        <p>
          Crée automatiquement une séance à partir de la base club, de tes exercices
          personnels, ou d’un mode mixte.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px"
          }}
        >
          <div>
            <label>Titre de l'entraînement</label>
            <br />
            <input
              value={generatorTitle}
              onChange={(e) => setGeneratorTitle(e.target.value)}
              placeholder="Ex : Réception M15 du mercredi"
              style={{ width: "100%", padding: "10px" }}
            />
          </div>

          <div>
            <label>Catégorie</label>
            <br />
            <select
              value={generatorCategory}
              onChange={(e) => setGeneratorCategory(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            >
              <option value="">Choisir une catégorie</option>
              <option value="M11">M11</option>
              <option value="M13">M13</option>
              <option value="M15">M15</option>
              <option value="M18">M18</option>
              <option value="Féminine">Féminine</option>
              <option value="Régional">Régional</option>
              <option value="Séniors">Séniors</option>
              <option value="Séniors compétition">Séniors compétition</option>
              <option value="Toutes catégories">Toutes catégories</option>
            </select>
          </div>

          <div>
            <label>Thème principal</label>
            <br />
            <select
              value={generatorTheme}
              onChange={(e) => setGeneratorTheme(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            >
              <option value="">Choisir un thème</option>
              <option value="échauffement">échauffement</option>
              <option value="service">service</option>
              <option value="réception">réception</option>
              <option value="passe">passe</option>
              <option value="attaque">attaque</option>
              <option value="défense">défense</option>
              <option value="jeu">jeu</option>
              <option value="retour_calme">retour_calme</option>
            </select>
          </div>

          <div>
            <label>Durée souhaitée (minutes)</label>
            <br />
            <input
              type="number"
              value={generatorDuration}
              onChange={(e) => setGeneratorDuration(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            />
          </div>

          <div>
            <label>Date</label>
            <br />
            <input
              type="date"
              value={generatorDate}
              onChange={(e) => setGeneratorDate(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            />
          </div>

          <div>
            <label>Source des exercices</label>
            <br />
            <select
              value={generatorSource}
              onChange={(e) => setGeneratorSource(e.target.value as GeneratorSource)}
              style={{ width: "100%", padding: "10px" }}
            >
              <option value="mixed">Mixte club + personnels</option>
              <option value="user">Mes exercices uniquement</option>
              <option value="club">Base club uniquement</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "15px" }}>
          <label>Notes générales</label>
          <br />
          <textarea
            value={generatorNotes}
            onChange={(e) => setGeneratorNotes(e.target.value)}
            placeholder="Objectifs, consignes, remarques..."
            style={{ width: "100%", padding: "10px", minHeight: "100px" }}
          />
        </div>

        <div style={{ marginTop: "18px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={handleGenerateTraining}
            disabled={isGenerating}
            style={{
              padding: "12px 20px",
              background: "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isGenerating ? "default" : "pointer",
              fontWeight: "bold",
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating
              ? "Génération en cours..."
              : "Générer automatiquement l'entraînement"}
          </button>

          <a
            href="/entrainements/nouveau"
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
            Créer un entraînement manuellement
          </a>
        </div>
      </div>

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

      <div style={{ display: "grid", gap: "20px", marginTop: "25px" }}>
        {sessions.map((session) => (
          <div
            key={session.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
            }}
          >
            <h2 style={{ marginTop: 0 }}>{session.title}</h2>
            <p><strong>Catégorie :</strong> {session.category || "Non renseignée"}</p>
            <p><strong>Date :</strong> {session.session_date || "Non renseignée"}</p>
            <p><strong>Notes :</strong> {session.notes || "Aucune note"}</p>

            <div style={{ marginTop: "15px" }}>
              <a
                href={`/entrainements/${session.id}`}
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
                Ouvrir la séance
              </a>
            </div>
          </div>
        ))}

        {!sessions.length && !error && (
          <p>Aucun entraînement pour le moment.</p>
        )}
      </div>
    </main>
  );
}