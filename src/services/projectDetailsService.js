import { api } from "./api";

// 1. Individual named exports for components importing them directly
export const getProjectDetails = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const updateProject = async (id, data) => {
  const response = await api.put(`/projects/${id}`, data);
  return response.data;
};

export const publishProject = async (id) => {
  const response = await api.post(`/projects/${id}/publish`);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

export const getCollaborators = async (projectId, roleId, queryParams = {}) => {
  const response = await api.get(`/projects/${projectId}/collaborators`, {
    params: { roleId, ...queryParams },
  });
  return response.data;
};

// 2. Object export in case any component imports the full object service
export const projectDetailsService = {
  getProjectDetails,
  updateProject,
  publishProject,
  deleteProject,
  getCollaborators,
};