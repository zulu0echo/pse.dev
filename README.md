# Privacy Stewards of Ethereum

Enhancing Ethereum through cryptographic research and collective experimentation.

## Contributing guidelines

### Open for contribution.

- For adding new features, please open PR and first merge to staging/dev for QA, or open issue for suggestion, bug report.
- For any misc. update such as typo, PR to main and two approval is needed.

### Add/Edit article

- For updating/adding a new article [you can follow this guide](content/articles/README.md)

### Add/Edit project list

- For updating/adding project detail [you can follow this guide](content/projects/README.md)

## PR Review process

- Translation PRs: Please tag a member who can help review your translation.
- All PRs: Please clearly state your intention or the purpose of the pull request.
- Suggestions: If you have any suggestions, feel free to open an issue.

## Run Locally

Clone the project

```commandline
  git clone https://github.com/privacy-ethereum/pse.dev
```

Go to the project directory

```commandline
  cd pse.dev
```

Install dependencies

```commandline
  yarn
```

Start the app

```commandline
  yarn dev
```

## Tech Stack

[@shadcn's Nextjs 13 template](https://github.com/shadcn/next-template)

- Next.js 14 App Directory
- Radix UI Primitives
- Tailwind CSS
- Icons from [Lucide](https://lucide.dev)
- Tailwind CSS class sorting, merging and linting.

## PSE Mandate Alignment Dashboard

A static dashboard under `/crops` (CROPS) for tracking project alignment with the EF Mandate (CROPS, leverage removal, subtraction & diffusion). No database: all data lives in `/data/criteria.json` and `/data/state.json`.

### Dev setup

- **Public:** [http://localhost:3000/crops](http://localhost:3000/crops) — landing, projects list, project detail, methodology.
- **Admin:** [http://localhost:3000/crops/admin](http://localhost:3000/crops/admin) — protected; redirects to login if not authenticated.

### Admin login

Set env vars (e.g. in `.env.local`):

- `ADMIN_USER` — admin username
- `ADMIN_PASSWORD` — admin password

Log in at `/crops/admin/login`. Session is stored in an httpOnly cookie.

### Export / commit workflow

- In the scorecard editor, use **Export state.json** to download the current state. Commit the file to `data/state.json` in the repo.
- Optional: set `FILE_WRITE_ENABLED=true` and use **Save to server** to write `data/state.json` on the server (best-effort; requires auth).

### Optional server-write mode

With `FILE_WRITE_ENABLED=true`, the **Save to server** button in the scorecard editor POSTs to `/api/save-state` to overwrite `data/state.json` on disk. Use only in environments where the app has write access to the repo.

## GitHub CROPS Analyzer (“How CROPS are you?”)

Any visitor can run a CROPS analysis on an arbitrary public GitHub repo at [/how-crops-are-you](/how-crops-are-you). No login required. Results are evidence-based (checks with file/line citations and GitHub blob URLs). Visitor-added analyses are separate from PSE projects and scorecards.

### Modes (no database, file-based or client-only)

- **Mode A (default; static-friendly)**  
  Analyses are stored only in the browser (`localStorage`). The page shows “Your recent analyses (in your browser)”. Users can download a single analysis JSON or “Download combined crops_analyses.json” to export their local list.

- **Mode B (optional server persistence)**  
  Set **both** env vars:
  - `PUBLIC_ANALYSIS_PERSISTENCE=true`
  - `FILE_WRITE_ENABLED=true`  
  Then the app can append each run to `data/crops_analyses.json` (rate-limited, max 200 entries). The page shows “Global recent analyses” and GET `/api/crops/analyses` returns the list. If either flag is off, the list is local-only and the page says so.

### Env vars (summary)

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | Optional. Higher rate limits for GitHub API; required to analyze private repos the token can access. |
| `FILE_WRITE_ENABLED` | If `true`, allows writing `data/state.json` (admin save) and, with `PUBLIC_ANALYSIS_PERSISTENCE=true`, `data/crops_analyses.json`. |
| `PUBLIC_ANALYSIS_PERSISTENCE` | With `FILE_WRITE_ENABLED=true`, enables saving public analyzer runs to `data/crops_analyses.json`. |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Admin login for `/crops/admin` (scorecards, project edit, linking repo to project). |

### API (no DB)

- **POST /api/crops/analyze** (public) — Body: `{ repoUrl, ref?, deepScan? }`. Returns analysis JSON (scores, checks with evidence, filesScanned).
- **GET /api/crops/analyses** — Returns global list only when Mode B is on; otherwise 404.
- **POST /api/crops/save** — Appends one analysis to `data/crops_analyses.json` only when Mode B is on; rate-limited and capped.

Admin-only: linking a repo to a PSE project (GitHub repo URL on project edit) and saving that mapping in `data/state.json`. Running the analyzer itself is always public.

## Testing

Quick commands:

```bash
# Run all tests (CI mode)
yarn test

# Watch mode (dev)
yarn test:watch

# UI runner
yarn test:ui

# Coverage report
yarn test:coverage

# Validate setup (sanity checks)
yarn test:validation
```

Notes:

- Tests live in `tests/` with utilities in `tests/test-utils.tsx`.
- Mocks are under `tests/mocks/` (Next components, browser APIs, external libs).
- Use the custom render from `@/tests/test-utils` to get providers.
- Path alias `@/` points to project root.
- jsdom environment is preconfigured.
