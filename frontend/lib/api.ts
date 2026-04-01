const API_URL = "http://localhost:4000";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch(
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });

  // If 401 and not a skip-auth request, try refreshing
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
    }
  }

  return res;
}

// Auth API
export async function register(name: string, email: string, password: string) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    skipAuth: true,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
}

export async function login(email: string, password: string) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function logout() {
  await apiFetch("/auth/logout", { method: "POST" });
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

// Tasks API
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getTasks(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<TasksResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  const res = await apiFetch(`/tasks?${query.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch tasks");
  return data;
}

export async function createTask(task: {
  title: string;
  description?: string;
}): Promise<Task> {
  const res = await apiFetch("/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create task");
  return data;
}

export async function updateTask(
  id: string,
  updates: { title?: string; description?: string; status?: string }
): Promise<Task> {
  const res = await apiFetch(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update task");
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const res = await apiFetch(`/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete task");
  }
}

export async function toggleTask(id: string): Promise<Task> {
  const res = await apiFetch(`/tasks/${id}/toggle`, { method: "PATCH" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to toggle task");
  return data;
}
