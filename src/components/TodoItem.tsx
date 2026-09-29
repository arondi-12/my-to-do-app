import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Todo } from "../types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

function isOverdue(todo: Todo): boolean {
  if (!todo.due_date || todo.completed) return false;
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return todo.due_date < today;
}

function formatDueDate(dueDate: string): string {
  // dueDate is "YYYY-MM-DD" — parse as local, not UTC, to avoid off-by-one day display
  const [year, month, day] = dueDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="todo-item">
      <button
        className="todo-item__handle"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <label className="todo-item__label">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={(e) => onToggle(todo.id, e.target.checked)}
        />
        <span className={todo.completed ? "todo-item__title todo-item__title--done" : "todo-item__title"}>
          {todo.title}
        </span>
        {todo.due_date && (
          <span className={isOverdue(todo) ? "todo-item__due todo-item__due--overdue" : "todo-item__due"}>
            {formatDueDate(todo.due_date)}
          </span>
        )}
      </label>

      <button
        className="todo-item__delete"
        aria-label={`Delete "${todo.title}"`}
        onClick={() => onDelete(todo.id)}
      >
        ×
      </button>
    </li>
  );
}