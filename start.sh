#!/bin/bash

cd "$(dirname "$0")" || exit 1

# Detect platform: mac, linux, wsl, or windows (Git Bash / MSYS / Cygwin)
case "$(uname -s)" in
  Darwin) OS=mac ;;
  MINGW*|MSYS*|CYGWIN*) OS=windows ;;
  Linux)
    if grep -qi microsoft /proc/version 2>/dev/null; then OS=wsl; else OS=linux; fi
    ;;
  *) OS=other ;;
esac

# Find a working Python 3 (on Windows "python3" may be a Microsoft Store stub)
PYTHON=()
for candidate in "python3" "python" "py -3"; do
  # shellcheck disable=SC2086
  if $candidate -c 'import sys; sys.exit(0 if sys.version_info[0] == 3 else 1)' >/dev/null 2>&1; then
    read -r -a PYTHON <<< "$candidate"
    break
  fi
done
if [ ${#PYTHON[@]} -eq 0 ]; then
  echo "❌ Could not find Python 3 (tried python3, python, py). Please install Python 3 and try again."
  exit 1
fi

echo "Starting Todo App..."
echo ""

echo "Starting backend server..."
"${PYTHON[@]}" app.py > backend.log 2>&1 &
BACKEND_PID=$!

echo "Starting frontend server..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

cleanup() {
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  # On Windows, killing the bash jobs does not stop the native python/node processes
  if [ "$OS" = windows ]; then
    ./stop.sh >/dev/null 2>&1
  fi
  exit
}
trap cleanup INT TERM

# Wait for Vite to report its actual URL (it picks another port if 5173 is busy)
APP_URL=""
for _ in $(seq 1 60); do
  APP_URL=$(sed "s/$(printf '\033')\[[0-9;]*m//g" frontend.log 2>/dev/null | grep -o 'http://localhost:[0-9]*' | head -1)
  [ -n "$APP_URL" ] && break
  kill -0 $FRONTEND_PID 2>/dev/null || break
  sleep 0.5
done

# If a server crashed on startup, show its log instead of pretending all is well
show_crash() {
  echo ""
  echo "❌ The $1 server failed to start. Last lines of $2:"
  echo "----------------------------------------------------------"
  tail -n 25 "$2"
  echo "----------------------------------------------------------"
}
FAILED=0
kill -0 $FRONTEND_PID 2>/dev/null || { show_crash frontend frontend.log; FAILED=1; }
kill -0 $BACKEND_PID 2>/dev/null || { show_crash backend backend.log; FAILED=1; }
if [ $FAILED -eq 1 ]; then
  cleanup
fi

if [ -z "$APP_URL" ]; then
  APP_URL="http://localhost:5173"
  echo "⚠️  Could not detect the frontend address (see frontend.log); assuming $APP_URL"
fi

echo ""
echo "=========================================================="
echo ""
echo "   ✅  TaskTree is running!"
echo ""
echo "   👉  Open this address in your browser:"
echo ""
echo "          $APP_URL"
echo ""
echo "   (Backend API: http://localhost:5000)"
echo ""
echo "=========================================================="
echo ""

# Open TaskTree in the default browser on Windows / WSL / Linux.
open_other() {
  local url="$1"
  echo "Opening $url in your default browser ..."
  case "$OS" in
    windows) cmd.exe //c start "" "$url" >/dev/null 2>&1 && return ;;
    wsl)
      { command -v wslview >/dev/null 2>&1 && wslview "$url" >/dev/null 2>&1; } && return
      cmd.exe /c start "" "$url" >/dev/null 2>&1 && return
      ;;
    linux) command -v xdg-open >/dev/null 2>&1 && xdg-open "$url" >/dev/null 2>&1 && return ;;
  esac
  echo "Could not open a browser automatically. Please open $url manually."
}

# Open TaskTree in a fresh window of the user's DEFAULT browser.
open_fresh() {
  local url="$1"

  if [ "$OS" != mac ]; then
    open_other "$url"
    return
  fi

  # Detect the default browser's bundle id (handler for https)
  local bid
  bid=$(python3 - <<'PY' 2>/dev/null
import plistlib, os
p = os.path.expanduser('~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist')
bid = ''
try:
    with open(p, 'rb') as f:
        d = plistlib.load(f)
    for h in d.get('LSHandlers', []):
        if h.get('LSHandlerURLScheme') == 'https':
            bid = h.get('LSHandlerRoleAll', '') or ''
            break
except Exception:
    pass
print(bid)
PY
)
  # Bundle ids in the LaunchServices plist are lowercased; normalize for matching
  bid=$(echo "$bid" | tr '[:upper:]' '[:lower:]')

  # Resolve the app path/name for the default browser
  local app_path app_name
  app_path=$(mdfind "kMDItemCFBundleIdentifier == '$bid'c" 2>/dev/null | head -1)
  app_name=$(basename "$app_path" .app 2>/dev/null)

  case "$bid" in
    com.apple.safari)
      if osascript -e "tell application \"Safari\"
            make new document with properties {URL:\"$url\"}
          end tell" 2>/dev/null; then
        echo "Opened a fresh Safari window."
        return
      fi
      ;;
    com.google.chrome|com.brave.browser|com.microsoft.edgemac|org.chromium.chromium|com.vivaldi.vivaldi|com.operasoftware.opera)
      if [ -n "$app_name" ] && osascript -e "tell application \"$app_name\"
            make new window
            set URL of active tab of front window to \"$url\"
          end tell" 2>/dev/null; then
        echo "Opened a fresh $app_name window."
        return
      fi
      ;;
    org.mozilla.firefox)
      if [ -x "$app_path/Contents/MacOS/firefox" ]; then
        "$app_path/Contents/MacOS/firefox" -new-window "$url" >/dev/null 2>&1 &
        echo "Opened a fresh Firefox window."
        return
      fi
      ;;
  esac

  # Fallback: hand the URL to the default browser (may reuse a tab)
  echo "Opening $url in your default browser ..."
  open "$url" 2>/dev/null || echo "Could not open a browser automatically. Please open $url manually."
}

# Offer to open the browser on this desktop (defaults to Yes after 15s)
read -t 15 -r -p "Open TaskTree in a fresh browser window now? [Y/n] " OPEN_ANSWER
echo ""
if [ -z "$OPEN_ANSWER" ] || [[ "$OPEN_ANSWER" =~ ^[Yy]$ ]]; then
  open_fresh "$APP_URL"
else
  echo "Okay — open $APP_URL in your browser whenever you're ready."
fi

echo ""
echo "Press Ctrl+C to stop both servers"

wait
