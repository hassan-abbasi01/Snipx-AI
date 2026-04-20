#!/bin/bash
set -e
echo ">>> Step 1: Workspace mein jao"
cd /workspace

echo ">>> Step 2: Latest code lo"
git pull origin main

echo ">>> Step 3: venv banao /workspace mein (persistent rahega)"
python3 -m venv /workspace/venv
source /workspace/venv/bin/activate

echo ">>> Step 4: Web dependencies install karo"
pip install --upgrade pip
pip install -r requirements.txt

echo ">>> Step 5: AI dependencies install karo"
pip install -r requirements-ai.txt

echo ""
echo "✅ SETUP COMPLETE!"
echo "Ab run karo: source /workspace/venv/bin/activate && python app.py"
