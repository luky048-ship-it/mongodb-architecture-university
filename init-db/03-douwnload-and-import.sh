#!/bin/bash
# 03-download-and-import.sh - Автоматический download OULAD ZIP, unzip, import to raw_ collections

set -e # Exit on error

# Env from docker-compose
ZIP_URL="$OULAD_ZIP_URL"
ZIP_FILE="/tmp/oulad.zip"
DATA_DIR="/tmp/data"

# Check if already imported (e.g., raw_studentInfo exists and not empty)
if mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --eval "use university; db.raw_studentInfo.countDocuments() > 0" --quiet | grep -q true; then
  echo "Data already imported, skipping."
  exit 0
fi

# Download ZIP
wget -O "$ZIP_FILE" "$ZIP_URL" || {
  echo "Download failed"
  exit 1
}

# Unzip (OULAD ZIP has anonymisedData/ with CSV)
unzip -o "$ZIP_FILE" -d "$DATA_DIR" || {
  echo "Unzip failed"
  exit 1
}

# Find CSV dir (anonymisedData or root)
CSV_DIR="$DATA_DIR"
if [ -d "$DATA_DIR/anonymisedData" ]; then
  CSV_DIR="$DATA_DIR/anonymisedData"
fi

# Mongoimport each CSV to raw_
for csv in "$CSV_DIR"/*.csv; do
  collection="raw_$(basename "$csv" .csv)"
  mongoimport --db university --collection "$collection" --file "$csv" --type csv --headerline -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --drop || {
    echo "Import $csv failed"
    exit 1
  }
  echo "Imported $csv to $collection"
done

# Cleanup
rm -rf "$DATA_DIR" "$ZIP_FILE"

echo "Import complete."
