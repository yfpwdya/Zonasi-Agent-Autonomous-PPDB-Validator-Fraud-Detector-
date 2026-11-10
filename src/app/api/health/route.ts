import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/server/supabase";

export async function GET() {
  const sb = getSupabaseServer();
  let supabaseConnected = false;
  let supabaseRows = 0;
  let supabaseError: string | null = null;

  if (sb) {
    const { count, error } = await sb
      .from("applications")
      .select("*", { count: "exact", head: true });
    supabaseConnected = !error;
    supabaseRows = count ?? 0;
    supabaseError = error?.message || null;
  }

  const geminiKey = process.env.GEMINI_API_KEY || "";
  let geminiConnected = false;
  let geminiModel = "gemini-3-flash-preview";
  if (geminiKey) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Balas singkat: OK" }] }],
          }),
        }
      );
      geminiConnected = r.ok;
    } catch {
      geminiConnected = false;
    }
  }

  return NextResponse.json({
    ok: supabaseConnected && geminiConnected,
    supabase: {
      connected: supabaseConnected,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      applicationsCount: supabaseRows,
      error: supabaseError,
    },
    aiAgent: {
      connected: geminiConnected,
      model: geminiModel,
      googleMapsFallback: !process.env.GOOGLE_MAPS_API_KEY,
    },
  });
}
