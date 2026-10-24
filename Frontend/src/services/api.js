const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function request(path, options = {}) {
  const { responseType, ...fetchOptions } = options;
  const token = localStorage.getItem("parkease_token");

  const headers = { ...fetchOptions.headers };
  if (!(fetchOptions.body instanceof FormData)) headers["Content-Type"] = "application/json";

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
    });
  } catch {
    throw new Error("Unable to connect to the ParkEase backend. Start the backend server and check its database connection.");
  }

  const data = response.status === 204 ? null : responseType === "blob" ? await response.blob() : await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong. Please try again.");
  }

  return data;
}

export const authApi = {
  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (details) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(details),
    }),

  registerWithIdentity: (details) => request("/auth/register", {
    method: "POST",
    body: details,
  }),
};
