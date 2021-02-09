rmdir dist /s /q
call tsc
deno run --config ./tsconfig.deno.json ./dist/main.js
pause