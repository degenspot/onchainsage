#!/bin/zsh

# Script: dump.zsh
# Purpose: Recursively traverse a directory and dump source code file contents into a single text file

# Define the output file
OUTPUT_FILE="codebase_dump.txt"

# List of source code file extensions to include
typeset -A SOURCE_EXTENSIONS=(
    py 1 js 1 ts 1 java 1 c 1 cpp 1 sh 1 zsh 1 html 1 css 1
    rb 1 go 1 rs 1 php 1 swift 1 kt 1 scala 1 # Add more as needed
)

# Directories and patterns to skip (hidden dirs, build dirs, etc.)
SKIP_DIRS=("(.git|.svn|node_modules|dist|build|__pycache__)")

# Check if a directory argument is provided, default to current directory
TARGET_DIR=${1:-.}

# Ensure the target directory exists and is accessible
if [[ ! -d "$TARGET_DIR" ]]; then
    echo "Error: '$TARGET_DIR' is not a valid directory" >&2
    exit 1
elif [[ ! -r "$TARGET_DIR" ]]; then
    echo "Error: No read permission for '$TARGET_DIR'" >&2
    exit 1
fi

# Resolve the absolute path of the target directory for relative path calculation
TARGET_DIR=$(realpath "$TARGET_DIR") || {
    echo "Error: Failed to resolve path for '$TARGET_DIR'" >&2
    exit 1
}

# Initialize or clear the output file
: > "$OUTPUT_FILE" || {
    echo "Error: Cannot write to '$OUTPUT_FILE'" >&2
    exit 1
}

# Function to check if a file is a source code file based on extension
is_source_file() {
    local filename="$1"
    local ext="${filename##*.}"
    [[ -n "${SOURCE_EXTENSIONS[$ext]}" ]]
}

# Function to process each file
process_file() {
    local filepath="$1"
    local relpath="${filepath#$TARGET_DIR/}"

    # Skip hidden files or files in skipped directories
    if [[ "$relpath" =~ "^\." || "$relpath" =~ $SKIP_DIRS ]]; then
        return
    fi

    # Check if it's a regular file and a source file
    if [[ -f "$filepath" && ! -L "$filepath" ]] && is_source_file "$filepath"; then
        # Check if the file is binary (using file command for portability)
        if file "$filepath" | grep -q "text"; then
            {
                echo "# File: $relpath"
                echo "----------------------------------------"
                cat "$filepath"
                echo -e "\n----------------------------------------\n"
            } >> "$OUTPUT_FILE" 2>/dev/null || {
                echo "Warning: Could not read '$filepath'" >&2
            }
        fi
    fi
}

# Main traversal logic using Zsh globbing
# Enable extended globbing for pattern matching
setopt EXTENDED_GLOB

# Recursively find all files, excluding skipped directories
for filepath in "$TARGET_DIR"/**/*(.); do
    process_file "$filepath"
done

# Check if the output file was written successfully
if [[ -s "$OUTPUT_FILE" ]]; then
    echo "Source code dump completed successfully. Output written to '$OUTPUT_FILE'"
else
    echo "Warning: No source files found or output file is empty" >&2
    [[ -f "$OUTPUT_FILE" ]] || {
        echo "Error: Failed to create '$OUTPUT_FILE'" >&2
        exit 1
    }
fi

exit 0