import { api, setToken, clearToken } from "./api";

export async function signUp({ name, email, password }) {
  try {
    const data = await api.post("/api/auth/signup", {
      username: name,
      email,
      password,
    });

    setToken(data.token);
    return { name: data.user.name, email: data.user.email };
  } catch (error) {
    if (error.status === 409) error.code = "EMAIL_EXISTS";
    throw error;
  }
}

export async function signIn({ email, password }) {
  try {
    const data = await api.post("/api/auth/login", { email, password });
    setToken(data.token);

    const profile = await api.get("/api/profile/users/me");

    return {
      name: data.user.name,
      email: data.user.email,
      profileComplete: profile.user.onboardingCompleted,
    };
  } catch (error) {
    if (error.status === 401) error.code = "INVALID_CREDENTIALS";
    throw error;
  }
}

export async function signOut() {
  try {
    await api.post("/api/auth/logout");
  } finally {
    clearToken();
  }
}
