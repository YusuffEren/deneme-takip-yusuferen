"""
Veritabanı bağlantı yönetimi - SQLAlchemy
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import DATABASE_URL

# SQLite için özel ayarlar
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True if not DATABASE_URL.startswith("sqlite") else False,
    connect_args=connect_args,
)

# SQLite'da foreign key desteğini etkinleştir
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency - veritabanı oturumu sağlar"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
