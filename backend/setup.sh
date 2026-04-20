#!/bin/bash
set -e

echo ">>> SYSTEM PACKAGES"
apt update && apt install -y ffmpeg libmagic1

echo ">>> PROJECT"
cd /workspace/Snipx-AI/backend

echo ">>> CACHE FIX (WHISPER)"
mkdir -p /workspace/cache
export XDG_CACHE_HOME=/workspace/cache

echo ">>> GIT PULL"
git pull origin main

echo ">>> VENV"
python3 -m venv venv
source venv/bin/activate

echo ">>> PIP UPGRADE"
pip install --upgrade pip

echo ">>> WEB INSTALL"
pip install -r requirements-web.txt

echo ">>> AI INSTALL"
pip install -r requirements-ai.txt

echo ">>> WHISPER FORCE FIX"
pip install openai-whisper

echo ">>> DONE"
