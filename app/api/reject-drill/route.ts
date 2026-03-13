import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {

  const formData = await request.formData();
  const submissionId = formData.get("submissionId") as string;

  await supabase
    .from("drill_submissions")
    .update({ status: "rejected" })
    .eq("id", submissionId);

  return NextResponse.redirect(new URL("/admin/propositions", request.url));
}