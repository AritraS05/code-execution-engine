#!/bin/bash
set -e
INPUT_FILE=$1
OUTPUT_FILE=$2

if [ -f main.cpp ]; then
  # Compile and capture errors
  if ! timeout 2 g++ -O2 -std=c++17 main.cpp -o main 2> compile_errors.txt; then
    echo "Compilation failed:" > "$OUTPUT_FILE"
    if [ -s compile_errors.txt ]; then
      cat compile_errors.txt >> "$OUTPUT_FILE"
    else
      echo "Unknown compilation error." >> "$OUTPUT_FILE"
    fi
    exit 1
  fi

  # Run the program and capture errors
  if ! timeout 2 ./main < "$INPUT_FILE" > "$OUTPUT_FILE" 2> runtime_errors.txt; then
    echo "Runtime error:" >> "$OUTPUT_FILE"
    if [ -s runtime_errors.txt ]; then
      cat runtime_errors.txt >> "$OUTPUT_FILE"
    else
      echo "Unknown runtime error." >> "$OUTPUT_FILE"
    fi
    exit 1
  fi
fi

if [ -f main.py ]; then
  if ! timeout 2 python3 main.py < "$INPUT_FILE" > "$OUTPUT_FILE" 2> runtime_errors.txt; then
    echo "Runtime error:" > "$OUTPUT_FILE"
    if [ -s runtime_errors.txt ]; then
      cat runtime_errors.txt >> "$OUTPUT_FILE"
    else
      echo "Unknown runtime error." >> "$OUTPUT_FILE"
    fi
    exit 1
  fi
fi

if [ -f main.js ]; then
  if ! timeout 2 node main.js < "$INPUT_FILE" > "$OUTPUT_FILE" 2> runtime_errors.txt; then
    echo "Runtime error:" > "$OUTPUT_FILE"
    if [ -s runtime_errors.txt ]; then
      cat runtime_errors.txt >> "$OUTPUT_FILE"
    else
      echo "Unknown runtime error." >> "$OUTPUT_FILE"
    fi
    exit 1
  fi
fi
