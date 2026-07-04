#!/bin/zsh
cd /Users/mac/Documents/personal-site || exit 1
if lsof -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
  if ! curl -fsS http://127.0.0.1:8000/ >/dev/null 2>&1; then
    kill $(lsof -tiTCP:8000 -sTCP:LISTEN) >/dev/null 2>&1
    sleep 1
  fi
fi

if ! lsof -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
  nohup python3 serve.py >/tmp/personal-site.log 2>&1 &
fi
sleep 1
open "http://127.0.0.1:8000/?t=$(date +%s)"
