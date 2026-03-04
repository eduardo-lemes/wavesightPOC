$ErrorActionPreference = "Stop"

api\.venv\Scripts\python -m uvicorn api.main:app --reload --port 8000
