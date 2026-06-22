#!/bin/bash

echo "Stopping Todo App servers..."

# Kill backend (Python)
lsof -ti:5000 | xargs kill -9 2>/dev/null
echo "✅ Backend stopped"

# Kill frontend (Vite)
lsof -ti:5173 | xargs kill -9 2>/dev/null
echo "✅ Frontend stopped"

echo ""
echo "All servers stopped!"
