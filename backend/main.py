import os

from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from database import create_db_and_tables, get_session
from models import Todo, TodoCreate, TodoUpdate, TodoReorder, Note, NoteUpdate

app = FastAPI()

# Allow your Vercel domain and local development
origins = [
    "https://my-to-do-app-zeta-three.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, PATCH, DELETE, OPTIONS, etc.
    allow_headers=["*"],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # runs once when the server starts — creates todos.db / the table if missing
    create_db_and_tables()
    yield


app = FastAPI(title="Todo API", lifespan=lifespan)

# Vite's default dev server port. Add more origins here if you change ports
# or deploy the frontend somewhere else.
default_origins = "http://localhost:5173"
allowed_origins = os.environ.get("ALLOWED_ORIGINS", default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    # Render pings this to confirm the service is alive.
    return {"status": "ok"}

@app.get("/todos", response_model=list[Todo])
def list_todos(session: Session = Depends(get_session)):
    statement = select(Todo).order_by(Todo.position)
    return session.exec(statement).all()


@app.post("/todos", response_model=Todo, status_code=201)
def create_todo(todo_in: TodoCreate, session: Session = Depends(get_session)):
    max_position = session.exec(select(Todo.position).order_by(Todo.position.desc())).first()
    next_position = (max_position + 1) if max_position is not None else 0

    todo = Todo(title=todo_in.title, due_date=todo_in.due_date, position=next_position)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@app.patch("/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, patch: TodoUpdate, session: Session = Depends(get_session)):
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    # exclude_unset means "only touch fields the client actually sent"
    updates = patch.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(todo, key, value)

    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int, session: Session = Depends(get_session)):
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    session.delete(todo)
    session.commit()


@app.patch("/todos/{todo_id}/reorder", response_model=list[Todo])
def reorder_todo(todo_id: int, body: TodoReorder, session: Session = Depends(get_session)):
    todos = session.exec(select(Todo).order_by(Todo.position)).all()

    todo = next((t for t in todos if t.id == todo_id), None)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    # Pull it out of the list, reinsert at the target index, then
    # re-number everyone 0..n-1 so positions stay dense and consistent.
    todos.remove(todo)
    new_index = max(0, min(body.new_position, len(todos)))
    todos.insert(new_index, todo)

    for index, t in enumerate(todos):
        t.position = index
        session.add(t)

    session.commit()
    return session.exec(select(Todo).order_by(Todo.position)).all()


# --- Notes scratchpad ---
# There's only ever one note (id=1). These helpers fetch it, creating an
# empty one on first use, so the frontend never has to handle a 404.

def _get_or_create_note(session: Session) -> Note:
    note = session.get(Note, 1)
    if not note:
        note = Note(id=1, content="")
        session.add(note)
        session.commit()
        session.refresh(note)
    return note


@app.get("/note", response_model=Note)
def get_note(session: Session = Depends(get_session)):
    return _get_or_create_note(session)


@app.put("/note", response_model=Note)
def update_note(body: NoteUpdate, session: Session = Depends(get_session)):
    note = _get_or_create_note(session)
    note.content = body.content
    note.updated_at = datetime.utcnow()
    session.add(note)
    session.commit()
    session.refresh(note)
    return note