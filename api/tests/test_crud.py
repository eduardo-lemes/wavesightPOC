"""Tests for CRUD endpoints: analyses and projects."""
import json


def test_create_project(client, auth_headers):
    resp = client.post("/projects", headers=auth_headers, json={"name": "Test Project", "description": "A test"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] > 0


def test_list_projects(client, auth_headers):
    client.post("/projects", headers=auth_headers, json={"name": "P1"})
    client.post("/projects", headers=auth_headers, json={"name": "P2"})
    resp = client.get("/projects", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_project(client, auth_headers):
    create = client.post("/projects", headers=auth_headers, json={"name": "P1", "description": "desc"})
    pid = create.json()["id"]
    resp = client.get(f"/projects/{pid}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "P1"
    assert resp.json()["analyses"] == []


def test_delete_project(client, auth_headers):
    create = client.post("/projects", headers=auth_headers, json={"name": "P1"})
    pid = create.json()["id"]
    resp = client.delete(f"/projects/{pid}", headers=auth_headers)
    assert resp.status_code == 200
    resp = client.get(f"/projects/{pid}", headers=auth_headers)
    assert resp.status_code == 404


def test_save_analysis(client, auth_headers):
    resp = client.post("/analyses", headers=auth_headers, json={
        "filename": "test.csv",
        "params_json": json.dumps({"smoothing": "none"}),
        "results_json": json.dumps({"peaks": []}),
    })
    assert resp.status_code == 200
    assert resp.json()["id"] > 0


def test_list_analyses(client, auth_headers):
    client.post("/analyses", headers=auth_headers, json={"filename": "a.csv"})
    client.post("/analyses", headers=auth_headers, json={"filename": "b.csv"})
    resp = client.get("/analyses", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_analysis(client, auth_headers):
    create = client.post("/analyses", headers=auth_headers, json={"filename": "x.csv", "params_json": "{}"})
    aid = create.json()["id"]
    resp = client.get(f"/analyses/{aid}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["filename"] == "x.csv"


def test_delete_analysis(client, auth_headers):
    create = client.post("/analyses", headers=auth_headers, json={"filename": "x.csv"})
    aid = create.json()["id"]
    resp = client.delete(f"/analyses/{aid}", headers=auth_headers)
    assert resp.status_code == 200
    resp = client.get(f"/analyses/{aid}", headers=auth_headers)
    assert resp.status_code == 404


def test_analysis_with_project(client, auth_headers):
    proj = client.post("/projects", headers=auth_headers, json={"name": "Campaign"})
    pid = proj.json()["id"]
    client.post("/analyses", headers=auth_headers, json={"filename": "a.csv", "project_id": pid})
    resp = client.get(f"/projects/{pid}", headers=auth_headers)
    assert len(resp.json()["analyses"]) == 1


def test_list_analyses_filter_project(client, auth_headers):
    proj = client.post("/projects", headers=auth_headers, json={"name": "P1"})
    pid = proj.json()["id"]
    client.post("/analyses", headers=auth_headers, json={"filename": "a.csv", "project_id": pid})
    client.post("/analyses", headers=auth_headers, json={"filename": "b.csv"})
    resp = client.get(f"/analyses?project_id={pid}", headers=auth_headers)
    assert len(resp.json()) == 1


def test_analyses_without_token(client):
    resp = client.get("/analyses")
    assert resp.status_code == 401


def test_analyze_endpoint(client, auth_headers):
    resp = client.post("/analyze", headers=auth_headers, json={
        "data": {"files": ["test.csv"], "stats": {}, "peaks": []}
    })
    assert resp.status_code == 200
    assert resp.json()["ai_insights"] is None  # No AI configured
