@echo off

ECHO DENO running...
deno run --reload --config ./tsconfig.deno-run.json ./main.js
pause