# AGENTS.md

## Cursor Cloud specific instructions

This is an Angular 16 ChatGPT UI Clone — a purely client-side SPA with no backend. All data persists in browser `localStorage`.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Angular dev server | `npm start` / `npx ng serve` | 4200 | Only service needed |

### Commands reference

See `package.json` `scripts` for all available commands. Key ones:

- **Dev server:** `npm start` (serves on `http://localhost:4200`)
- **Build:** `npm run build` (production) or `npx ng build --configuration development`
- **Unit tests:** `CHROME_BIN=$(which google-chrome) npx ng test --watch=false --browsers=ChromeHeadless`
- **E2E tests:** `npx playwright test --project=chromium` (requires `npx playwright install --with-deps chromium` first; auto-starts dev server via `playwright.config.ts` `webServer`)

### Non-obvious notes

- There is no ESLint/TSLint configuration in this project. No lint command is available.
- Karma unit tests require `CHROME_BIN` env var pointing to the Chrome/Chromium binary and `--browsers=ChromeHeadless` for headless execution.
- Playwright config (`playwright.config.ts`) auto-starts the dev server before running e2e tests, so you don't need to start it manually for e2e.
- Many Playwright e2e tests (13/17) have pre-existing failures due to test expectations not matching the actual app behavior (e.g., auth flow test assertions are stale). The 4 passing tests are the reliable baseline.
- The `angular.json` `cli.packageManager` is set to `npm` — use npm, not yarn or pnpm.
