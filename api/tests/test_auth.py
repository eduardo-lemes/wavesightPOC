"""Tests for auth endpoints."""


def test_register_ok(client):
    resp = client.post("/auth/register", json={"name": "John", "email": "john@example.com", "password": "password123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "john@example.com"
    assert data["user"]["name"] == "John"


def test_register_duplicate(client):
    client.post("/auth/register", json={"name": "John", "email": "john@example.com", "password": "password123"})
    resp = client.post("/auth/register", json={"name": "John2", "email": "john@example.com", "password": "password456"})
    assert resp.status_code == 409


def test_register_short_password(client):
    resp = client.post("/auth/register", json={"name": "John", "email": "john@example.com", "password": "123"})
    assert resp.status_code == 400


def test_register_short_name(client):
    resp = client.post("/auth/register", json={"name": "J", "email": "john@example.com", "password": "password123"})
    assert resp.status_code == 400


def test_register_invalid_email(client):
    resp = client.post("/auth/register", json={"name": "John", "email": "invalid", "password": "password123"})
    assert resp.status_code == 400


def test_login_ok(client):
    client.post("/auth/register", json={"name": "John", "email": "john@example.com", "password": "password123"})
    resp = client.post("/auth/login", json={"email": "john@example.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={"name": "John", "email": "john@example.com", "password": "password123"})
    resp = client.post("/auth/login", json={"email": "john@example.com", "password": "wrongpassword"})
    assert resp.status_code == 401


def test_login_nonexistent_user(client):
    resp = client.post("/auth/login", json={"email": "nobody@example.com", "password": "password123"})
    assert resp.status_code == 401


def test_me_without_token(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_with_token(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"
