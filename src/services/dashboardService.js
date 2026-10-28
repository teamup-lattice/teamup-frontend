import { api } from "./api";

export const getMyProfile = () => api.get("/api/profile/users/me");
export const getMyProjects = () => api.get("/api/projects/mine");
export const getDashboard = () => api.get("/api/dashboard");
