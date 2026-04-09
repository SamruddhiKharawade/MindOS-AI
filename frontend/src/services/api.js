// frontend/src/services/api.js

import axios from "axios";

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  timeout:         30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error)  => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    error.userMessage = typeof message === "string" ? message : "Something went wrong";
    return Promise.reject(error);
  }
);

// ─── Safe Data Extractor ──────────────────────────────────────────────────────
// Always use this instead of res.data.data directly
// Filters null/undefined and ensures _id exists on every item
export const safeData = (res) => {
  const raw = res?.data?.data;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item) => item != null && item._id);
  }
  // If endpoint returns a single document, wrap it in an array
  return raw && raw._id ? [raw] : [];
};

// ─── Task API ─────────────────────────────────────────────────────────────────
export const taskAPI = {
  getAll:   (filters = {}) => {
    const params = {};
    if (filters.status)   params.status   = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.goalId)   params.goalId   = filters.goalId;
    return api.get("/tasks", { params });
  },
  getToday: ()              => api.get("/tasks/today"),
  getById:  (id)            => api.get(`/tasks/${id}`),
  create:   (data)          => api.post("/tasks", data),
  update:   (id, updates)   => api.put(`/tasks/${id}`, updates),
  delete:   (id)            => api.delete(`/tasks/${id}`),
};

// ─── Goal API ─────────────────────────────────────────────────────────────────
export const goalAPI = {
  getAll:     (filters = {}) => {
    const params = {};
    if (filters.status)   params.status   = filters.status;
    if (filters.category) params.category = filters.category;
    return api.get("/goals", { params });
  },
  getById:    (id)           => api.get(`/goals/${id}`),
  getProgress:(id)           => api.get(`/goals/${id}/progress`),
  create:     (data)         => api.post("/goals", data),
  breakdown:  (id)           => api.post(`/goals/${id}/breakdown`),
  update:     (id, updates)  => api.put(`/goals/${id}`, updates),
  delete:     (id)           => api.delete(`/goals/${id}`),
};

// ─── AI API ───────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat:          (message, history = []) => api.post("/ai/chat", { message, history }),
  saveMemory:    (noteData)              => api.post("/ai/memory", noteData),
  getContext:    ()                      => api.get("/ai/context"),
  getSuggestion: ()                      => api.get("/ai/suggest"),
};

// ─── Note API ─────────────────────────────────────────────────────────────────
export const noteAPI = {
  getAll:  (params = {}) => api.get("/notes", { params }),
  getById: (id)          => api.get(`/notes/${id}`),
  create:  (data)        => api.post("/notes", data),
  update:  (id, data)    => api.put(`/notes/${id}`, data),
  delete:  (id)          => api.delete(`/notes/${id}`),
};

// ─── Health API ───────────────────────────────────────────────────────────────
export const healthAPI = {
  check: () => api.get("/health"),
};

export default api;