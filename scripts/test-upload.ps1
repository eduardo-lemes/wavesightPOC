$ErrorActionPreference = "Stop"

curl -F "file=@sample.csv" http://localhost:8000/upload
