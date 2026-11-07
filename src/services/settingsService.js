import { api } from "./api";

export const getSettings = () => api.get("/api/profile/users/me");
export const saveSettings = (settings) => api.put("/api/profile/users/me/onboarding", settings);
export const requestAccountDeletion = () => api.delete("/api/profile/users/me");