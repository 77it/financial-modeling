@echo off

ECHO DENO compiling and running...
rmdir dist_deno /s /q
del src\denotypes.d.ts
del src\lib\RuntimeMediator.ts
copy src_deno\RuntimeMediator.ts src\lib
deno types >src/denotypes.d.ts
call tsc --project tsconfig.deno.json
deno run --config ./tsconfig.deno-run.json ./dist_deno/main.js
pause

ECHO.
ECHO NODE.JS compiling and running...
rmdir dist_node /s /q
del src\denotypes.d.ts
del src\lib\RuntimeMediator.ts
copy src_node\RuntimeMediator.ts src\lib
call tsc --project tsconfig.node.json
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


