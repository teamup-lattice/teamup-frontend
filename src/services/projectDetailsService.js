import { api } from "./api";

export const getProjectDetails = (id) => api.get(`/api/projects/${id}`);



