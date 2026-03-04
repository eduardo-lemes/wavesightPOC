# Makefile for WaveSight EMC POC (Windows-friendly)

PY := api\.venv\Scripts\python
PIP := $(PY) -m pip

.PHONY: help venv install run test-upload

help:
	@echo Available targets: venv install run test-upload
	@echo venv        - create virtual environment in api\.venv
	@echo install     - install dependencies
	@echo run         - start FastAPI server
	@echo test-upload - upload sample.csv to the API

venv:
	python -m venv api\.venv

install: venv
	$(PIP) install -U pip
	$(PIP) install -r api\requirements.txt

run:
	$(PY) -m uvicorn api.main:app --reload --port 8000

test-upload:
	curl -F "file=@sample.csv" http://localhost:8000/upload
