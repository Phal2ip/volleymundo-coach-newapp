"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import CoachNav from "../../../components/CoachNav";

type SessionData = {
  id: string;
  title: string;
  category: string | null;
  session_date: string | null;
  notes: string | null;
};

type DrillSource = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  theme: string | null;
  duration: number | null;
  material: string | null;
};

type SessionItem = {
  id: string;
  position: number | null;
  planned_duration: number | null;
  notes: string | null;
  user_drills: DrillSource | DrillSource[] | null;
  club_drills: DrillSource | DrillSource[] | null;
};

type Coach = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type UserDrill = DrillSource;
type ClubDrill = DrillSource;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function DetailEntrainementPage({ params }: PageProps) {
  const [sessionId, setSessionId] = useState("");
  const [coach, setCoach] = useState<Coach | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [userDrills, setUserDrills] = useState<UserDrill[]>([]);
  const [clubDrills, setClubDrills] = useState<ClubDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formValues, setFormValues] = useState<
    Record<
      string,
      {
        position: number;
        plannedDuration: number;
        notes: string;
      }
    >
  >({});

  async function loadAll(resolvedId: string) {
    const supabase = createClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      setError("Utilisateur non connecté.");
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

    const { data: sessionData, error: sessionError } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("id", resolvedId)
      .single();

    if (sessionError || !sessionData) {
      setError("Séance introuvable.");
      setLoading(false);
      return;
    }

    setSession(sessionData);

    const { data: itemsData, error: itemsError } = await supabase
      .from("session_items")
      .select(`
        id,
        position,
        planned_duration,
        notes,
        user_drills (
          id,
          title,
          description,
          category,
          level,
          theme,
          duration,
          material
        ),
        club_drills (
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
      .eq("session_id", resolvedId)
      .order("position", { ascending: true });

    if (itemsError) {
      setError(itemsError.message);
      setLoading(false);
      return;
    }

    setItems((itemsData as SessionItem[]) || []);

    const { data: userDrillsData, error: userDrillsError } = await supabase
      .from("user_drills")
      .select("*")
      .eq("coach_id", coachData.id)
      .order("created_at", { ascending: false });

    if (userDrillsError) {
      setError(userDrillsError.message);
      setLoading(false);
      return;
    }

    const { data: clubDrillsData, error: clubDrillsError } = await supabase
      .from("club_drills")
      .select("*")
      .order("created_at", { ascending: false });

    if (clubDrillsError) {
      setError(clubDrillsError.message);
      setLoading(false);
      return;
    }

    const uDrills = (userDrillsData as UserDrill[]) || [];
    const cDrills = (clubDrillsData as ClubDrill[]) || [];

    setUserDrills(uDrills);
    setClubDrills(cDrills);

    const defaults: Record<
      string,
      { position: number; plannedDuration: number; notes: string }
    > = {};

    [...uDrills, ...cDrills].forEach((drill) => {
      defaults[drill.id] = {
        position: 1,
        plannedDuration: drill.duration || 10,
        notes: ""
      };
    });

    setFormValues(defaults);
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      const resolved = await params;
      setSessionId(resolved.id);
      await loadAll(resolved.id);
    }

    init();
  }, [params]);

  function updateFormValue(
    drillId: string,
    field: "position" | "plannedDuration" | "notes",
    value: string
  ) {
    setFormValues((prev) => ({
      ...prev,
      [drillId]: {
        position: prev[drillId]?.position ?? 1,
        plannedDuration: prev[drillId]?.plannedDuration ?? 10,
        notes: prev[drillId]?.notes ?? "",
        [field]:
          field === "notes"
            ? value
            : Number(value) || (field === "position" ? 1 : 10)
      }
    }));
  }

  async function handleAddUserDrillToSession(drill: UserDrill) {
    const supabase = createClient();
    const values = formValues[drill.id];

    const { error: insertError } = await supabase.from("session_items").insert({
      session_id: sessionId,
      user_drill_id: drill.id,
      club_drill_id: null,
      position: values.position,
      planned_duration: values.plannedDuration,
      notes: values.notes || null
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage("Exercice personnel ajouté à la séance.");
    await loadAll(sessionId);
  }

  async function handleAddClubDrillToSession(drill: ClubDrill) {
    const supabase = createClient();
    const values = formValues[drill.id];

    const { error: insertError } = await supabase.from("session_items").insert({
      session_id: sessionId,
      user_drill_id: null,
      club_drill_id: drill.id,
      position: values.position,
      planned_duration: values.plannedDuration,
      notes: values.notes || null
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage("Exercice de la base club ajouté à la séance.");
    await loadAll(sessionId);
  }

  async function handleDelete(itemId: string) {
    if (!confirm("Supprimer cet exercice de la séance ?")) return;

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("session_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage("Exercice supprimé de la séance.");
    await loadAll(sessionId);
  }

  function resolveDrill(item: SessionItem): DrillSource | null {
    const userDrill = Array.isArray(item.user_drills)
      ? item.user_drills[0]
      : item.user_drills;

    const clubDrill = Array.isArray(item.club_drills)
      ? item.club_drills[0]
      : item.club_drills;

    return userDrill || clubDrill || null;
  }

  function resolveSource(item: SessionItem) {
    const userDrill = Array.isArray(item.user_drills)
      ? item.user_drills[0]
      : item.user_drills;

    return userDrill ? "Exercice personnel" : "Base club";
  }

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <CoachNav />
        <p>Chargement de la séance...</p>
      </main>
    );
  }

  const totalDuration =
    items.reduce((total, item) => {
      const drill = resolveDrill(item);
      return total + (item.planned_duration || drill?.duration || 0);
    }, 0) || 0;

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <CoachNav />

      {message && (
        <p style={{ color: "green", fontWeight: "bold", marginBottom: "20px" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "red", fontWeight: "bold", marginBottom: "20px" }}>
          {error}
        </p>
      )}

      {session && (
        <>
          <h1>{session.title}</h1>
          <p><b>Catégorie :</b> {session.category || "Non renseignée"}</p>
          <p><b>Date :</b> {session.session_date || "Non renseignée"}</p>
          <p><b>Notes :</b> {session.notes || "Aucune note"}</p>
          <h3>Durée totale : {totalDuration} min</h3>
        </>
      )}

      <h2>Exercices de la séance</h2>

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        {items.map((item) => {
          const drill = resolveDrill(item);
          if (!drill) return null;

          return (
            <div
              key={item.id}
              style={{
                border: "1px solid #ccc",
                padding: "20px",
                borderRadius: "8px"
              }}
            >
              <h3>
                {item.position}. {drill.title}
              </h3>

              <p>{drill.description}</p>
              <p><b>Source :</b> {resolveSource(item)}</p>
              <p><b>Durée :</b> {item.planned_duration || drill.duration || 0} min</p>

              <button
                onClick={() => handleDelete(item.id)}
                style={{
                  background: "#dc2626",
                  color: "white",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Supprimer
              </button>
            </div>
          );
        })}

        {!items.length && <p>Aucun exercice ajouté pour le moment.</p>}
      </div>

      <h2 style={{ marginTop: "40px" }}>Ajouter un exercice personnel</h2>

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        {userDrills.map((drill) => (
          <div
            key={`user-${drill.id}`}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "8px"
            }}
          >
            <h3>{drill.title}</h3>
            <p>{drill.description}</p>
            <p><b>Source :</b> Exercice personnel</p>
            <p><b>Durée :</b> {drill.duration || 0} min</p>

            <div>
              <div style={{ marginBottom: "10px" }}>
                <label>Position</label>
                <br />
                <input
                  type="number"
                  value={formValues[drill.id]?.position || 1}
                  onChange={(e) =>
                    updateFormValue(drill.id, "position", e.target.value)
                  }
                  style={{ padding: "8px", width: "120px" }}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Durée prévue</label>
                <br />
                <input
                  type="number"
                  value={formValues[drill.id]?.plannedDuration || 10}
                  onChange={(e) =>
                    updateFormValue(drill.id, "plannedDuration", e.target.value)
                  }
                  style={{ padding: "8px", width: "120px" }}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Notes</label>
                <br />
                <textarea
                  value={formValues[drill.id]?.notes || ""}
                  onChange={(e) =>
                    updateFormValue(drill.id, "notes", e.target.value)
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    minHeight: "80px",
                    padding: "10px"
                  }}
                />
              </div>

              <button
                onClick={() => handleAddUserDrillToSession(drill)}
                style={{
                  marginTop: "10px",
                  background: "#0a7a3d",
                  color: "white",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Ajouter à la séance
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: "40px" }}>Ajouter un exercice de la base club</h2>

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        {clubDrills.map((drill) => (
          <div
            key={`club-${drill.id}`}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "8px"
            }}
          >
            <h3>{drill.title}</h3>
            <p>{drill.description}</p>
            <p><b>Source :</b> Base club</p>
            <p><b>Durée :</b> {drill.duration || 0} min</p>

            <div>
              <div style={{ marginBottom: "10px" }}>
                <label>Position</label>
                <br />
                <input
                  type="number"
                  value={formValues[drill.id]?.position || 1}
                  onChange={(e) =>
                    updateFormValue(drill.id, "position", e.target.value)
                  }
                  style={{ padding: "8px", width: "120px" }}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Durée prévue</label>
                <br />
                <input
                  type="number"
                  value={formValues[drill.id]?.plannedDuration || 10}
                  onChange={(e) =>
                    updateFormValue(drill.id, "plannedDuration", e.target.value)
                  }
                  style={{ padding: "8px", width: "120px" }}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Notes</label>
                <br />
                <textarea
                  value={formValues[drill.id]?.notes || ""}
                  onChange={(e) =>
                    updateFormValue(drill.id, "notes", e.target.value)
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    minHeight: "80px",
                    padding: "10px"
                  }}
                />
              </div>

              <button
                onClick={() => handleAddClubDrillToSession(drill)}
                style={{
                  marginTop: "10px",
                  background: "#1d4ed8",
                  color: "white",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Ajouter à la séance
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}