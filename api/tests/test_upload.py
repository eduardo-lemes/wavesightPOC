"""Tests for upload endpoints."""
import io


def test_upload_csv_ok(client, auth_headers, sample_csv):
    resp = client.post(
        "/upload",
        headers=auth_headers,
        files={"file": ("test.csv", io.BytesIO(sample_csv), "text/csv")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "frequency" in data
    assert "intensity" in data
    assert "peaks" in data
    assert "stats" in data
    assert "emission_type" in data
    assert data["count"] > 0


def test_upload_without_token(client, sample_csv):
    resp = client.post("/upload", files={"file": ("test.csv", io.BytesIO(sample_csv), "text/csv")})
    assert resp.status_code == 401


def test_upload_invalid_extension(client, auth_headers):
    resp = client.post(
        "/upload",
        headers=auth_headers,
        files={"file": ("test.txt", io.BytesIO(b"invalid"), "text/plain")},
    )
    assert resp.status_code == 400


def test_upload_invalid_csv(client, auth_headers):
    resp = client.post(
        "/upload",
        headers=auth_headers,
        files={"file": ("test.csv", io.BytesIO(b"not,a,csv\nwith,no,numbers"), "text/csv")},
    )
    assert resp.status_code == 400


def test_upload_multi(client, auth_headers, sample_csv):
    resp = client.post(
        "/upload-multi",
        headers=auth_headers,
        files=[
            ("files", ("test1.csv", io.BytesIO(sample_csv), "text/csv")),
            ("files", ("test2.csv", io.BytesIO(sample_csv), "text/csv")),
        ],
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["series"]) == 2
    assert "ai_insights" in data  # Should be None since no AI configured
    assert data["ai_insights"] is None


def test_upload_multi_no_files(client, auth_headers):
    resp = client.post("/upload-multi", headers=auth_headers)
    assert resp.status_code == 422


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("ok", "degraded")
    assert "version" in data
    assert "database" in data


def test_demo(client):
    resp = client.get("/demo")
    assert resp.status_code == 200
    data = resp.json()
    assert "series" in data
