
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertMatch } from "@shared/routes";

export function useMatches(sessionId?: number) {
  return useQuery({
    queryKey: [api.matches.list.path, sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const url = buildUrl(api.matches.list.path, { sessionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch matches");
      return api.matches.list.responses[200].parse(await res.json());
    },
    enabled: !!sessionId,
  });
}

export function useCreateMatch(sessionId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertMatch, 'gameSessionId'>) => {
      if (!sessionId) throw new Error("No session ID");
      const url = buildUrl(api.matches.create.path, { sessionId });
      const res = await fetch(url, {
        method: api.matches.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, gameSessionId: sessionId }),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.matches.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create match log");
      }
      return api.matches.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.matches.list.path, sessionId] }),
  });
}
