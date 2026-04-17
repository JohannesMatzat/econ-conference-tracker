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

1. Run the local staged refresh pipeline, including the Codex-led discovery scan over broad economics CFP searches.
2. Compare newly discovered Europe-focused future events against the current tracked list and admit only new in-scope conferences.
3. Regenerate `site/data/conferences.json` in sanitized form after validation and benchmark gates pass.
4. Commit only public files and push to `main`.
5. Let GitHub Actions deploy the updated site.
