#!/bin/bash
set -e

# Start FastAPI in background
echo "Starting Python FastAPI worker..."
# Assuming requirements are installed system-wide or in a venv
# Here assuming system-wide install via pip in Dockerfile
python3 -m uvicorn python_worker.main:app --host 0.0.0.0 --port 8000 &

# Start Node.js in foreground
echo "Starting Node.js server..."
node --max-old-space-size=16384 index.js
