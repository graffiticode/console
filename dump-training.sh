#!/bin/bash

# Default values
OUTPUT_DIR="./training"
GRAPHQL_ENDPOINT="https://graffiticode.org/api"
MARK=4
LANG=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --lang|-l)
      LANG="$2"
      shift 2
      ;;
    --mark|-m)
      MARK="$2"
      shift 2
      ;;
    --outdir|-o)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --endpoint|-e)
      GRAPHQL_ENDPOINT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: ./dump-training.sh [options]"
      echo ""
      echo "Options:"
      echo "  --lang, -l     Language code (e.g., 0002, 0151, 0165)"
      echo "                 If not specified, dumps all languages"
      echo "  --mark, -m     Mark value (default: 1)"
      echo "  --outdir, -o   Output directory (default: ./training)"
      echo "  --endpoint, -e GraphQL endpoint (default: https://graffiticode.org/api)"
      echo "  --help, -h     Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./dump-training.sh                       # Dump all languages"
      echo "  ./dump-training.sh --lang 0002           # Dump only language 0002"
      echo "  ./dump-training.sh -l 0002 -m 2          # Dump language 0002 with mark 2"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Function to dump training data for a specific language
dump_language() {
  local lang=$1
  echo "Dumping training data for language $lang with mark $MARK..."
  # Make sure output directory exists
  mkdir -p "$OUTPUT_DIR"
  # Use --outdir parameter which is supported by the script
  node scripts/generate-training-examples.js --lang $lang --mark $MARK --graphql-endpoint "$GRAPHQL_ENDPOINT" --outdir "$OUTPUT_DIR"
}

# If a specific language is provided, only dump that one
if [ -n "$LANG" ]; then
  dump_language $LANG
else
  # Otherwise dump all supported languages
  echo "Dumping training data for all languages..."
  dump_language 0002
  dump_language 0151
  dump_language 0159
  dump_language 0165
  # Add other languages here as needed
fi

echo "Training data dump completed!"

