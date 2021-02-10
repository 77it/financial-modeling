rmdir dist /s /q
del src\denotypes.d.ts
deno types >src/denotypes.d.ts
call tsc
deno run --config ./tsconfig.deno.json ./dist/main.js
pause