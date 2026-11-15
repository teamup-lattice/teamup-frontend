import { api } from "./api";

export async function getOpenProjects({ query = "", filters = {} } = {}) {
  // If the api.js baseURL already contains /api, use "/projects". 
  // If the baseURL is just the host (e.g., http://localhost:5000), use "/api/projects".
  const response = await api.get("/projects", {
    params: {
      q: query,
      ...filters,
    },
  });

  return response.data;
}