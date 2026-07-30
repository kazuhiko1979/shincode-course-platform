#!/bin/bash
# Notification hook — play a short attention sound when Claude needs input
# (permission prompt, long task waiting). Team-shared (.claude/settings.json).
# Cross-platform; degrades silently when no audio method is available.

(
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -c "[console]::beep(880,200)"        # Windows / WSL
  elif command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Ping.aiff             # macOS
  elif command -v paplay >/dev/null 2>&1; then
    paplay /usr/share/sounds/freedesktop/stereo/message.oga   # Linux (PulseAudio)
  else
    printf '\a'                                         # terminal bell fallback
  fi
) >/dev/null 2>&1 &

exit 0
