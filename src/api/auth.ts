import { api } from "./client";
import type { AuthInput, AuthUser } from "@/types";

export const authenticate = async (input: AuthInput) =>
  (await api.post<{ ok: boolean; user: AuthUser; access_token?: string }>("/auth", input)).data;

export const logoutPanitia = async () => (await api.delete<{ ok: boolean }>("/auth")).data;
