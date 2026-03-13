"use client";

import { useState } from "react";
import CoachNav from "../../../components/CoachNav";
import { createClient } from "../../../lib/supabase/client";

export default function AdminReattachPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("coach");
  const [status, setStatus] = useState("active");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleReattach(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    const supabase = createClient();

    const { data: existingCoach, error: searchError } = await supabase
      .from("coaches")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (searchError) {
      setError(searchError.message);
      return;
    }

    if (existingCoach) {
      setError("Cet email est déjà rattaché à un coach dans le club.");
      return;
    }

    const { error: insertError } = await supabase.from("coaches").insert({
      name,
      email,
      role,
      status
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage(
      "Le compte existant a bien été rattaché au club. Le coach peut maintenant se connecter."
    );

    setName("");
    setEmail("");
    setRole("coach");
    setStatus("active");
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

      <h1>Réattacher un compte existant au club</h1>
      <p>
        Utilise cette page lorsqu’un compte existe déjà dans Authentication,
        mais qu’il n’est plus présent dans la table coaches.
      </p>

      <div
        style={{
          marginTop: "20px",
          marginBottom: "25px",
          padding: "18px 20px",
          border: "1px solid #f59e0b",
          background: "#fffbeb",
          borderRadius: "10px",
          maxWidth: "800px"
        }}
      >
        <p style={{ margin: 0 }}>
          Le compte doit déjà exister dans <b>Authentication &gt; Users</b>.
          Cette page ne crée pas un compte Auth, elle recrée seulement le lien
          dans la table <b>coaches</b>.
        </p>
      </div>

      <form onSubmit={handleReattach} style={{ maxWidth: "700px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label>Nom / prénom</label>
          <br />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Rôle</label>
          <br />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="coach">coach</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Statut</label>
          <br />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>

        <button
          type="submit"
          style={{
            padding: "12px 20px",
            background: "#0a7a3d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Réattacher le compte au club
        </button>
      </form>

      {message && (
        <p style={{ color: "green", fontWeight: "bold", marginTop: "20px" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "red", fontWeight: "bold", marginTop: "20px" }}>
          {error}
        </p>
      )}
    </main>
  );
}