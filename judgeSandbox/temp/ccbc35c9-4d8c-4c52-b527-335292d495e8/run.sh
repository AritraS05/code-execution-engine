#!/usr/bin/env bash
# run.sh - simple runner used inside container
# usage: run.sh inputfile outputfile

set -eo pipefail

IN="${1:-input.txt}"
OUT="${2:-user_out.txt}"

# Simple behavior:
# - If a C++ program, compile then run if compiled binary exists (main)
# - If Python/Node, run main.py / main.js
# - Always write stdout to OUT

# detect file types present
if [ -f "./main.cpp" ]; then
  g++ -O2 -std=c++17 main.cpp -o main || { echo "Compilation failed" > "${OUT}"; exit 1; }
  timeout 3s ./main < "${IN}" > "${OUT}" 2>&1 || true
elif [ -f "./main.py" ]; then
  # python script
  timeout 3s python3 main.py < "${IN}" > "${OUT}" 2>&1 || true
elif [ -f "./main.js" ]; then
  timeout 3s node main.js < "${IN}" > "${OUT}" 2>&1 || true
else
  echo "No supported source file found" > "${OUT}"
fi
