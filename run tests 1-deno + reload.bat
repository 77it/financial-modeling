del deno.lock

set TZ=Europe/Rome
deno test --reload --check --allow-net --allow-read --allow-write --allow-run --allow-env --allow-import --config deno.json test/

:ask
choice /C Y /M "Press Y to exit"
if errorlevel 1 exit
goto ask
