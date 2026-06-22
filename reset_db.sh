#!/bin/bash

# Create backup first
echo "📦 Creating backup before reset..."
./backup_db.sh

# Remove old database
rm -f todos.db

echo "🗑️  Old database removed"
echo "✅ Database will be recreated on next server start"
echo ""
echo "To start fresh, run: ./start.sh"
