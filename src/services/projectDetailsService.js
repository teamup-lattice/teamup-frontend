import { api } from "./api";

export const projectDetailsService = {
  // Get details for a specific project
  getProjectDetails: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Update a project draft
  updateProject: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  // Publish a project (DRAFT -> OPEN)
  publishProject: async (id) => {
    const response = await api.post(`/projects/${id}/publish`);
    return response.data;
  },

  // Soft-delete a project
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // Find eligible collaborators for a project role
  getCollaborators: async (projectId, roleId, queryParams = {}) => {
    const response = await api.get(`/projects/${projectId}/collaborators`, {
      params: { roleId, ...queryParams },
    });
    return response.data;
  },
};