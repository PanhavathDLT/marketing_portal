"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../api/authApi";
import { setTokens, setUser } from "@/lib/auth";
import type { LoginPayload } from "../types";

export function useLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(payload: LoginPayload) {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(payload);
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}
