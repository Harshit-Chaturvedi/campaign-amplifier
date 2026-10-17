import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use a test database
os.environ["DATABASE_URL"] = "sqlite:///./test_campaigns.db"

from app.database import Base, get_db
from app.main import app
from app.seed import seed
from app.auth.security import create_access_token

test_engine = create_engine("sqlite:///./test_campaigns.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    # Seed data
    from app import database
    database.engine = test_engine
    database.SessionLocal = TestingSessionLocal
    seed()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_campaigns.db"):
        try:
            os.remove("./test_campaigns.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token():
    return create_access_token({"sub": "admin-demo", "email": "admin@demo.org", "role": "admin"})

@pytest.fixture
def creator_token():
    return create_access_token({"sub": "creator-demo", "email": "creator@demo.org", "role": "creator"})

@pytest.fixture
def user_token():
    return create_access_token({"sub": "backer-demo", "email": "backer@demo.org", "role": "user"})
