import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message } from "../backend.d";
import { useActor } from "./useActor";

export function useGetChatHistory(sessionId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["chatHistory", sessionId],
    queryFn: async () => {
      if (!actor) return [];
      const history = await actor.getChatHistory(sessionId);
      return history;
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      message,
    }: {
      sessionId: string;
      message: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const response = await actor.sendMessage(sessionId, message);
      return response;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chatHistory", variables.sessionId],
      });
    },
  });
}

export function useClearChat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.clearChat(sessionId);
      return result;
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: ["chatHistory", sessionId],
      });
    },
  });
}
