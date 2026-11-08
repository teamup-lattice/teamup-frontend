import { api } from "./api";

export const saveVisibility = (values) => api.patch("/api/profile/users/me/visibility", values);