#!/usr/bin/bash

# This script generates the JS/JSX file for the TS/TSX code example. When run with no arguments, it will generate all examples in the content/guides directory.
# Usage: ./generate-js-example.sh [path/to/file.ts] [--all]

generate_single_example() {
  ts_filename="$1"
  js_filename="${ts_filename%.*}.js"
  jsx_filename="${ts_filename%.*}.jsx"

  eslint --fix --no-ignore -c eslintrc.examples.js "$ts_filename" > /dev/null
  echo "Formatted $ts_filename"
  
  if [[ "$ts_filename" == *.ts ]]; then
    tsc --target esnext --skipLibCheck "$ts_filename" > /dev/null
    target_filename="$js_filename"
  elif [[ "$ts_filename" == *.tsx ]]; then
    tsc --target esnext --jsx preserve --skipLibCheck "$ts_filename" > /dev/null
    target_filename="$jsx_filename"
  else
    echo "Invalid file extension: $ts_filename. Must be .ts or .tsx"
    return
  fi

  if [ -f "$target_filename" ]; then
    eslint --fix --no-ignore -c eslintrc.examples.js "$target_filename" > /dev/null
    echo "Generated $target_filename"
  else
    echo "Failed to generate $target_filename"
  fi
}

generate_all_examples() {
  jobs_limit=16

  echo "Running $jobs_limit jobs in parallel..."

  find content/guides -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while read -d $'\0' ts_filename; do
    while test "$(jobs | wc -l)" -ge "$jobs_limit"; do
      sleep 1
    done
  
    generate_single_example "$ts_filename" &
  done

  wait
  echo "Waiting for the result of all jobs..."
  sleep 20
  echo "All jobs finished"
}

if [ -z "$1" ]; then
  echo "Provide a path to the TS/TSX file or use --all to generate all examples"
elif [ "$1" == "--all" ]; then
  echo "Generating all examples"
  generate_all_examples
else
  echo "Generating single example: $1"
  generate_single_example "$1"
fi
