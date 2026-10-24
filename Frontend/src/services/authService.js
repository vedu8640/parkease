import { useSyncExternalStore } from "react";
import { authApi } from "./api";

const SESSION_KEY = "parkease-auth-session";

const listeners = new Set();
let sessionSnapshot;

const notify = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const readSession = () => {
  if (sessionSnapshot !== undefined) {
    return sessionSnapshot;
  }

  try {
    sessionSnapshot = JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    sessionSnapshot = null;
  }

  return sessionSnapshot;
};

const writeSession = (user) => {
  sessionSnapshot = user;

  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("parkease_token");
  }

  notify();
  return user;
};

export const registerUser = async (payload) => {
  const response = await authApi.register(payload);

  if (response.token) {
    localStorage.setItem("parkease_token", response.token);
  }

  return writeSession(response.user);
};

export const registerUserWithIdentity = async (formData) => {
  const response = await authApi.registerWithIdentity(formData);
  if (response.token) localStorage.setItem("parkease_token", response.token);
  return writeSession(response.user);
};

export const loginUser = async (email, password) => {
  const response = await authApi.login({
    email: email.trim().toLowerCase(),
    password,
  });

  if (response.token) {
    localStorage.setItem("parkease_token", response.token);
  }

  return writeSession(response.user);
};

// Compatibility names for existing AuthPages.jsx
export const registerMockUser = registerUser;
export const loginMockUser = loginUser;

export const logoutMockUser = () => {
  return writeSession(null);
};

export const getAuthenticatedUser = () => {
  return readSession();
};

export const useAuthenticatedUser = () => {
  return useSyncExternalStore(subscribe, readSession, () => null);
};
