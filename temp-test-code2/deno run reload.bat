@echo off

@REM for DENO

ECHO DENO compiling and running...
rmdir dist_deno /s /q
del src\denotypes.d.ts
deno types >src/denotypes.d.ts
del src\lib\RuntimeMediator.ts
copy src_deno\RuntimeMediator.ts src\lib
del src\core\SimObjectTypes_All.ts
copy ..\..\EfDev3.STEX\financialmodel.test\005\Shareable\ProjX.FM.Scripting.JsScripts2.v1\COA_export\SimObjectTypes_All.ts src\core
call tsc --project tsconfig.deno.json
rem npx prettier --write ./dist_deno
deno run --reload --config ./tsconfig.deno-run.json ./dist_deno/main.js
pause