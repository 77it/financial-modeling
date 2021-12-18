@echo off

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
deno run --config ./tsconfig.deno-run.json ./dist_deno/main.js
pause

ECHO.
ECHO NODE.JS compiling and running...
rmdir dist_node /s /q
del src\denotypes.d.ts
del src\lib\RuntimeMediator.ts
copy src_node\RuntimeMediator.ts src\lib
del src\core\SimObjectTypes_All.ts
copy ..\..\EfDev3.STEX\financialmodel.test\005\Shareable\ProjX.FM.Scripting.JsScripts2.v1\COA_export\SimObjectTypes_All.ts src\core
call tsc --project tsconfig.node.json
rem npx prettier --write ./dist_node
node ./dist_node/main.js
pause


ECHO.
ECHO closing activities

@REM copy back interface files to DENO and NODE.JS folders
del src_deno\RuntimeMediator_h.ts
copy src\lib\RuntimeMediator_h.ts src_deno
del src_node\RuntimeMediator_h.ts
copy src\lib\RuntimeMediator_h.ts src_node


@REM for development with VSCODE/NODE.JS
del src\denotypes.d.ts
del src\lib\RuntimeMediator.ts
copy src_node\RuntimeMediator.ts src\lib


