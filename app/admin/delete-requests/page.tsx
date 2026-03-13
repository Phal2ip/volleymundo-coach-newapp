"use client";

import { useEffect, useState } from "react";
import CoachNav from "../../../components/CoachNav";
import { createClient } from "../../../lib/supabase/client";

type DeleteRequest = {
  id: string;
  status: string;
  club_drill_id: string;
  admin_reason: string | null;
  club_drills:
    | {
        title: string;
        description: string;
        category: string;
        level: string;
        theme: string;
        duration: number;
        material: string;
      }
    | {
        title: string;
        description: string;
        category: string;
        level: string;
        theme: string;
        duration: number;
        material: string;
      }[]
    | null;
  coaches:
    | {
        name: string;
        email: string;
      }
    | {
        name: string;
        email: string;
      }[]
    | null;
};

export default function AdminDeleteRequestsPage() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  async function loadRequests() {
    setMessage("");
    setError("");

    const { data, error } = await supabase
      .from("club_drill_delete_requests")
      .select(`
        id,
        status,
        club_drill_id,
        admin_reason,
        club_drills (
          title,
          description,
          category,
          level,
          theme,
          duration,
          material
        ),
        coaches (
          name,
          email
        )
      `)
      .eq("status", "pending");

    if (error) {
      setError(error.message);
      return;
    }

    setRequests((data as DeleteRequest[]) || []);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function approveRequest(request: DeleteRequest) {
    setMessage("");
    setError("");

    const { error: deleteError } = await supabase
      .from("club_drills")
      .delete()
      .eq("id", request.club_drill_id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("club_drill_delete_requests")
      .update({
        status: "approved",
        admin_reason: null
      })
      .eq("id", request.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("La suppression a été validée et l'exercice a été supprimé.");
    loadRequests();
  }

  async function rejectRequest(id: string) {
    setMessage("");
    setError("");

    const reason = prompt(
      "Merci de saisir le motif du refus de suppression :"
    );

    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setError("Le motif du refus est obligatoire.");
      return;
    }

    const { error } = await supabase
      .from("club_drill_delete_requests")
      .update({
        status: "rejected",
        admin_reason: trimmedReason
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("La demande de suppression a été refusée avec un motif.");
    loadRequests();
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

      <h1>Demandes de suppression d'exercices</h1>

      {message && <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>}
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      {requests.length === 0 && !error && (
        <p>Aucune demande de suppression en attente.</p>
      )}

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        {requests.map((req) => {
          const drill = Array.isArray(req.club_drills)
            ? req.club_drills[0]
            : req.club_drills;

          const requester = Array.isArray(req.coaches)
            ? req.coaches[0]
            : req.coaches;

          if (!drill) return null;

          return (
            <div
              key={req.id}
              style={{
                border: "1px solid #ccc",
                padding: "20px",
                borderRadius: "8px"
              }}
            >
              <h3>{drill.title}</h3>
              <p>{drill.description}</p>
              <p><b>Catégorie :</b> {drill.category}</p>
              <p><b>Niveau :</b> {drill.level}</p>
              <p><b>Thème :</b> {drill.theme}</p>
              <p><b>Durée :</b> {drill.duration} min</p>
              <p><b>Matériel :</b> {drill.material}</p>

              {requester && (
                <p>
                  <b>Demandé par :</b> {requester.name} ({requester.email})
                </p>
              )}

              <div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => approveRequest(req)}
                  style={{
                    background: "#b91c1c",
                    color: "white",
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Valider la suppression
                </button>

                <button
                  onClick={() => rejectRequest(req.id)}
                  style={{
                    background: "#0a7a3d",
                    color: "white",
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Refuser la suppression
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}