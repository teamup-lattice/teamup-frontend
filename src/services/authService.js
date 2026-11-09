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

export async function getSessions() {
  const data = await api.get("/api/auth/sessions");
  return data.sessions;
}

export async function forgotPassword({ email }) {
  return api.post("/api/auth/forgot-password", { email });
}

export async function resetPassword({ token, password }) {
  try {
    return await api.post("/api/auth/reset-password", { token, password });
  } catch (error) {
    const hasPasswordError = error.errors?.some(
      (fieldError) => fieldError.field === "password",
    );

    if (error.status === 400 && hasPasswordError) {
      error.code = "PASSWORD_VALIDATION";
    } else if ([400, 401, 404, 410].includes(error.status)) {
      error.code = "INVALID_TOKEN";
    }

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
