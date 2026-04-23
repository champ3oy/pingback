"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface UsageData {
  plan: "free" | "pro" | "team";
  projects: { used: number; limit: number | null };
  jobs: { used: number; limit: number | null };
  executions: { used: number; limit: number | null; resetsAt: string };
}

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription", "usage"],
    queryFn: () => apiClient.get<UsageData>("/api/v1/subscription/usage"),
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (plan: "pro" | "team") => {
      const result = await apiClient.post<{ url: string }>(
        "/api/v1/subscription/checkout",
        { plan },
      );
      window.location.href = result.url;
      return result;
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: async () => {
      const result = await apiClient.get<{ url: string }>(
        "/api/v1/subscription/portal",
      );
      window.location.href = result.url;
      return result;
    },
  });
}
