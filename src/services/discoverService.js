import { api } from "./api";

export async function getOpenProjects({ query = "", filters = {}} = {}) {
  // If your backend supports searching and filtering via query parameters:
  const response = await api.get("/api/projects", {
    params: {
      q: query,
      ...filters,
    },
  });
  
  return response.data;
}