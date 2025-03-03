set TZ=Europe/Rome
deno test --check --allow-net --allow-read --allow-write --allow-run --allow-env --allow-import --config deno.json test_e2e/

pause