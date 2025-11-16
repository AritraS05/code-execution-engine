#!/bin/bash
set -e
INPUT_FILE=$1
OUTPUT_FILE=$2
if [ -f main.cpp ]; then
  timeout 2 g++ -O2 -std=c++17 main.cpp -o main
  timeout 2 ./main < "$INPUT_FILE" > "$OUTPUT_FILE"
fi
if [ -f main.py ]; then
  timeout 2 python3 main.py < "$INPUT_FILE" > "$OUTPUT_FILE"
fi
if [ -f main.js ]; then
  timeout 2 node main.js < "$INPUT_FILE" > "$OUTPUT_FILE"
fi
