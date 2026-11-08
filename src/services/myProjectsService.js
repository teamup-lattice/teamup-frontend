import { api } from "./api";

export const getMyProjects = () => api.get("/api/projects/mine");
export const getRecommendedProjects = (limit) => api.get("/api/projects/recommended", { params: { limit } });
export const createDraft = (projectData) => api.post("/api/projects", projectData);
export const getProjectById = (id) => api.get(`/api/projects/${id}`);
export const updateDraft = (id, projectData) => api.put(`/api/projects/${id}`, projectData);
export const publishProject = (id) => api.post(`/api/projects/${id}/publish`);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);
export const getProjectCollaborators = (projectId, roleId) => api.get(`/api/projects/${projectId}/collaborators`, { params: { roleId } });
