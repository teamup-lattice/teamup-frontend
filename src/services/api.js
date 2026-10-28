const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "teamup_token";
let refreshPromise = null;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function logout() {
  clearToken();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.token) {
          throw new Error("Session refresh failed");
        }
        setToken(data.token);
        return data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request(method, path, body, isRetry = false, tokenOverride) {
  const headers = {};
  const token = tokenOverride ?? getToken();

  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Network error");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (
      response.status === 401 &&
      token &&
      !path.startsWith("/api/auth/login") &&
      !path.startsWith("/api/auth/signup") &&
      !path.startsWith("/api/auth/refresh")
    ) {
      if (isRetry) {
        logout();
      } else {
        let newToken;
        try {
          newToken = await refreshToken();
        } catch {
          logout();
          const error = new Error("Session expired");
          error.status = 401;
          throw error;
        }
        return request(method, path, body, true, newToken);
      }
    }

    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};
