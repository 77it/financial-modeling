@REM for DENO

rmdir dist_deno /s /q
del src\denotypes.d.ts
deno types >src/denotypes.d.ts
call tsc --project tsconfig.deno.json
deno run --reload --config ./tsconfig.deno-run.json ./dist_deno/main.js
pause
