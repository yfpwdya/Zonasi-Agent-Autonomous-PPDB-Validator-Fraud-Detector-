"use client";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authenticate, logoutPanitia } from "@/api/auth";
import type { AuthUser } from "@/types";

export const useAuth = () =>
  useMutation({
    mutationFn: authenticate,
    onSuccess: (data) => {
      localStorage.setItem("zonasi_auth_user", JSON.stringify(data.user));
      if (data.access_token) localStorage.setItem("zonasi_auth_token", data.access_token);
      window.dispatchEvent(new Event("zonasi-auth-change"));
    },
  });

export const clearPanitiaSession = async () => {
  localStorage.removeItem("zonasi_auth_user");
  localStorage.removeItem("zonasi_auth_token");
  window.dispatchEvent(new Event("zonasi-auth-change"));
  await logoutPanitia().catch(() => {});
};

export function usePanitiaSession(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("zonasi_auth_user");
        const parsed = raw ? JSON.parse(raw) : null;
        setUser(parsed?.email ? parsed : null);
      } catch {
        setUser(null);
      }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("zonasi-auth-change", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("zonasi-auth-change", read);
    };
  }, []);
  return user;
}
