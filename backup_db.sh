#!/bin/bash

# Create backups directory if it doesn't exist
mkdir -p backups

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/todos_backup_${TIMESTAMP}.db"

# Copy the database
cp todos.db "$BACKUP_FILE"

echo "✅ Database backed up to: $BACKUP_FILE"
