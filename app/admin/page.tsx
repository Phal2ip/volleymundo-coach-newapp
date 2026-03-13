"use client";

import CoachNav from "../../components/CoachNav";

export default function AdminPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <CoachNav />

      <h1>Administration</h1>
      <p>Outils de gestion du club.</p>

      <div
        style={{
          marginTop: "30px",
          display: "grid",
          gap: "20px",
          maxWidth: "520px"
        }}
      >
        <a href="/admin/propositions" style={cardStyle}>
          Validation des exercices proposés
        </a>

        <a href="/admin/delete-requests" style={cardStyle}>
          Validation des demandes de suppression
        </a>

        <a href="/admin/coachs" style={cardStyle}>
          Gestion des entraîneurs
        </a>

        <a href="/admin/reattach" style={cardStyle}>
          Réattacher un compte existant au club
        </a>

        <a href="/admin/reset" style={cardStyleDanger}>
          Reset des données de test
        </a>
      </div>
    </main>
  );
}

const cardStyle = {
  display: "block",
  padding: "18px 20px",
  background: "#0a7a3d",
  color: "white",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: "bold"
};

const cardStyleDanger = {
  display: "block",
  padding: "18px 20px",
  background: "#b91c1c",
  color: "white",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: "bold"
};