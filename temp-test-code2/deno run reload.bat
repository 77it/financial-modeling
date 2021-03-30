@REM for DENO

ECHO DENO compiling and running...
rmdir dist_deno /s /q
del src\denotypes.d.ts
del src\lib\RuntimeMediator.ts
copy src_deno\RuntimeMediator.ts src\lib
deno types >src/denotypes.d.ts
call tsc --project tsconfig.deno.json
npx prettier --write ./dist_deno
deno run --reload --config ./tsconfig.deno-run.json ./dist_deno/main.js
pause