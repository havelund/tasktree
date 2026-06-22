#!/bin/bash

echo "Starting Todo App..."
echo ""

echo "Starting backend server..."
python3 app.py &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 2

echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Todo App is running!"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
