import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure api package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# Disable rate limiting for tests
os.environ["RATELIMIT_ENABLED"] = "false"

from api.database import Base, get_db
from api.main import app, limiter

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite://"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    limiter.enabled = False  # Disable rate limiting for tests
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_token(client):
    """Register a user and return the auth token."""
    resp = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def sample_csv():
    """Generate a simple CSV content."""
    lines = ["frequency,intensity"]
    for i in range(100):
        freq = 0.1 + i * 0.01
        intensity = 10.0 + (5.0 if i == 50 else 0) + (i % 10) * 0.5
        lines.append(f"{freq:.4f},{intensity:.4f}")
    return "\n".join(lines).encode()
