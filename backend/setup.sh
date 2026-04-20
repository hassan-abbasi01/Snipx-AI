#!/bin/bash
set -e

echo ">>> Install system deps (ffmpeg + libmagic)"
apt update && apt install -y ffmpeg libmagic1

echo ">>> Go to backend"
cd /workspace/Snipx-AI/backend

echo ">>> Fix whisper cache (IMPORTANT)"
mkdir -p /workspace/cache
export XDG_CACHE_HOME=/workspace/cache

echo ">>> Pull latest code"
git pull origin main

echo ">>> Create fresh venv"
python3 -m venv venv
source venv/bin/activate

echo ">>> Upgrade pip"
pip install --upgrade pip

echo ">>> Install WEB deps"
pip install -r requirements-web.txt

echo ">>> Install AI deps (whisper, tf, torch)"
pip install -r requirements-ai.txt

echo ">>> DONE (system ready)"
