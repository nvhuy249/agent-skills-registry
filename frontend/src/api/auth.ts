const API_BASE = "http://localhost:3000/api/auth";

type AuthResponse = {
  message: string;
  userId?: number;
} | {
  error: string;
};

export async function signup(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });
  return res.json();
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include",
  });
}
