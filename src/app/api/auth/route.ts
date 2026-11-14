import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/server/supabase";

// ponytail: use Supabase Admin createUser({ email_confirm: true }) so panitia can register & login immediately without SMTP setup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, fullName, nip, role } = body as {
      action: "register" | "login";
      email?: string;
      password?: string;
      fullName?: string;
      nip?: string;
      role?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    const sbAdmin = getSupabaseServer();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!sbAdmin || !url || !anon) {
      return NextResponse.json({ error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
    }

    if (action === "register") {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
      }
      const { data: created, error: createErr } = await sbAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || "Verifikator Panitia PPDB",
          nip: nip || "198804122015031002",
          role: role || "AUDITOR_PANITIA",
        },
      });
      if (createErr && !createErr.message.toLowerCase().includes("already")) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }
      if (createErr && createErr.message.toLowerCase().includes("already")) {
        return NextResponse.json({ error: "Email sudah terdaftar. Silakan langsung Masuk (Login)." }, { status: 409 });
      }
      void created;
    }

    const sbPublic = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signInData, error: signInErr } = await sbPublic.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInErr || !signInData.user) {
      return NextResponse.json(
        { error: signInErr?.message || "Email atau password salah." },
        { status: 401 },
      );
    }

    const u = signInData.user;
    const token = signInData.session?.access_token || `session-${u.id}`;
    const res = NextResponse.json({
      ok: true,
      user: {
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || "Panitia PPDB",
        nip: u.user_metadata?.nip || "-",
        role: u.user_metadata?.role || "AUDITOR_PANITIA",
        last_sign_in_at: u.last_sign_in_at,
      },
      access_token: token,
    });
    res.cookies.set("zonasi_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memproses autentikasi." },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  const sbAdmin = getSupabaseServer();
  if (!token || !sbAdmin) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  const { data, error } = await sbAdmin.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  const u = data.user;
  return NextResponse.json({
    authenticated: true,
    user: {
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || "Panitia PPDB",
      nip: u.user_metadata?.nip || "-",
      role: u.user_metadata?.role || "AUDITOR_PANITIA",
    },
  });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("zonasi_session");
  return res;
}
