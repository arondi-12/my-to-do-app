from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = "sqlite:///./todos.db"

# check_same_thread=False is needed because SQLite normally only allows
# one thread to talk to it, but FastAPI can use multiple.
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session