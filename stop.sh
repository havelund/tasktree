#!/bin/bash

# Kill whatever process is listening on the given port
kill_port() {
  local port="$1"
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
      # Windows (Git Bash): lsof is not available, use netstat + taskkill
      netstat -ano 2>/dev/null | awk -v p=":$port" '$2 ~ p"$" && $4 == "LISTENING" {print $5}' | sort -u |
        while read -r pid; do
          [ -n "$pid" ] && [ "$pid" != 0 ] && taskkill //F //T //PID "$pid" >/dev/null 2>&1
        done
      ;;
    *)
      lsof -ti:"$port" | xargs kill -9 2>/dev/null
      ;;
  esac
}

echo "Stopping Todo App servers..."

# Kill backend (Python)
kill_port 5000
echo "✅ Backend stopped"

# Kill frontend (Vite)
kill_port 5173
echo "✅ Frontend stopped"

echo ""
echo "All servers stopped!"
