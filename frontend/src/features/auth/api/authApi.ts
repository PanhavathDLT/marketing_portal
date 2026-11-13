import { api } from "@/lib/api";
import type { AuthResponse, LoginPayload } from "../types";

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>("/auth/login", payload),
};
