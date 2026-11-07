import { api } from "./api";

export const getOpenProjects = (params) => api.get("/api/projects", { params });
export const createProjectDraft = (data) => api.post("/api/projects", data);
export const getProjectById = (id) => api.get(`/api/projects/${id}`);
export const updateProjectDraft = (id, data) => api.put(`/api/projects/${id}`, data);
export const publishProject = (id) => api.post(`/api/projects/${id}/publish`);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);