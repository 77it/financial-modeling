# Repository Guidelines

## Project Structure & Module Organization
- Core engine lives in `src/engine` (ledger, sim objects, settings, FML) with shared helpers in `src/lib` (schema, dates, decimal math) and configuration in `src/config` and `src/config/tasklocks`.
- Domain modules reside in `src/modules` (defaults in `src/modules/default_tasklocks`), while runtime adapters live in `src/node`, `src/bun`, and `src/py`.
- Entry points for experiments sit in `src/main.js` and `src/main-treasury-temp.js`; supporting binaries/scripts are in `bin`.
- Tests are in `test` (unit/bench) and `test_e2e`; vendorized dependencies live under `vendor`. `_samples_and_test_code` holds scratch examples—avoid depending on it.

## Build, Test, and Development Commands
- Install JS deps once: `npm install` (uses `package-lock.json`).
- Node tests with import hooks:  
  ```bash
  node --import ./src/node/__node__register-hooks.js --test "test/**/*.test.js"
  ```
- Deno (strict, wide permissions for fixtures):  
  ```bash
  deno test --check --allow-net --allow-read --allow-write --allow-run --allow-env --allow-import --config deno.json test/
  ```
- Bun (with HTTPS preload plugin):  
  ```bash
  bun test --preload ./src/bun/__bun__https_import_plugin_v2.js --timeout 60000 test/
  ```
- E2E suites mirror the above per runtime in `test_e2e`; keep TZ stable by exporting `TZ=Europe/Rome` as in the batch scripts.

## Coding Style & Naming Conventions
- ES modules everywhere; 2-space indentation; prefer explicit imports over globals. Keep files ASCII.
- Enable JSDoc typing and strict checks (mirrors `deno.json` flags); favor small pure helpers in `src/lib`.
- Tests end with `.test.js`; benches use `__bench.js`; JSONL fixtures live beside the spec that consumes them.
- Avoid introducing runtime-specific APIs unless guarded (`typeof Deno !== 'undefined'`, etc.).

## Testing Guidelines
- Add unit tests near the feature folder (e.g., `test/engine_test/ledger/ledger.test.js` for `src/engine/ledger/*`).
- Maintain cross-runtime compatibility: ensure Node, Deno, and Bun all pass or document a runtime limitation.
- Keep fixtures minimal; prefer deterministic data and avoid network/file writes outside `test/` unless mocked.
- Check coverage of new branches/edge cases; add benches only when performance is relevant.

## Commit & Pull Request Guidelines
- Use concise, imperative commit messages (e.g., “Refactor formula parser to support JSONX format”).
- PRs should describe intent, link issues, and note runtime(s) tested; include screenshots only if UI/output changes.
- Ensure lint/check/test commands above are clean; mention known gaps or follow-ups in the PR description.

## Git Staging Rules (MANDATORY)
- Do **not** stage files unless the user explicitly instructs you to do so; avoid `git add` or `git stage` during coding or testing.
- Allowed Git actions without permission: `git status`, `git diff`, `git log`.
- If staging ever happens by mistake, stop and notify the user immediately; do not assume staging is helpful.

## Security & Configuration Notes
- Respect the Polyform Noncommercial license; flag any third-party code additions with license info.
- Be cautious with HTTPS imports; for Node/Bun rely on the provided hooks/preload rather than ad-hoc fetchers.
