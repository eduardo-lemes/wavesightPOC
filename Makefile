# Makefile for WaveSight EMC POC

# Auto-detect OS
ifeq ($(OS),Windows_NT)
  PY := api\.venv\Scripts\python
  PIP := $(PY) -m pip
  VENV_CMD := python -m venv api\.venv
else
  PY := api/.venv/bin/python
  PIP := $(PY) -m pip
  VENV_CMD := python3 -m venv api/.venv
endif

.PHONY: help venv install run test-upload docker-up docker-down

help:
	@echo "Available targets:"
	@echo "  venv        - create virtual environment in api/.venv"
	@echo "  install     - install dependencies"
	@echo "  run         - start FastAPI server (local)"
	@echo "  test-upload - upload sample CSV to the API"
	@echo "  docker-up   - start Docker stack"
	@echo "  docker-down - stop Docker stack"

venv:
	$(VENV_CMD)

install: venv
	$(PIP) install -U pip
	$(PIP) install -r api/requirements.txt

run:
	$(PY) -m uvicorn api.main:app --reload --port 8000

test-upload:
	curl -F "file=@samples/sample_harmonics.csv" http://localhost:8000/upload

docker-up:
	docker compose up --build

docker-down:
	docker compose down
