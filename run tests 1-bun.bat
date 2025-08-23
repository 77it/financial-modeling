ECHO Bun as per 2025-03-03 doesn't support import from https
ECHO see https://github.com/oven-sh/bun/issues/38
ECHO Then I added a --preload to support import from https, and with my v2 plugin it supports also nested relative imports (e.g. importing from https a module that imports another module with a relative path to it)


set TZ=Europe/Rome
bun test --preload ./src/bun/__bun__https_import_plugin_v2.js --timeout 60000 test/

pause