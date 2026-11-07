import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/lib/toast";

import { setAvatarSeedFn, setNicknameFn } from "./api";

export function useSetNickname() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (nickname: string) => setNicknameFn({ data: { nickname } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["viewer"] });
			toast.success("Nome salvato");
		},
	});
}

export function useSetAvatarSeed() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (seed: string) => setAvatarSeedFn({ data: { seed } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["viewer"] });
			toast.success("Avatar salvato");
		},
		onError: (error: Error) => toast.error(error.message),
	});
}
