from datetime import datetime, date
from sqlmodel import SQLModel, Field


# The actual database table
class Todo(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    completed: bool = False
    position: int
    due_date: date | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Request body for POST /todos — title is required, due_date is optional
class TodoCreate(SQLModel):
    title: str
    due_date: date | None = None


# Request body for PATCH /todos/{id} — all fields optional so the
# frontend can send just {"completed": true} or just {"title": "..."}
class TodoUpdate(SQLModel):
    title: str | None = None
    completed: bool | None = None
    due_date: date | None = None


# Request body for PATCH /todos/{id}/reorder
class TodoReorder(SQLModel):
    new_position: int


# --- Notes scratchpad ---
# A single freeform note, unrelated to any specific todo.
# We only ever keep one row (id=1) — simplest possible "scratchpad".
class Note(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    content: str = ""
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class NoteUpdate(SQLModel):
    content: str