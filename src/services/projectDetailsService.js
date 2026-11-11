import { api } from "./api";

// Fetch full project details by project ID
export async function getProjectDetails(projectId) {
  const response = await api.get(`/api/projects/${projectId}`);
  return response.data;
}

//  if  UI updates project details
export async function updateProjectDetails(projectId, updateData) {
  const response = await api.put(`/api/projects/${projectId}`, updateData);
  return response.data;
}

//  if  UI soft-deletes a project from the details view
export async function deleteProject(projectId) {
  const response = await api.delete(`/api/projects/${projectId}`);
  return response.data;
}



