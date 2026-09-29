import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { api } from "./api";
import type { Todo } from "./types";
import { AddTodoForm } from "./components/AddTodoForm";
import { TodoItem } from "./components/TodoItem";
import { NotesSection } from "./components/NotesSection";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    api
      .list()
      .then(setTodos)
      .catch(() => setError("Couldn't reach the server. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(title: string, dueDate: string | null) {
    const optimistic: Todo = {
      id: Date.now(), // temporary id, replaced once the server responds
      title,
      completed: false,
      position: todos.length,
      due_date: dueDate,
      created_at: new Date().toISOString(),
    };
    setTodos((prev) => [...prev, optimistic]);

    try {
      const created = await api.create({ title, due_date: dueDate });
      setTodos((prev) => prev.map((t) => (t.id === optimistic.id ? created : t)));
    } catch {
      setTodos((prev) => prev.filter((t) => t.id !== optimistic.id));
      setError("Couldn't add that task. Try again.");
    }
  }

  async function handleToggle(id: number, completed: boolean) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    try {
      await api.update(id, { completed });
    } catch {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
      setError("Couldn't save that change. Try again.");
    }
  }

  async function handleDelete(id: number) {
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.remove(id);
    } catch {
      setTodos(previous);
      setError("Couldn't delete that task. Try again.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    const previous = todos;
    const reordered = arrayMove(todos, oldIndex, newIndex);
    setTodos(reordered);

    try {
      await api.reorder(Number(active.id), newIndex);
    } catch {
      setTodos(previous);
      setError("Couldn't save the new order. Try again.");
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Todo</h1>
        <p className="app__count">
          {todos.filter((t) => !t.completed).length} of {todos.length} left
        </p>
      </header>

      <AddTodoForm onAdd={handleAdd} />

      {error && (
        <p className="app__error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="app__status">Loading…</p>
      ) : todos.length === 0 ? (
        <p className="app__status">Nothing here yet. Add your first task above.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="todo-list">
              {todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <NotesSection />
    </div>
  );
}