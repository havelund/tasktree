#!/bin/bash

echo "Starting Todo App..."
echo ""

echo "Starting backend server..."
python3 app.py > backend.log 2>&1 &
BACKEND_PID=$!

echo "Starting frontend server..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

APP_URL="http://localhost:5173"

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

# Open TaskTree in a fresh window of the user's DEFAULT browser.
open_fresh() {
  local url="$1"

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
