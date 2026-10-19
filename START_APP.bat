@echo off
title my-version (TVPaint-style studio)
cd /d "%~dp0"
echo Starting my-version...
echo (leave this window open while using the app; close it to stop)
start "" http://localhost:8471
node serve.js
