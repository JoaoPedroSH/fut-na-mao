
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertPlayer } from "@shared/schema";

export function usePlayers(sessionId?: number) {
  return useQuery({
    queryKey: [api.players.list.path, sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const url = buildUrl(api.players.list.path, { sessionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch players");
      return api.players.list.responses[200].parse(await res.json());
    },
    enabled: !!sessionId,
  });
}

export function useCreatePlayer(sessionId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertPlayer, 'gameSessionId'>) => {
      if (!sessionId) throw new Error("No session ID");
      const url = buildUrl(api.players.create.path, { sessionId });
      const res = await fetch(url, {
        method: api.players.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, gameSessionId: sessionId }),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.players.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create player");
      }
      return api.players.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.players.list.path, sessionId] }),
  });
}

export function useDeletePlayer(sessionId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.players.delete.path, { id });
      const res = await fetch(url, {
        method: api.players.delete.method,
        credentials: "include",
      });
      if (res.status === 404) throw new Error("Player not found");
      if (!res.ok) throw new Error("Failed to delete player");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.players.list.path, sessionId] }),
  });
}
