import { NextResponse } from "next/server";
import axios from "axios";
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
  const geminiModel = "gemini-3-flash-preview";
  if (geminiKey) {
    try {
      // ponytail: GET model metadata instead of POST :generateContent so health checks consume 0 of the 20/day free-tier RPD quota.
      const r = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}?key=${geminiKey}`,
        { timeout: 3000, validateStatus: () => true },
      );
      geminiConnected = r.status >= 200 && r.status < 300;
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
