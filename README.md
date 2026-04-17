# Econ Conference Tracker

This repository is the public GitHub Pages site for economics conference tracking.

## Public-only model

Only static website assets and sanitized conference data are intended for this public repository.
Internal pipeline files and raw working data stay local and are excluded via `.gitignore`.

## Published contents

- `site/index.html`
- `site/styles.css`
- `site/app.js`
- `site/data/conferences.json` (sanitized, public-safe fields only)
- `.github/workflows/monthly-update-and-deploy.yml` (Pages deployment workflow)

## Deployment

GitHub Actions deploys the `site/` folder to GitHub Pages on:

- `workflow_dispatch`
- pushes to `main` that change `site/**` or the workflow file

## Local update flow

1. Update local internal data/pipeline files (kept outside this public repo scope).
2. Regenerate `site/data/conferences.json` in sanitized form.
3. Commit only public files and push to `main`.
4. Let GitHub Actions deploy the updated site.
