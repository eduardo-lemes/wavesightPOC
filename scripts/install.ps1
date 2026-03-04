$ErrorActionPreference = "Stop"

python -m venv api\.venv
api\.venv\Scripts\python -m pip install -U pip
api\.venv\Scripts\python -m pip install -r api\requirements.txt
