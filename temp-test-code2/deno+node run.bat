@REM for DENO

rmdir dist_deno /s /q
del src\denotypes.d.ts
deno types >src/denotypes.d.ts
call tsc --project tsconfig.deno.json
deno run --config ./tsconfig.deno-run.json ./dist_deno/main.js
pause


@REM for NODE.JS

rmdir dist_node /s /q
call tsc --project tsconfig.node.json
node ./dist_node/main.js
pause
