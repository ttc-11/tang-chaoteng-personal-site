#!/bin/zsh
cd "$(dirname "$0")"
python3 server.py > /tmp/personal-intro-site.log 2>&1 &
sleep 1
open http://127.0.0.1:8765
