import { api } from "./api";

// 1. Individual named exports for components importing them directly
export const getProjectDetails = async (id) => {
  const response = await api.get(`/api/projects/${id}`);
  return response;
};

export const updateProject = async (id, data) => {
  const response = await api.put(`/api/projects/${id}`, data);
  return response;
};

export const publishProject = async (id) => {
  const response = await api.post(`/api/projects/${id}/publish`);
  return response;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/api/projects/${id}`);
  return response;
};

export const getCollaborators = async (projectId, roleId, queryParams = {}) => {
  const response = await api.get(`/api/projects/${projectId}/collaborators`, {
    params: { roleId, ...queryParams },
  });
  return response;
};

export const getProjectMembers = async (projectId) => {
  const response = await api.get(`/api/projects/${projectId}/members`);
  return response;
};

// 2. Object export in case any component imports the full object service
export const projectDetailsService = {
  getProjectDetails,
  updateProject,
  publishProject,
  deleteProject,
  getCollaborators,
  getProjectMembers,
};