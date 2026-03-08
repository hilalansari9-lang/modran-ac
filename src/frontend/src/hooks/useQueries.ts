import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ACUnit, ACUnitInput } from "../backend.d";
import { useActor } from "./useActor";

// Query Keys
export const QUERY_KEYS = {
  allUnits: ["units"] as const,
  unit: (id: bigint) => ["units", id.toString()] as const,
};

// ── Queries ────────────────────────────────────────────────

export function useGetAllUnits() {
  const { actor, isFetching } = useActor();
  return useQuery<ACUnit[]>({
    queryKey: QUERY_KEYS.allUnits,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUnits();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: false,
  });
}

export function useGetUnit(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ACUnit>({
    queryKey: QUERY_KEYS.unit(id ?? 0n),
    queryFn: async () => {
      if (!actor || id === null) throw new Error("No actor or id");
      return actor.getUnit(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    refetchOnWindowFocus: false,
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useAddUnit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.addUnit(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUnits });
    },
  });
}

export function useRemoveUnit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.removeUnit(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUnits });
    },
  });
}

export function useRenameUnit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: bigint; name: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.renameUnit(id, name);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUnits });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.unit(variables.id),
      });
    },
  });
}

export function useUpdateUnit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: ACUnitInput }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateUnit(id, input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUnits });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.unit(variables.id),
      });
    },
  });
}

export function useSetTimers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      onHours,
      offHours,
    }: {
      id: bigint;
      onHours: bigint | null;
      offHours: bigint | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.setTimers(id, onHours, offHours);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUnits });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.unit(variables.id),
      });
    },
  });
}

export function useToggleOnlineStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.toggleOnlineStatus(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUnits });
    },
  });
}
