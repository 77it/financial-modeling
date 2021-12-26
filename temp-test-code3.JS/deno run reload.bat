@echo off

@REM for DENO

ECHO DENO running...
deno run --reload --config ./tsconfig.deno-run.json ./main.js
pause