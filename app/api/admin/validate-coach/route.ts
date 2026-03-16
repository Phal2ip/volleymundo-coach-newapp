import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
try {
const supabaseAdmin = getSupabaseAdmin();
const body = await request.json();
const coachId = body.coachId as string | undefined;

if (!coachId) {
return NextResponse.json({ error: "coachId manquant." }, { status: 400 });
}

const { error } = await supabaseAdmin
.from("coaches")
.update({ status: "active" })
.eq("id", coachId);

if (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}

return NextResponse.json({
success: true,
message: "Le compte a été validé."
});
} catch (error) {
return NextResponse.json(
{ error: error instanceof Error ? error.message : "Erreur serveur." },
{ status: 500 }
);
}
}
