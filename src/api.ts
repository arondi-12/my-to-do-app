import type { Todo, NewTodo, TodoUpdate, Note } from "./types";

// Point this at your FastAPI server once it's running.
// If you use Vite, prefer an env var: import.meta.env.VITE_API_URL
const BASE_URL = "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${options?.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }

  // DELETE responses may have no body
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  list: () => request<Todo[]>("/todos"),

  create: (todo: NewTodo) =>
    request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(todo),
    }),

  update: (id: number, patch: TodoUpdate) =>
    request<Todo>(`/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  remove: (id: number) =>
    request<void>(`/todos/${id}`, { method: "DELETE" }),

  reorder: (id: number, newPosition: number) =>
    request<Todo[]>(`/todos/${id}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ new_position: newPosition }),
    }),

  getNote: () => request<Note>("/note"),

  updateNote: (content: string) =>
    request<Note>("/note", {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
};