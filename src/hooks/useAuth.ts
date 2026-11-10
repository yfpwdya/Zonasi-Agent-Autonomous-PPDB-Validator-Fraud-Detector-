"use client";
import { useMutation } from "@tanstack/react-query";
import { authenticate } from "@/api/auth";

export const useAuth = () =>
  useMutation({
    mutationFn: authenticate,
    onSuccess: (data) => {
      // ponytail: session kept in localStorage; move to @supabase/ssr cookies + middleware when /dashboard must be server-protected.
      localStorage.setItem("zonasi_auth_user", JSON.stringify(data.user));
      if (data.access_token) localStorage.setItem("zonasi_auth_token", data.access_token);
    },
  });
