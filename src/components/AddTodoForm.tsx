import { useState } from "react";
import type { FormEvent } from "react";

interface AddTodoFormProps {
  onAdd: (title: string, dueDate: string | null) => void;
}

export function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, dueDate || null);
    setTitle("");
    setDueDate("");
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        className="add-form__input"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        aria-label="New task"
      />
      <input
        className="add-form__date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="Due date (optional)"
      />
      <button className="add-form__button" type="submit" disabled={!title.trim()}>
        Add
      </button>
    </form>
  );
}