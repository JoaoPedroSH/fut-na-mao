import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertPlayer } from "@shared/routes";

export function usePlayers() {
  return useQuery({
    queryKey: [api.players.list.path],
    queryFn: async () => {
      const res = await fetch(api.players.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch players");
      return api.players.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertPlayer) => {
      const res = await fetch(api.players.create.path, {
        method: api.players.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.players.list.path] }),
  });
}

export function useDeletePlayer() {
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.players.list.path] }),
  });
}
