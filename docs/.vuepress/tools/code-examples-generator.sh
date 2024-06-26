#!/usr/bin/bash

# This script generates JS/JSX examples from TS/TSX files and formats them using ESLint.
# Usage:
#   ./code-examples-generator.sh path/to/file.ts - generates single example path/to/file.js
#   ./code-examples-generator.sh --generateAll - generates all examples in the content/guides directory
#   ./code-examples-generator.sh --verifyAll - verifies the existing JS/JSX examples in the content/guides directory
#   ./code-examples-generator.sh --formatAllTsExamples - runs the autoformatter on all TS and TSX example files in the content/guides directory

format() {
  filename="$1"
  eslint --fix --no-ignore -c eslintrc.examples.js "$filename" > /dev/null
}

generate() {
  input_filename="$1"
  output_filename="$2"

  if [[ "$input_filename" == *.ts ]]; then
    tsc --target esnext --skipLibCheck --outFile "$output_filename" "$input_filename" > /dev/null
  elif [[ "$input_filename" == *.tsx ]]; then
    tsc --target esnext --jsx preserve --skipLibCheck --outFile "$output_filename" "$input_filename" > /dev/null
  fi
}

format_single_file() {
  format "$1"
  echo "Formatted $1"
}

generate_single_example() {
  input_filename="$1"

  if [[ "$input_filename" == *.ts ]]; then
    output_filename="${input_filename%.*}.js"
  elif [[ "$input_filename" == *.tsx ]]; then
    output_filename="${input_filename%.*}.jsx"
  else
    echo "Invalid file extension: $input_filename. Must be .ts or .tsx"
    return
  fi

  generate "$input_filename" "$output_filename"

  if [ -f "$output_filename" ]; then
    format "$output_filename"
    echo "Generated $output_filename"
  else
    echo "Failed to generate $output_filename from $input_filename"
  fi
}

verify_single_example() {
  input_filename="$1"

  if [[ "$input_filename" == *.ts ]]; then
    output_filename="${input_filename%.*}.js"
    tmp_filename="${input_filename%.*}-tmp.js"
  elif [[ "$input_filename" == *.tsx ]]; then
    output_filename="${input_filename%.*}.jsx"
    tmp_filename="${input_filename%.*}-tmp.jsx"
  else
    echo "Invalid file extension: $input_filename. Must be .ts or .tsx"
    return
  fi

  generate "$input_filename" "$tmp_filename"
  format "$tmp_filename"

  # todo: diff
}

go_through_all_examples() {
  task="$1"
  jobs_limit=16

  echo "Running $jobs_limit jobs in parallel..."

  find content/guides -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while read -d $'\0' input_filename; do
    while test "$(jobs | wc -l)" -ge "$jobs_limit"; do
      sleep 1
    done

    if [ "$task" == "verifyAll" ]; then
      verify_single_example "$input_filename" &
    elif [ "$task" == "formatAllTsExamples" ]; then
      format_single_file "$input_filename" &
    else
      generate_single_example "$input_filename" &
    fi

  done

  wait
  echo "Waiting for the result of all jobs..."
  sleep 20
  echo "All jobs finished"
}

if [ -z "$1" ]; then
  echo "Provide a path to the TS/TSX file or use one of the commands: --generateAll, --verifyAll, --formatAllTsExamples"
elif [ "$1" == "--generateAll" ]; then
  echo "Generating all examples..."
  go_through_all_examples "generateAll"
elif [ "$1" == "--verifyAll" ]; then
  echo "Verifying all examples..."
  go_through_all_examples "verifyAll"
elif [ "$1" == "--formatAllTsExamples" ]; then
  echo "Formatting all TS/TSX example files..."
  go_through_all_examples "formatAllTsExamples"
else
  echo "Generating single example..."
  generate_single_example "$1"
fi
