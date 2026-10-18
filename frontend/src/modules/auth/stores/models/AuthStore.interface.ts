import { useAuthStore } from "../auth.store";

const authStore = useAuthStore()

export type UseAuthStore = typeof authStore